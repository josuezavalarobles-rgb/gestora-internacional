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
  inquilinoId?: string;
  metrosCuadrados?: number;
  habitaciones?: number;
  banos?: number;
  estacionamientos?: number;
  piso?: number;
  edificio?: string;
  telefono?: string;
  telefonoEmergencia?: string;
  emailContacto?: string;
  notas?: string;
}

export interface CrearDependienteDTO {
  unidadId: string;
  nombreCompleto: string;
  relacion: 'conyuge' | 'hijo' | 'padre' | 'otro_familiar' | 'empleado_domestico';
  cedula?: string;
  telefono?: string;
  fotoUrl?: string;
}

export interface CrearVehiculoDTO {
  unidadId: string;
  placa: string;
  marca?: string;
  modelo?: string;
  color?: string;
  tipo: 'automovil' | 'motocicleta' | 'camioneta' | 'camion' | 'bicicleta' | 'otro';
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
          tipo: 'apartamento', // Default value
          alicuota: new Decimal(data.alicuota),
          propietarioId: data.propietarioId,
          inquilinoId: data.inquilinoId,
          metrosCuadrados: data.metrosCuadrados ? new Decimal(data.metrosCuadrados) : undefined,
          habitaciones: data.habitaciones,
          banos: data.banos,
          estacionamientos: data.estacionamientos,
          piso: data.piso,
          edificio: data.edificio,
          telefonoEmergencia: data.telefonoEmergencia,
          emailContacto: data.emailContacto,
          notas: data.notas,
        },
        include: {
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
    condominioIdOrFiltros: string | { condominioId: string; tipo?: any; estado?: any },
    filtros?: {
      estado?: 'ocupada' | 'vacia' | 'en_renta' | 'en_venta';
      propietarioId?: string;
      buscar?: string;
    }
  ): Promise<Unidad[]> {
    try {
      let condominioId: string;
      let where: any = {};

      // Manejar los dos formatos de llamada
      if (typeof condominioIdOrFiltros === 'string') {
        condominioId = condominioIdOrFiltros;
        where = { condominioId };

        if (filtros?.estado !== undefined) {
          where.estado = filtros.estado;
        }

        if (filtros?.propietarioId) {
          where.propietarioId = filtros.propietarioId;
        }

        if (filtros?.buscar) {
          where.OR = [
            { numero: { contains: filtros.buscar, mode: 'insensitive' } },
            { edificio: { contains: filtros.buscar, mode: 'insensitive' } },
          ];
        }
      } else {
        // Formato de objeto
        condominioId = condominioIdOrFiltros.condominioId;
        where = { condominioId };

        if (condominioIdOrFiltros.tipo) {
          where.tipo = condominioIdOrFiltros.tipo;
        }

        if (condominioIdOrFiltros.estado) {
          where.estado = condominioIdOrFiltros.estado;
        }
      }

      const unidades = await prisma.unidad.findMany({
        where,
        include: {
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
              distribucionGastos: true,
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
          condominio: true,
          dependientes: {
            where: { activo: true },
            orderBy: { nombreCompleto: 'asc' },
          },
          vehiculos: {
            where: { activo: true },
            orderBy: { placa: 'asc' },
          },
          distribucionGastos: {
            include: {
              gasto: {
                include: {
                  proveedor: true,
                  cuentaContable: true,
                },
              },
            },
            orderBy: {
              fechaCreacion: 'desc',
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

      // Convertir metrosCuadrados a Decimal si existe
      if (data.metrosCuadrados !== undefined) {
        updateData.metrosCuadrados = new Decimal(data.metrosCuadrados);
      }

      const unidad = await prisma.unidad.update({
        where: { id: unidadId },
        data: updateData,
        include: {
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
          estado: 'ocupada', // Solo contar unidades ocupadas
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
      logger.info(`Agregando dependiente: ${data.nombreCompleto} a unidad ${data.unidadId}`);

      const dependiente = await prisma.dependiente.create({
        data: {
          unidadId: data.unidadId,
          nombreCompleto: data.nombreCompleto,
          relacion: data.relacion,
          cedula: data.cedula,
          telefono: data.telefono,
          fotoUrl: data.fotoUrl,
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
          nombreCompleto: 'asc',
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
          tipo: data.tipo,
          marca: data.marca,
          modelo: data.modelo,
          color: data.color,
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
    unidadesOcupadas: number;
    unidadesVacias: number;
    unidadesEnRenta: number;
    unidadesEnVenta: number;
    totalDependientes: number;
    totalVehiculos: number;
  }> {
    try {
      const unidades = await prisma.unidad.findMany({
        where: { condominioId },
        include: {
          _count: {
            select: {
              dependientes: true,
              vehiculos: true,
            },
          },
        },
      });

      const totalUnidades = unidades.length;
      const unidadesOcupadas = unidades.filter((u) => u.estado === 'ocupada').length;
      const unidadesVacias = unidades.filter((u) => u.estado === 'vacia').length;
      const unidadesEnRenta = unidades.filter((u) => u.estado === 'en_renta').length;
      const unidadesEnVenta = unidades.filter((u) => u.estado === 'en_venta').length;

      const totalDependientes = unidades.reduce((sum, u) => sum + (u._count?.dependientes || 0), 0);
      const totalVehiculos = unidades.reduce((sum, u) => sum + (u._count?.vehiculos || 0), 0);

      return {
        totalUnidades,
        unidadesOcupadas,
        unidadesVacias,
        unidadesEnRenta,
        unidadesEnVenta,
        totalDependientes,
        totalVehiculos,
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de ocupación:', error);
      throw error;
    }
  }

  /**
   * Obtener unidad de un usuario
   */
  async obtenerUnidadUsuario(usuarioId: string): Promise<Unidad | null> {
    try {
      const unidad = await prisma.unidad.findFirst({
        where: {
          OR: [
            { propietarioId: usuarioId },
            { inquilinoId: usuarioId },
          ],
        },
        include: {
          condominio: true,
          dependientes: {
            where: { activo: true },
          },
          vehiculos: {
            where: { activo: true },
          },
        },
      });

      return unidad;
    } catch (error) {
      logger.error('Error al obtener unidad de usuario:', error);
      throw error;
    }
  }

  /**
   * Asignar propietario a unidad
   */
  async asignarPropietario(unidadId: string, propietarioId: string): Promise<Unidad> {
    try {
      const unidad = await prisma.unidad.update({
        where: { id: unidadId },
        data: { propietarioId },
        include: {
          condominio: true,
        },
      });

      logger.info(`✅ Propietario asignado a unidad: ${unidadId}`);
      return unidad;
    } catch (error) {
      logger.error('Error al asignar propietario:', error);
      throw error;
    }
  }

  /**
   * Asignar inquilino a unidad
   */
  async asignarInquilino(unidadId: string, inquilinoId: string): Promise<Unidad> {
    try {
      const unidad = await prisma.unidad.update({
        where: { id: unidadId },
        data: { inquilinoId },
        include: {
          condominio: true,
        },
      });

      logger.info(`✅ Inquilino asignado a unidad: ${unidadId}`);
      return unidad;
    } catch (error) {
      logger.error('Error al asignar inquilino:', error);
      throw error;
    }
  }

  /**
   * Actualizar dependiente
   */
  async actualizarDependiente(dependienteId: string, data: Partial<CrearDependienteDTO>): Promise<Dependiente> {
    try {
      const dependiente = await prisma.dependiente.update({
        where: { id: dependienteId },
        data,
        include: {
          unidad: true,
        },
      });

      logger.info(`✅ Dependiente actualizado: ${dependienteId}`);
      return dependiente;
    } catch (error) {
      logger.error('Error al actualizar dependiente:', error);
      throw error;
    }
  }

  /**
   * Agregar vehículo (alias de registrarVehiculo)
   */
  async agregarVehiculo(data: CrearVehiculoDTO): Promise<Vehiculo> {
    return this.registrarVehiculo(data);
  }

  /**
   * Actualizar vehículo
   */
  async actualizarVehiculo(vehiculoId: string, data: Partial<CrearVehiculoDTO>): Promise<Vehiculo> {
    try {
      const updateData: any = { ...data };
      if (data.placa) {
        updateData.placa = data.placa.toUpperCase();
      }

      const vehiculo = await prisma.vehiculo.update({
        where: { id: vehiculoId },
        data: updateData,
        include: {
          unidad: true,
        },
      });

      logger.info(`✅ Vehículo actualizado: ${vehiculoId}`);
      return vehiculo;
    } catch (error) {
      logger.error('Error al actualizar vehículo:', error);
      throw error;
    }
  }

  /**
   * Buscar vehículo por placa (solo placa)
   */
  async buscarVehiculoPorPlaca(placa: string): Promise<Vehiculo | null> {
    try {
      const vehiculo = await prisma.vehiculo.findFirst({
        where: {
          placa: placa.toUpperCase(),
          activo: true,
        },
        include: {
          unidad: {
            include: {
              condominio: true,
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
}
