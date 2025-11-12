// ========================================
// AREAS COMUNES SERVICE
// Gestión de áreas comunes y reservaciones
// ========================================

import { PrismaClient, AreaComun, ReservaArea, TipoAreaComun } from '@prisma/client';
import { logger } from '../../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface CrearAreaComunDTO {
  condominioId: string;
  nombre: string;
  tipo: TipoAreaComun;
  descripcion?: string;
  capacidadMaxima?: number;
  costoPorHora?: number;
  horarioApertura?: string; // "08:00"
  horarioCierre?: string; // "22:00"
  diasDisponibles?: string[]; // ["lunes", "martes", ...]
  requiereAprobacion?: boolean;
  tiempoMinimoReserva?: number; // Horas
  tiempoMaximoReserva?: number; // Horas
  anticipacionMinima?: number; // Días de anticipación
  normas?: string;
  foto?: string;
}

export interface CrearReservaDTO {
  areaId: string;
  unidadId: string;
  fechaInicio: Date;
  fechaFin: Date;
  cantidadPersonas?: number;
  proposito?: string;
  observaciones?: string;
}

export class AreasComunesService {
  private static instance: AreasComunesService;

  private constructor() {}

  public static getInstance(): AreasComunesService {
    if (!AreasComunesService.instance) {
      AreasComunesService.instance = new AreasComunesService();
    }
    return AreasComunesService.instance;
  }

  // ========================================
  // ÁREAS COMUNES
  // ========================================

  /**
   * Crear área común
   */
  async crearAreaComun(data: CrearAreaComunDTO): Promise<AreaComun> {
    try {
      logger.info(`Creando área común: ${data.nombre}`);

      const area = await prisma.areaComun.create({
        data: {
          condominioId: data.condominioId,
          nombre: data.nombre,
          tipo: data.tipo,
          descripcion: data.descripcion,
          capacidadMaxima: data.capacidadMaxima,
          costoPorHora: data.costoPorHora ? new Decimal(data.costoPorHora) : null,
          horarioApertura: data.horarioApertura,
          horarioCierre: data.horarioCierre,
          diasDisponibles: data.diasDisponibles,
          requiereAprobacion: data.requiereAprobacion || false,
          tiempoMinimoReserva: data.tiempoMinimoReserva || 1,
          tiempoMaximoReserva: data.tiempoMaximoReserva || 8,
          anticipacionMinima: data.anticipacionMinima || 1,
          normas: data.normas,
          foto: data.foto,
        },
      });

      logger.info(`✅ Área común creada: ${area.id}`);
      return area;
    } catch (error) {
      logger.error('Error al crear área común:', error);
      throw error;
    }
  }

  /**
   * Obtener áreas comunes de un condominio
   */
  async obtenerAreasComunes(
    condominioId: string,
    filtros?: {
      tipo?: TipoAreaComun;
      disponible?: boolean;
    }
  ): Promise<AreaComun[]> {
    try {
      const where: any = { condominioId };

      if (filtros?.tipo) {
        where.tipo = filtros.tipo;
      }

      if (filtros?.disponible !== undefined) {
        where.disponible = filtros.disponible;
      }

      const areas = await prisma.areaComun.findMany({
        where,
        include: {
          _count: {
            select: {
              reservas: true,
            },
          },
        },
        orderBy: {
          nombre: 'asc',
        },
      });

      return areas;
    } catch (error) {
      logger.error('Error al obtener áreas comunes:', error);
      throw error;
    }
  }

  /**
   * Actualizar área común
   */
  async actualizarAreaComun(
    areaId: string,
    data: Partial<CrearAreaComunDTO>
  ): Promise<AreaComun> {
    try {
      const updateData: any = { ...data };

      if (data.costoPorHora !== undefined) {
        updateData.costoPorHora = new Decimal(data.costoPorHora);
      }

      const area = await prisma.areaComun.update({
        where: { id: areaId },
        data: updateData,
      });

      logger.info(`✅ Área común actualizada: ${areaId}`);
      return area;
    } catch (error) {
      logger.error('Error al actualizar área común:', error);
      throw error;
    }
  }

  // ========================================
  // RESERVAS
  // ========================================

  /**
   * Crear reserva de área común
   */
  async crearReserva(data: CrearReservaDTO): Promise<ReservaArea> {
    try {
      logger.info(`Creando reserva para área ${data.areaId}`);

      // Obtener información del área
      const area = await prisma.areaComun.findUnique({
        where: { id: data.areaId },
      });

      if (!area) {
        throw new Error('Área común no encontrada');
      }

      if (!area.disponible) {
        throw new Error('Área común no disponible para reservas');
      }

      // Validar anticipación mínima
      const ahora = new Date();
      const diasAnticipacion = Math.floor(
        (data.fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diasAnticipacion < area.anticipacionMinima) {
        throw new Error(
          `Se requiere anticipación mínima de ${area.anticipacionMinima} día(s)`
        );
      }

      // Validar duración de la reserva
      const duracionHoras =
        (data.fechaFin.getTime() - data.fechaInicio.getTime()) / (1000 * 60 * 60);

      if (duracionHoras < area.tiempoMinimoReserva) {
        throw new Error(
          `Tiempo mínimo de reserva: ${area.tiempoMinimoReserva} hora(s)`
        );
      }

      if (duracionHoras > area.tiempoMaximoReserva) {
        throw new Error(
          `Tiempo máximo de reserva: ${area.tiempoMaximoReserva} hora(s)`
        );
      }

      // Validar disponibilidad (no hay otra reserva en ese horario)
      const conflicto = await this.verificarConflictoReserva(
        data.areaId,
        data.fechaInicio,
        data.fechaFin
      );

      if (conflicto) {
        throw new Error('El área ya está reservada en ese horario');
      }

      // Calcular costo
      let costoTotal = new Decimal(0);
      if (area.costoPorHora) {
        costoTotal = area.costoPorHora.mul(duracionHoras);
      }

      // Estado inicial: pendiente si requiere aprobación, confirmada si no
      const estado = area.requiereAprobacion ? 'pendiente' : 'confirmada';

      // Crear reserva
      const reserva = await prisma.reservaArea.create({
        data: {
          areaId: data.areaId,
          unidadId: data.unidadId,
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          estado,
          cantidadPersonas: data.cantidadPersonas,
          proposito: data.proposito,
          observaciones: data.observaciones,
          costoTotal,
        },
        include: {
          area: true,
          unidad: {
            include: {
              propietario: true,
            },
          },
        },
      });

      logger.info(`✅ Reserva creada: ${reserva.id} - Estado: ${estado}`);
      return reserva;
    } catch (error) {
      logger.error('Error al crear reserva:', error);
      throw error;
    }
  }

  /**
   * Verificar si hay conflicto de reserva en un horario
   */
  private async verificarConflictoReserva(
    areaId: string,
    fechaInicio: Date,
    fechaFin: Date,
    excluirReservaId?: string
  ): Promise<boolean> {
    const where: any = {
      areaId,
      estado: {
        in: ['confirmada', 'pendiente'],
      },
      OR: [
        // Inicio dentro de otra reserva
        {
          fechaInicio: { lte: fechaInicio },
          fechaFin: { gt: fechaInicio },
        },
        // Fin dentro de otra reserva
        {
          fechaInicio: { lt: fechaFin },
          fechaFin: { gte: fechaFin },
        },
        // Reserva que contiene completamente a la nueva
        {
          fechaInicio: { gte: fechaInicio },
          fechaFin: { lte: fechaFin },
        },
      ],
    };

    if (excluirReservaId) {
      where.id = { not: excluirReservaId };
    }

    const conflictos = await prisma.reservaArea.count({ where });

    return conflictos > 0;
  }

  /**
   * Obtener reservas con filtros
   */
  async obtenerReservas(filtros?: {
    areaId?: string;
    unidadId?: string;
    condominioId?: string;
    estado?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }): Promise<ReservaArea[]> {
    try {
      const where: any = {};

      if (filtros?.areaId) {
        where.areaId = filtros.areaId;
      }

      if (filtros?.unidadId) {
        where.unidadId = filtros.unidadId;
      }

      if (filtros?.condominioId) {
        where.area = {
          condominioId: filtros.condominioId,
        };
      }

      if (filtros?.estado) {
        where.estado = filtros.estado;
      }

      if (filtros?.fechaDesde || filtros?.fechaHasta) {
        where.fechaInicio = {};
        if (filtros.fechaDesde) {
          where.fechaInicio.gte = filtros.fechaDesde;
        }
        if (filtros.fechaHasta) {
          where.fechaInicio.lte = filtros.fechaHasta;
        }
      }

      const reservas = await prisma.reservaArea.findMany({
        where,
        include: {
          area: true,
          unidad: {
            include: {
              propietario: true,
            },
          },
        },
        orderBy: {
          fechaInicio: 'asc',
        },
      });

      return reservas;
    } catch (error) {
      logger.error('Error al obtener reservas:', error);
      throw error;
    }
  }

  /**
   * Aprobar reserva
   */
  async aprobarReserva(
    reservaId: string,
    aprobadoPor: string
  ): Promise<ReservaArea> {
    try {
      const reserva = await prisma.reservaArea.update({
        where: { id: reservaId },
        data: {
          estado: 'confirmada',
          aprobadoPor,
          fechaAprobacion: new Date(),
        },
        include: {
          area: true,
          unidad: true,
        },
      });

      logger.info(`✅ Reserva aprobada: ${reservaId}`);
      return reserva;
    } catch (error) {
      logger.error('Error al aprobar reserva:', error);
      throw error;
    }
  }

  /**
   * Rechazar reserva
   */
  async rechazarReserva(
    reservaId: string,
    motivo: string
  ): Promise<ReservaArea> {
    try {
      const reserva = await prisma.reservaArea.update({
        where: { id: reservaId },
        data: {
          estado: 'cancelada',
          motivoCancelacion: motivo,
        },
        include: {
          area: true,
          unidad: true,
        },
      });

      logger.info(`✅ Reserva rechazada: ${reservaId}`);
      return reserva;
    } catch (error) {
      logger.error('Error al rechazar reserva:', error);
      throw error;
    }
  }

  /**
   * Cancelar reserva
   */
  async cancelarReserva(
    reservaId: string,
    motivo?: string
  ): Promise<ReservaArea> {
    try {
      const reserva = await prisma.reservaArea.update({
        where: { id: reservaId },
        data: {
          estado: 'cancelada',
          motivoCancelacion: motivo,
        },
      });

      logger.info(`✅ Reserva cancelada: ${reservaId}`);
      return reserva;
    } catch (error) {
      logger.error('Error al cancelar reserva:', error);
      throw error;
    }
  }

  /**
   * Completar reserva
   */
  async completarReserva(reservaId: string): Promise<ReservaArea> {
    try {
      const reserva = await prisma.reservaArea.update({
        where: { id: reservaId },
        data: {
          estado: 'completada',
        },
      });

      logger.info(`✅ Reserva completada: ${reservaId}`);
      return reserva;
    } catch (error) {
      logger.error('Error al completar reserva:', error);
      throw error;
    }
  }

  /**
   * Obtener disponibilidad de un área en un rango de fechas
   */
  async obtenerDisponibilidad(
    areaId: string,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<
    Array<{
      fecha: string;
      horariosDisponibles: Array<{ inicio: string; fin: string }>;
    }>
  > {
    try {
      // Obtener área
      const area = await prisma.areaComun.findUnique({
        where: { id: areaId },
      });

      if (!area) {
        throw new Error('Área no encontrada');
      }

      // Obtener reservas en el rango
      const reservas = await prisma.reservaArea.findMany({
        where: {
          areaId,
          estado: {
            in: ['confirmada', 'pendiente'],
          },
          fechaInicio: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
        orderBy: {
          fechaInicio: 'asc',
        },
      });

      // Generar disponibilidad por día
      const disponibilidad: Array<{
        fecha: string;
        horariosDisponibles: Array<{ inicio: string; fin: string }>;
      }> = [];

      const fechaActual = new Date(fechaInicio);
      while (fechaActual <= fechaFin) {
        const fechaStr = fechaActual.toISOString().split('T')[0];

        // Obtener reservas de este día
        const reservasDelDia = reservas.filter((r) => {
          const fechaReserva = r.fechaInicio.toISOString().split('T')[0];
          return fechaReserva === fechaStr;
        });

        // Generar horarios disponibles (simplificado)
        const horariosDisponibles: Array<{ inicio: string; fin: string }> = [];

        if (reservasDelDia.length === 0) {
          // Todo el día disponible
          horariosDisponibles.push({
            inicio: area.horarioApertura || '08:00',
            fin: area.horarioCierre || '22:00',
          });
        } else {
          // Calcular espacios libres entre reservas
          // (implementación simplificada - en producción necesitaría lógica más compleja)
        }

        disponibilidad.push({
          fecha: fechaStr,
          horariosDisponibles,
        });

        // Siguiente día
        fechaActual.setDate(fechaActual.getDate() + 1);
      }

      return disponibilidad;
    } catch (error) {
      logger.error('Error al obtener disponibilidad:', error);
      throw error;
    }
  }

  /**
   * Estadísticas de uso de áreas comunes
   */
  async obtenerEstadisticasUso(
    condominioId: string,
    fechaDesde: Date,
    fechaHasta: Date
  ): Promise<
    Array<{
      area: string;
      totalReservas: number;
      horasReservadas: number;
      ingresoGenerado: number;
    }>
  > {
    try {
      const reservas = await prisma.reservaArea.findMany({
        where: {
          area: {
            condominioId,
          },
          fechaInicio: {
            gte: fechaDesde,
            lte: fechaHasta,
          },
          estado: {
            in: ['confirmada', 'completada'],
          },
        },
        include: {
          area: true,
        },
      });

      // Agrupar por área
      const estadisticasPorArea = new Map<
        string,
        { totalReservas: number; horasReservadas: number; ingresoGenerado: number }
      >();

      reservas.forEach((reserva) => {
        const areaNombre = reserva.area.nombre;
        const duracionHoras =
          (reserva.fechaFin.getTime() - reserva.fechaInicio.getTime()) /
          (1000 * 60 * 60);

        if (!estadisticasPorArea.has(areaNombre)) {
          estadisticasPorArea.set(areaNombre, {
            totalReservas: 0,
            horasReservadas: 0,
            ingresoGenerado: 0,
          });
        }

        const stats = estadisticasPorArea.get(areaNombre)!;
        stats.totalReservas++;
        stats.horasReservadas += duracionHoras;
        stats.ingresoGenerado += Number(reserva.costoTotal || 0);
      });

      // Convertir a array
      return Array.from(estadisticasPorArea.entries()).map(([area, stats]) => ({
        area,
        ...stats,
      }));
    } catch (error) {
      logger.error('Error al obtener estadísticas de uso:', error);
      throw error;
    }
  }
}
