// ========================================
// UNIDAD SERVICE
// Gestión de unidades con alícuota y dependientes
// ========================================

import { PrismaClient, Unidad, Dependiente, Vehiculo } from '@prisma/client';
import { logger } from '../../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface CrearUnidadDTO {
  condominioId: string;
  numero: string; // "402", "12-A", "PH-1"
  alicuota: number; // Porcentaje de participación (0.05 = 5%)
  propietarioId?: string;
  metraje?: number;
  habitaciones?: number;
  banos?: number;
  parqueos?: number;
  nivel?: string;
  telefono?: string;
  emailContacto?: string;
  inquilino?: boolean;
  nombreInquilino?: string;
  telefonoInquilino?: string;
  notas?: string;
}

export interface CrearDependienteDTO {
  unidadId: string;
  nombre: string;
  parentesco: string; // "hijo", "hija", "cónyuge", "padre", "madre", etc.
  cedula?: string;
  fechaNacimiento?: Date;
  telefono?: string;
  autorizadoRetirar?: boolean;
}

export interface CrearVehiculoDTO {
  unidadId: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  ano?: number;
  tipo?: string; // "automovil", "motocicleta", "suv", "camioneta"
}

export class UnidadService {
  private static instance: UnidadService;

  private constructor() {}

  public static getInstance(): UnidadService {
    if (!UnidadService.instance) {
      UnidadService.instance = new UnidadService();
    }
    return UnidadService.instance;
  }

  /**
   * Crear unidad
   */
  async crearUnidad(data: CrearUnidadDTO): Promise<Unidad> {
    try {
      logger.info(`Creando unidad: ${data.numero} - Alícuota: ${data.alicuota * 100}%`);

      const unidad = await prisma.unidad.create({
        data: {
          condominioId: data.condominioId,
          numero: data.numero,
          alicuota: new Decimal(data.alicuota),
          propietarioId: data.propietarioId,
          metraje: data.metraje ? new Decimal(data.metraje) : null,
          habitaciones: data.habitaciones,
          banos: data.banos,
          parqueos: data.parqueos,
          nivel: data.nivel,
          telefono: data.telefono,
          emailContacto: data.emailContacto,
          inquilino: data.inquilino || false,
          nombreInquilino: data.nombreInquilino,
          telefonoInquilino: data.telefonoInquilino,
          notas: data.notas,
        },
        include: {
          propietario: true,
          condominio: true,
        },
      });

      logger.info(`✅ Unidad creada: ${unidad.id}`);
      return unidad;
    } catch (error) {
      logger.error('Error al crear unidad:', error);
      throw error;
    }
  }

  /**
   * Obtener unidades de un condominio
   */
  async obtenerUnidades(
    condominioId: string,
    filtros?: {
      activa?: boolean;
      propietarioId?: string;
      buscar?: string;
    }
  ): Promise<Unidad[]> {
    try {
      const where: any = { condominioId };

      if (filtros?.activa !== undefined) {
        where.activa = filtros.activa;
      }

      if (filtros?.propietarioId) {
        where.propietarioId = filtros.propietarioId;
      }

      if (filtros?.buscar) {
        where.OR = [
          { numero: { contains: filtros.buscar, mode: 'insensitive' } },
          { nivel: { contains: filtros.buscar, mode: 'insensitive' } },
        ];
      }

      const unidades = await prisma.unidad.findMany({
        where,
        include: {
          propietario: true,
          condominio: true,
          dependientes: {
            where: { activo: true },
          },
          vehiculos: {
            where: { activo: true },
          },
          _count: {
            select: {
              dependientes: true,
              vehiculos: true,
              distribuciones: true,
            },
          },
        },
        orderBy: {
          numero: 'asc',
        },
      });

      return unidades;
    } catch (error) {
      logger.error('Error al obtener unidades:', error);
      throw error;
    }
  }

  /**
   * Obtener unidad por ID con detalles completos
   */
  async obtenerUnidadPorId(unidadId: string): Promise<Unidad | null> {
    try {
      const unidad = await prisma.unidad.findUnique({
        where: { id: unidadId },
        include: {
          propietario: true,
          condominio: true,
          dependientes: {
            where: { activo: true },
            orderBy: { nombre: 'asc' },
          },
          vehiculos: {
            where: { activo: true },
            orderBy: { placa: 'asc' },
          },
          distribuciones: {
            include: {
              gasto: {
                include: {
                  proveedor: true,
                  cuentaContable: true,
                },
              },
            },
            orderBy: {
              gasto: { fechaEmision: 'desc' },
            },
            take: 20,
          },
          transacciones: {
            orderBy: { fecha: 'desc' },
            take: 10,
          },
        },
      });

      return unidad;
    } catch (error) {
      logger.error('Error al obtener unidad:', error);
      throw error;
    }
  }

  /**
   * Actualizar unidad
   */
  async actualizarUnidad(
    unidadId: string,
    data: Partial<CrearUnidadDTO>
  ): Promise<Unidad> {
    try {
      logger.info(`Actualizando unidad: ${unidadId}`);

      const updateData: any = { ...data };

      // Convertir alícuota a Decimal si existe
      if (data.alicuota !== undefined) {
        updateData.alicuota = new Decimal(data.alicuota);
      }

      // Convertir metraje a Decimal si existe
      if (data.metraje !== undefined) {
        updateData.metraje = new Decimal(data.metraje);
      }

      const unidad = await prisma.unidad.update({
        where: { id: unidadId },
        data: updateData,
        include: {
          propietario: true,
          condominio: true,
        },
      });

      logger.info(`✅ Unidad actualizada: ${unidad.id}`);
      return unidad;
    } catch (error) {
      logger.error('Error al actualizar unidad:', error);
      throw error;
    }
  }

  /**
   * Validar que las alícuotas sumen 100% en un condominio
   */
  async validarAlicuotasCondominio(condominioId: string): Promise<{
    valido: boolean;
    sumaTotal: number;
    diferencia: number;
  }> {
    try {
      const resultado = await prisma.unidad.aggregate({
        where: {
          condominioId,
          activa: true,
        },
        _sum: {
          alicuota: true,
        },
      });

      const sumaTotal = Number(resultado._sum.alicuota || 0);
      const diferencia = Math.abs(1 - sumaTotal);
      const valido = diferencia < 0.0001; // Tolerancia de 0.01%

      if (!valido) {
        logger.warn(
          `⚠️ Alícuotas del condominio ${condominioId} suman ${(sumaTotal * 100).toFixed(4)}% (diferencia: ${(diferencia * 100).toFixed(4)}%)`
        );
      }

      return {
        valido,
        sumaTotal,
        diferencia,
      };
    } catch (error) {
      logger.error('Error al validar alícuotas:', error);
      throw error;
    }
  }

  // ========================================
  // DEPENDIENTES
  // ========================================

  /**
   * Agregar dependiente a unidad
   */
  async agregarDependiente(data: CrearDependienteDTO): Promise<Dependiente> {
    try {
      logger.info(`Agregando dependiente: ${data.nombre} a unidad ${data.unidadId}`);

      const dependiente = await prisma.dependiente.create({
        data: {
          unidadId: data.unidadId,
          nombre: data.nombre,
          parentesco: data.parentesco,
          cedula: data.cedula,
          fechaNacimiento: data.fechaNacimiento,
          telefono: data.telefono,
          autorizadoRetirar: data.autorizadoRetirar || false,
        },
        include: {
          unidad: true,
        },
      });

      logger.info(`✅ Dependiente agregado: ${dependiente.id}`);
      return dependiente;
    } catch (error) {
      logger.error('Error al agregar dependiente:', error);
      throw error;
    }
  }

  /**
   * Obtener dependientes de una unidad
   */
  async obtenerDependientes(unidadId: string): Promise<Dependiente[]> {
    try {
      const dependientes = await prisma.dependiente.findMany({
        where: {
          unidadId,
          activo: true,
        },
        include: {
          unidad: true,
        },
        orderBy: {
          nombre: 'asc',
        },
      });

      return dependientes;
    } catch (error) {
      logger.error('Error al obtener dependientes:', error);
      throw error;
    }
  }

  /**
   * Eliminar (desactivar) dependiente
   */
  async eliminarDependiente(dependienteId: string): Promise<void> {
    try {
      await prisma.dependiente.update({
        where: { id: dependienteId },
        data: { activo: false },
      });

      logger.info(`✅ Dependiente desactivado: ${dependienteId}`);
    } catch (error) {
      logger.error('Error al eliminar dependiente:', error);
      throw error;
    }
  }

  // ========================================
  // VEHÍCULOS
  // ========================================

  /**
   * Registrar vehículo
   */
  async registrarVehiculo(data: CrearVehiculoDTO): Promise<Vehiculo> {
    try {
      logger.info(`Registrando vehículo: ${data.placa} a unidad ${data.unidadId}`);

      const vehiculo = await prisma.vehiculo.create({
        data: {
          unidadId: data.unidadId,
          placa: data.placa.toUpperCase(),
          marca: data.marca,
          modelo: data.modelo,
          color: data.color,
          ano: data.ano,
          tipo: data.tipo || 'automovil',
        },
        include: {
          unidad: true,
        },
      });

      logger.info(`✅ Vehículo registrado: ${vehiculo.id}`);
      return vehiculo;
    } catch (error) {
      logger.error('Error al registrar vehículo:', error);
      throw error;
    }
  }

  /**
   * Obtener vehículos de una unidad
   */
  async obtenerVehiculos(unidadId: string): Promise<Vehiculo[]> {
    try {
      const vehiculos = await prisma.vehiculo.findMany({
        where: {
          unidadId,
          activo: true,
        },
        include: {
          unidad: true,
        },
        orderBy: {
          placa: 'asc',
        },
      });

      return vehiculos;
    } catch (error) {
      logger.error('Error al obtener vehículos:', error);
      throw error;
    }
  }

  /**
   * Buscar vehículo por placa (en todo el condominio)
   */
  async buscarVehiculoPorPlaca(
    condominioId: string,
    placa: string
  ): Promise<Vehiculo | null> {
    try {
      const vehiculo = await prisma.vehiculo.findFirst({
        where: {
          placa: placa.toUpperCase(),
          activo: true,
          unidad: {
            condominioId,
            activa: true,
          },
        },
        include: {
          unidad: {
            include: {
              propietario: true,
            },
          },
        },
      });

      return vehiculo;
    } catch (error) {
      logger.error('Error al buscar vehículo por placa:', error);
      throw error;
    }
  }

  /**
   * Eliminar (desactivar) vehículo
   */
  async eliminarVehiculo(vehiculoId: string): Promise<void> {
    try {
      await prisma.vehiculo.update({
        where: { id: vehiculoId },
        data: { activo: false },
      });

      logger.info(`✅ Vehículo desactivado: ${vehiculoId}`);
    } catch (error) {
      logger.error('Error al eliminar vehículo:', error);
      throw error;
    }
  }

  // ========================================
  // ESTADÍSTICAS
  // ========================================

  /**
   * Obtener estadísticas de ocupación del condominio
   */
  async obtenerEstadisticasOcupacion(
    condominioId: string
  ): Promise<{
    totalUnidades: number;
    unidadesActivas: number;
    unidadesOcupadas: number;
    unidadesDesocupadas: number;
    unidadesConInquilinos: number;
    totalDependientes: number;
    totalVehiculos: number;
  }> {
    try {
      const [unidades, dependientes, vehiculos] = await Promise.all([
        prisma.unidad.findMany({
          where: { condominioId },
          include: {
            _count: {
              select: {
                dependientes: true,
                vehiculos: true,
              },
            },
          },
        }),
        prisma.unidad.aggregate({
          where: { condominioId, activa: true },
          _count: {
            dependientes: true,
          },
        }),
        prisma.unidad.aggregate({
          where: { condominioId, activa: true },
          _count: {
            vehiculos: true,
          },
        }),
      ]);

      const totalUnidades = unidades.length;
      const unidadesActivas = unidades.filter((u) => u.activa).length;
      const unidadesOcupadas = unidades.filter(
        (u) => u.activa && u.propietarioId
      ).length;
      const unidadesDesocupadas = unidadesActivas - unidadesOcupadas;
      const unidadesConInquilinos = unidades.filter(
        (u) => u.activa && u.inquilino
      ).length;

      return {
        totalUnidades,
        unidadesActivas,
        unidadesOcupadas,
        unidadesDesocupadas,
        unidadesConInquilinos,
        totalDependientes: dependientes._count.dependientes,
        totalVehiculos: vehiculos._count.vehiculos,
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de ocupación:', error);
      throw error;
    }
  }
}
