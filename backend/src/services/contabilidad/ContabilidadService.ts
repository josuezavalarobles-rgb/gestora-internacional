// ========================================
// CONTABILIDAD SERVICE
// Gestión de NCF, gastos, ingresos y distribución
// ========================================

import { PrismaClient, Gasto, Ingreso, NCFSecuencia, TipoNCF, PlanCuentas, DistribucionGasto } from '@prisma/client';
import { logger } from '../../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface CrearGastoDTO {
  organizacionId: string;
  condominioId: string;
  cuentaContableId: string;
  proveedorId?: string;
  numeroFactura?: string;
  tipoNCF?: TipoNCF;
  ncf?: string;
  concepto: string;
  descripcion?: string;
  subtotal: number;
  itbis?: number; // 18% por defecto
  total: number;
  fechaEmision: Date;
  fechaVencimiento?: Date;
  formaPago: string;
  distribuirUnidades: boolean;
  adjuntos?: string[];
  notas?: string;
}

export interface CrearIngresoDTO {
  organizacionId: string;
  condominioId: string;
  cuentaContableId: string;
  unidadId?: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  fechaIngreso: Date;
  metodoPago: string;
  numeroRecibo?: string;
  notas?: string;
}

export interface CrearNCFSecuenciaDTO {
  organizacionId: string;
  tipo: TipoNCF;
  serie: string; // "B01", "B02", etc.
  secuenciaInicio: number;
  secuenciaFin: number;
  fechaVencimiento: Date;
}

export interface CrearPlanCuentasDTO {
  organizacionId: string;
  codigo: string; // "1.1.01", "4.2.01"
  nombre: string;
  tipo: string; // "activo", "pasivo", "patrimonio", "ingreso", "gasto"
  padre?: string; // Código de cuenta padre
  descripcion?: string;
}

export class ContabilidadService {
  private static instance: ContabilidadService;

  private constructor() {}

  public static getInstance(): ContabilidadService {
    if (!ContabilidadService.instance) {
      ContabilidadService.instance = new ContabilidadService();
    }
    return ContabilidadService.instance;
  }

  // ========================================
  // NCF - NÚMEROS DE COMPROBANTE FISCAL
  // ========================================

  /**
   * Crear secuencia de NCF (Dominican Republic)
   */
  async crearSecuenciaNCF(data: CrearNCFSecuenciaDTO): Promise<NCFSecuencia> {
    try {
      logger.info(`Creando secuencia NCF: ${data.serie}`);

      const secuencia = await prisma.nCFSecuencia.create({
        data: {
          organizacionId: data.organizacionId,
          tipo: data.tipo,
          serie: data.serie,
          secuenciaInicio: data.secuenciaInicio,
          secuenciaFin: data.secuenciaFin,
          secuenciaActual: data.secuenciaInicio,
          fechaVencimiento: data.fechaVencimiento,
        },
      });

      logger.info(`✅ Secuencia NCF creada: ${secuencia.id}`);
      return secuencia;
    } catch (error) {
      logger.error('Error al crear secuencia NCF:', error);
      throw error;
    }
  }

  /**
   * Obtener siguiente NCF de una secuencia
   */
  async obtenerSiguienteNCF(organizacionId: string, tipoNCF: TipoNCF): Promise<string> {
    try {
      // Buscar secuencia activa del tipo solicitado
      const secuencia = await prisma.nCFSecuencia.findFirst({
        where: {
          organizacionId,
          tipo: tipoNCF,
          activa: true,
          fechaVencimiento: { gte: new Date() },
          secuenciaActual: { lte: prisma.nCFSecuencia.fields.secuenciaFin },
        },
      });

      if (!secuencia) {
        throw new Error(`No hay secuencia NCF activa para tipo ${tipoNCF}`);
      }

      // Generar NCF: Serie + Número de 8 dígitos
      const numeroNCF = secuencia.secuenciaActual.toString().padStart(8, '0');
      const ncf = `${secuencia.serie}${numeroNCF}`;

      // Incrementar secuencia
      await prisma.nCFSecuencia.update({
        where: { id: secuencia.id },
        data: { secuenciaActual: secuencia.secuenciaActual + 1 },
      });

      logger.info(`✅ NCF generado: ${ncf}`);
      return ncf;
    } catch (error) {
      logger.error('Error al obtener siguiente NCF:', error);
      throw error;
    }
  }

  /**
   * Validar formato de NCF
   */
  validarNCF(ncf: string): boolean {
    // Formato: B01 + 8 dígitos (ejemplo: B0100000001)
    const regex = /^(B01|B02|B14|B15|B16)\d{8}$/;
    return regex.test(ncf);
  }

  // ========================================
  // PLAN DE CUENTAS
  // ========================================

  /**
   * Crear cuenta contable
   */
  async crearCuentaContable(data: CrearPlanCuentasDTO): Promise<PlanCuentas> {
    try {
      logger.info(`Creando cuenta contable: ${data.codigo} - ${data.nombre}`);

      const cuenta = await prisma.planCuentas.create({
        data: {
          organizacionId: data.organizacionId,
          codigo: data.codigo,
          nombre: data.nombre,
          tipo: data.tipo,
          padre: data.padre,
          descripcion: data.descripcion,
        },
      });

      logger.info(`✅ Cuenta contable creada: ${cuenta.id}`);
      return cuenta;
    } catch (error) {
      logger.error('Error al crear cuenta contable:', error);
      throw error;
    }
  }

  /**
   * Obtener plan de cuentas completo
   */
  async obtenerPlanCuentas(organizacionId: string): Promise<PlanCuentas[]> {
    try {
      const cuentas = await prisma.planCuentas.findMany({
        where: {
          organizacionId,
          activa: true,
        },
        orderBy: {
          codigo: 'asc',
        },
      });

      return cuentas;
    } catch (error) {
      logger.error('Error al obtener plan de cuentas:', error);
      throw error;
    }
  }

  // ========================================
  // GASTOS
  // ========================================

  /**
   * Crear gasto con NCF automático
   */
  async crearGasto(data: CrearGastoDTO): Promise<Gasto> {
    try {
      logger.info(`Creando gasto: ${data.concepto}`);

      // Calcular ITBIS si no se proporcionó (18% por defecto en República Dominicana)
      const itbis = data.itbis ?? data.subtotal * 0.18;
      const total = data.total ?? data.subtotal + itbis;

      // Generar NCF si se especificó el tipo
      let ncf = data.ncf;
      let ncfSecuenciaId: string | undefined;

      if (data.tipoNCF && !ncf) {
        ncf = await this.obtenerSiguienteNCF(data.organizacionId, data.tipoNCF);

        // Obtener ID de la secuencia
        const secuencia = await prisma.nCFSecuencia.findFirst({
          where: {
            organizacionId: data.organizacionId,
            tipo: data.tipoNCF,
            activa: true,
          },
        });
        ncfSecuenciaId = secuencia?.id;
      }

      // Crear el gasto
      const gasto = await prisma.gasto.create({
        data: {
          organizacionId: data.organizacionId,
          condominioId: data.condominioId,
          cuentaContableId: data.cuentaContableId,
          proveedorId: data.proveedorId,
          ncfSecuenciaId,
          numeroFactura: data.numeroFactura,
          ncf,
          concepto: data.concepto,
          descripcion: data.descripcion,
          subtotal: new Decimal(data.subtotal),
          itbis: new Decimal(itbis),
          total: new Decimal(total),
          fechaEmision: data.fechaEmision,
          fechaVencimiento: data.fechaVencimiento,
          formaPago: data.formaPago,
          distribuirUnidades: data.distribuirUnidades,
          adjuntos: data.adjuntos,
          notas: data.notas,
        },
        include: {
          proveedor: true,
          cuentaContable: true,
        },
      });

      // Si debe distribuirse entre unidades, crear distribuciones
      if (data.distribuirUnidades) {
        await this.distribuirGastoEntrePropietarios(gasto.id, data.condominioId);
      }

      logger.info(`✅ Gasto creado: ${gasto.id} - NCF: ${ncf || 'N/A'}`);
      return gasto;
    } catch (error) {
      logger.error('Error al crear gasto:', error);
      throw error;
    }
  }

  /**
   * Distribuir gasto entre propietarios según alícuota
   */
  private async distribuirGastoEntrePropietarios(
    gastoId: string,
    condominioId: string
  ): Promise<void> {
    try {
      logger.info(`Distribuyendo gasto ${gastoId} entre propietarios`);

      // Obtener el gasto
      const gasto = await prisma.gasto.findUnique({
        where: { id: gastoId },
      });

      if (!gasto) {
        throw new Error('Gasto no encontrado');
      }

      // Obtener todas las unidades del condominio
      const unidades = await prisma.unidad.findMany({
        where: {
          condominioId,
          activa: true,
        },
      });

      if (unidades.length === 0) {
        logger.warn(`No hay unidades activas en el condominio ${condominioId}`);
        return;
      }

      // Crear distribución para cada unidad según su alícuota
      const distribuciones = unidades.map((unidad) => {
        const montoDistribuido = Number(gasto.total) * Number(unidad.alicuota);

        return prisma.distribucionGasto.create({
          data: {
            gastoId,
            unidadId: unidad.id,
            porcentaje: unidad.alicuota,
            montoDistribuido: new Decimal(montoDistribuido),
          },
        });
      });

      await Promise.all(distribuciones);

      logger.info(`✅ Gasto distribuido entre ${unidades.length} unidades`);
    } catch (error) {
      logger.error('Error al distribuir gasto:', error);
      throw error;
    }
  }

  /**
   * Obtener gastos con filtros
   */
  async obtenerGastos(
    organizacionId: string,
    filtros?: {
      condominioId?: string;
      proveedorId?: string;
      fechaDesde?: Date;
      fechaHasta?: Date;
      pagado?: boolean;
    }
  ): Promise<Gasto[]> {
    try {
      const where: any = { organizacionId };

      if (filtros?.condominioId) {
        where.condominioId = filtros.condominioId;
      }

      if (filtros?.proveedorId) {
        where.proveedorId = filtros.proveedorId;
      }

      if (filtros?.fechaDesde || filtros?.fechaHasta) {
        where.fechaEmision = {};
        if (filtros.fechaDesde) {
          where.fechaEmision.gte = filtros.fechaDesde;
        }
        if (filtros.fechaHasta) {
          where.fechaEmision.lte = filtros.fechaHasta;
        }
      }

      if (filtros?.pagado !== undefined) {
        where.pagado = filtros.pagado;
      }

      const gastos = await prisma.gasto.findMany({
        where,
        include: {
          proveedor: true,
          cuentaContable: true,
          distribuciones: {
            include: {
              unidad: true,
            },
          },
        },
        orderBy: {
          fechaEmision: 'desc',
        },
      });

      return gastos;
    } catch (error) {
      logger.error('Error al obtener gastos:', error);
      throw error;
    }
  }

  /**
   * Marcar gasto como pagado
   */
  async marcarGastoPagado(gastoId: string, fechaPago: Date): Promise<Gasto> {
    try {
      const gasto = await prisma.gasto.update({
        where: { id: gastoId },
        data: {
          pagado: true,
          fechaPago,
        },
      });

      logger.info(`✅ Gasto marcado como pagado: ${gastoId}`);
      return gasto;
    } catch (error) {
      logger.error('Error al marcar gasto como pagado:', error);
      throw error;
    }
  }

  // ========================================
  // INGRESOS
  // ========================================

  /**
   * Crear ingreso
   */
  async crearIngreso(data: CrearIngresoDTO): Promise<Ingreso> {
    try {
      logger.info(`Creando ingreso: ${data.concepto}`);

      const ingreso = await prisma.ingreso.create({
        data: {
          organizacionId: data.organizacionId,
          condominioId: data.condominioId,
          cuentaContableId: data.cuentaContableId,
          unidadId: data.unidadId,
          concepto: data.concepto,
          descripcion: data.descripcion,
          monto: new Decimal(data.monto),
          fechaIngreso: data.fechaIngreso,
          metodoPago: data.metodoPago,
          numeroRecibo: data.numeroRecibo,
          notas: data.notas,
        },
        include: {
          cuentaContable: true,
          unidad: true,
        },
      });

      logger.info(`✅ Ingreso creado: ${ingreso.id}`);
      return ingreso;
    } catch (error) {
      logger.error('Error al crear ingreso:', error);
      throw error;
    }
  }

  /**
   * Obtener ingresos con filtros
   */
  async obtenerIngresos(
    organizacionId: string,
    filtros?: {
      condominioId?: string;
      unidadId?: string;
      fechaDesde?: Date;
      fechaHasta?: Date;
    }
  ): Promise<Ingreso[]> {
    try {
      const where: any = { organizacionId };

      if (filtros?.condominioId) {
        where.condominioId = filtros.condominioId;
      }

      if (filtros?.unidadId) {
        where.unidadId = filtros.unidadId;
      }

      if (filtros?.fechaDesde || filtros?.fechaHasta) {
        where.fechaIngreso = {};
        if (filtros.fechaDesde) {
          where.fechaIngreso.gte = filtros.fechaDesde;
        }
        if (filtros.fechaHasta) {
          where.fechaIngreso.lte = filtros.fechaHasta;
        }
      }

      const ingresos = await prisma.ingreso.findMany({
        where,
        include: {
          cuentaContable: true,
          unidad: true,
        },
        orderBy: {
          fechaIngreso: 'desc',
        },
      });

      return ingresos;
    } catch (error) {
      logger.error('Error al obtener ingresos:', error);
      throw error;
    }
  }

  // ========================================
  // REPORTES CONTABLES
  // ========================================

  /**
   * Balance de saldos por condominio
   */
  async obtenerBalanceSaldos(
    condominioId: string,
    fechaDesde: Date,
    fechaHasta: Date
  ): Promise<{
    totalIngresos: number;
    totalGastos: number;
    saldo: number;
  }> {
    try {
      const [ingresos, gastos] = await Promise.all([
        prisma.ingreso.aggregate({
          where: {
            condominioId,
            fechaIngreso: {
              gte: fechaDesde,
              lte: fechaHasta,
            },
          },
          _sum: {
            monto: true,
          },
        }),
        prisma.gasto.aggregate({
          where: {
            condominioId,
            fechaEmision: {
              gte: fechaDesde,
              lte: fechaHasta,
            },
          },
          _sum: {
            total: true,
          },
        }),
      ]);

      const totalIngresos = Number(ingresos._sum.monto || 0);
      const totalGastos = Number(gastos._sum.total || 0);
      const saldo = totalIngresos - totalGastos;

      return {
        totalIngresos,
        totalGastos,
        saldo,
      };
    } catch (error) {
      logger.error('Error al obtener balance de saldos:', error);
      throw error;
    }
  }

  /**
   * Reporte de gastos por categoría
   */
  async obtenerGastosPorCategoria(
    condominioId: string,
    fechaDesde: Date,
    fechaHasta: Date
  ): Promise<Array<{ categoria: string; total: number; cantidad: number }>> {
    try {
      const gastos = await prisma.gasto.groupBy({
        by: ['cuentaContableId'],
        where: {
          condominioId,
          fechaEmision: {
            gte: fechaDesde,
            lte: fechaHasta,
          },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      });

      // Obtener nombres de cuentas
      const resultado = await Promise.all(
        gastos.map(async (gasto) => {
          const cuenta = await prisma.planCuentas.findUnique({
            where: { id: gasto.cuentaContableId },
          });

          return {
            categoria: cuenta?.nombre || 'Sin categoría',
            total: Number(gasto._sum.total || 0),
            cantidad: gasto._count.id,
          };
        })
      );

      return resultado.sort((a, b) => b.total - a.total);
    } catch (error) {
      logger.error('Error al obtener gastos por categoría:', error);
      throw error;
    }
  }
}
