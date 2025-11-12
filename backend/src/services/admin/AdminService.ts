/**
 * ========================================
 * ADMIN SERVICE
 * Gestión administrativa y limpieza de datos
 * ========================================
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export class AdminService {
  private static instance: AdminService;

  private constructor() {}

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  /**
   * Limpiar TODOS los datos de prueba
   * ⚠️ PELIGROSO: Elimina toda la información
   */
  async limpiarTodosLosDatos(): Promise<{
    success: boolean;
    message: string;
    eliminados: Record<string, number>;
  }> {
    try {
      logger.warn('🗑️  Iniciando limpieza COMPLETA de base de datos...');

      const eliminados: Record<string, number> = {};

      // Orden de eliminación (respetando foreign keys)

      // 1. Facturas IA y Predicciones
      const facturasIA = await prisma.facturaIAProcesada.deleteMany({});
      eliminados.facturasIA = facturasIA.count;

      const predicciones = await prisma.prediccionIA.deleteMany({});
      eliminados.predicciones = predicciones.count;

      // 2. Evaluaciones de proveedores
      const evaluaciones = await prisma.evaluacionProveedor.deleteMany({});
      eliminados.evaluaciones = evaluaciones.count;

      // 3. Estados de cuenta y transacciones
      const transacciones = await prisma.transaccionEstadoCuenta.deleteMany({});
      eliminados.transacciones = transacciones.count;

      const estadosCuenta = await prisma.estadoCuenta.deleteMany({});
      eliminados.estadosCuenta = estadosCuenta.count;

      // 4. Gastos e Ingresos
      const gastos = await prisma.gasto.deleteMany({});
      eliminados.gastos = gastos.count;

      const ingresos = await prisma.ingreso.deleteMany({});
      eliminados.ingresos = ingresos.count;

      // 5. Unidades
      const unidades = await prisma.unidad.deleteMany({});
      eliminados.unidades = unidades.count;

      // 6. Proveedores
      const proveedores = await prisma.proveedor.deleteMany({});
      eliminados.proveedores = proveedores.count;

      // 7. Plan de cuentas
      const cuentas = await prisma.cuentaContable.deleteMany({});
      eliminados.cuentasContables = cuentas.count;

      // 8. Secuencias NCF
      const secuencias = await prisma.secuenciaNCF.deleteMany({});
      eliminados.secuenciasNCF = secuencias.count;

      // 9. Condominios
      const condominios = await prisma.condominio.deleteMany({});
      eliminados.condominios = condominios.count;

      // 10. Usuarios (excepto admin principal si quieres conservarlo)
      const usuarios = await prisma.usuario.deleteMany({
        where: {
          NOT: {
            email: 'admin@gestorainternacional.com',
          },
        },
      });
      eliminados.usuarios = usuarios.count;

      // 11. Organizaciones
      const organizaciones = await prisma.organizacion.deleteMany({});
      eliminados.organizaciones = organizaciones.count;

      logger.info('✅ Limpieza completada exitosamente');

      return {
        success: true,
        message: 'Todos los datos han sido eliminados',
        eliminados,
      };
    } catch (error) {
      logger.error('❌ Error al limpiar datos:', error);
      throw new Error(`Error al limpiar datos: ${error}`);
    }
  }

  /**
   * Limpiar solo datos de DEMO (mantiene estructura)
   * Elimina org-demo-001 y todo lo relacionado
   */
  async limpiarDatosDemo(): Promise<{
    success: boolean;
    message: string;
    eliminados: Record<string, number>;
  }> {
    try {
      logger.warn('🗑️  Limpiando datos de DEMO (org-demo-001)...');

      const eliminados: Record<string, number> = {};

      const orgDemo = await prisma.organizacion.findUnique({
        where: { id: 'org-demo-001' },
      });

      if (!orgDemo) {
        return {
          success: false,
          message: 'No se encontró la organización demo',
          eliminados: {},
        };
      }

      // Eliminar en cascada todo lo relacionado con org-demo-001

      // 1. Facturas IA y Predicciones
      const facturasIA = await prisma.facturaIAProcesada.deleteMany({
        where: { organizacionId: orgDemo.id },
      });
      eliminados.facturasIA = facturasIA.count;

      // 2. Estados de cuenta de condominios demo
      const condominiosDemo = await prisma.condominio.findMany({
        where: { organizacionId: orgDemo.id },
        select: { id: true },
      });

      const condominioIds = condominiosDemo.map((c) => c.id);

      const predicciones = await prisma.prediccionIA.deleteMany({
        where: { condominioId: { in: condominioIds } },
      });
      eliminados.predicciones = predicciones.count;

      // 3. Evaluaciones de proveedores demo
      const proveedoresDemo = await prisma.proveedor.findMany({
        where: { organizacionId: orgDemo.id },
        select: { id: true },
      });

      const proveedorIds = proveedoresDemo.map((p) => p.id);

      const evaluaciones = await prisma.evaluacionProveedor.deleteMany({
        where: { proveedorId: { in: proveedorIds } },
      });
      eliminados.evaluaciones = evaluaciones.count;

      // 4. Unidades de condominios demo
      const unidadesDemo = await prisma.unidad.findMany({
        where: { condominioId: { in: condominioIds } },
        select: { id: true },
      });

      const unidadIds = unidadesDemo.map((u) => u.id);

      // 5. Transacciones y estados de cuenta
      const transacciones = await prisma.transaccionEstadoCuenta.deleteMany({
        where: {
          estadoCuenta: {
            unidadId: { in: unidadIds },
          },
        },
      });
      eliminados.transacciones = transacciones.count;

      const estadosCuenta = await prisma.estadoCuenta.deleteMany({
        where: { unidadId: { in: unidadIds } },
      });
      eliminados.estadosCuenta = estadosCuenta.count;

      // 6. Gastos e Ingresos
      const gastos = await prisma.gasto.deleteMany({
        where: { organizacionId: orgDemo.id },
      });
      eliminados.gastos = gastos.count;

      const ingresos = await prisma.ingreso.deleteMany({
        where: { organizacionId: orgDemo.id },
      });
      eliminados.ingresos = ingresos.count;

      // 7. Unidades
      const unidades = await prisma.unidad.deleteMany({
        where: { condominioId: { in: condominioIds } },
      });
      eliminados.unidades = unidades.count;

      // 8. Proveedores
      const proveedores = await prisma.proveedor.deleteMany({
        where: { organizacionId: orgDemo.id },
      });
      eliminados.proveedores = proveedores.count;

      // 9. Plan de cuentas
      const cuentas = await prisma.cuentaContable.deleteMany({
        where: { organizacionId: orgDemo.id },
      });
      eliminados.cuentasContables = cuentas.count;

      // 10. Secuencias NCF
      const secuencias = await prisma.secuenciaNCF.deleteMany({
        where: { organizacionId: orgDemo.id },
      });
      eliminados.secuenciasNCF = secuencias.count;

      // 11. Condominios
      const condominios = await prisma.condominio.deleteMany({
        where: { organizacionId: orgDemo.id },
      });
      eliminados.condominios = condominios.count;

      // 12. Usuarios demo (excepto admin)
      const usuarios = await prisma.usuario.deleteMany({
        where: {
          organizacionId: orgDemo.id,
          NOT: {
            email: 'admin@gestorainternacional.com',
          },
        },
      });
      eliminados.usuarios = usuarios.count;

      // 13. Organización demo
      await prisma.organizacion.delete({
        where: { id: orgDemo.id },
      });
      eliminados.organizaciones = 1;

      logger.info('✅ Datos demo eliminados exitosamente');

      return {
        success: true,
        message: 'Datos de demostración eliminados',
        eliminados,
      };
    } catch (error) {
      logger.error('❌ Error al limpiar datos demo:', error);
      throw new Error(`Error al limpiar datos demo: ${error}`);
    }
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  async obtenerEstadisticas(): Promise<{
    organizaciones: number;
    condominios: number;
    unidades: number;
    usuarios: number;
    proveedores: number;
    gastos: number;
    ingresos: number;
    estadosCuenta: number;
  }> {
    try {
      const [
        organizaciones,
        condominios,
        unidades,
        usuarios,
        proveedores,
        gastos,
        ingresos,
        estadosCuenta,
      ] = await Promise.all([
        prisma.organizacion.count(),
        prisma.condominio.count(),
        prisma.unidad.count(),
        prisma.usuario.count(),
        prisma.proveedor.count(),
        prisma.gasto.count(),
        prisma.ingreso.count(),
        prisma.estadoCuenta.count(),
      ]);

      return {
        organizaciones,
        condominios,
        unidades,
        usuarios,
        proveedores,
        gastos,
        ingresos,
        estadosCuenta,
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
}
