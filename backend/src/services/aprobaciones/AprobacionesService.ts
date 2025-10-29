// ========================================
// SERVICIO DE GESTIÓN DE APROBACIONES
// ========================================

import prisma from '../../config/database/prisma';
import { NotificacionService } from '../notifications/NotificacionService';
import { Decimal } from '@prisma/client/runtime/library';

export class AprobacionesService {
  private notificacionService: NotificacionService;

  constructor() {
    this.notificacionService = new NotificacionService();
  }

  // ========================================
  // SOLICITAR APROBACIONES
  // ========================================

  /**
   * Solicitar aprobación para una acción que requiere autorización
   */
  async solicitarAprobacion(data: {
    casoId: string;
    tipoAprobacion: 'nueva_visita' | 'materiales' | 'costo_extra' | 'otro';
    descripcion: string;
    costoEstimado?: number;
    justificacion?: string;
    solicitadoPor: string; // ID del técnico
  }) {
    try {
      const aprobacion = await prisma.aprobacion.create({
        data: {
          casoId: data.casoId,
          tipoAprobacion: data.tipoAprobacion,
          descripcion: data.descripcion,
          costoEstimado: data.costoEstimado ? new Decimal(data.costoEstimado) : undefined,
          justificacion: data.justificacion,
          solicitadoPor: data.solicitadoPor,
          estado: 'pendiente',
        },
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
            },
          },
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: data.casoId,
          tipoEvento: 'escalado',
          titulo: 'Solicitud de aprobación',
          descripcion: `Se ha solicitado aprobación para: ${data.tipoAprobacion}`,
          usuarioId: data.solicitadoPor,
          metadata: {
            aprobacionId: aprobacion.id,
            tipo: data.tipoAprobacion,
            costo: data.costoEstimado,
          },
        },
      });

      // Notificar a todos los admins y super_admins
      await this.notificacionService.notificarAdmins({
        tipo: 'caso_actualizado',
        prioridad: 'alta',
        titulo: 'Nueva Solicitud de Aprobación',
        mensaje: `Se requiere aprobación para ${data.tipoAprobacion} en el caso ${aprobacion.caso.numeroCaso}${
          data.costoEstimado ? ` - Costo estimado: $${data.costoEstimado}` : ''
        }`,
        casoId: data.casoId,
      });

      return {
        success: true,
        data: aprobacion,
        message: 'Solicitud de aprobación creada exitosamente',
      };
    } catch (error) {
      console.error('Error al solicitar aprobación:', error);
      return {
        success: false,
        error: 'Error al solicitar aprobación',
      };
    }
  }

  // ========================================
  // GESTIONAR APROBACIONES
  // ========================================

  /**
   * Aprobar una solicitud
   */
  async aprobar(data: {
    aprobacionId: string;
    adminId: string;
    comentarios?: string;
  }) {
    try {
      const aprobacion = await prisma.aprobacion.update({
        where: { id: data.aprobacionId },
        data: {
          estado: 'aprobado',
          aprobadoPor: data.adminId,
          fechaRespuesta: new Date(),
          comentarios: data.comentarios,
        },
        include: {
          caso: {
            include: {
              usuario: true,
            },
          },
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: aprobacion.casoId,
          tipoEvento: 'comentario_agregado',
          titulo: 'Aprobación autorizada',
          descripcion: `La solicitud de ${aprobacion.tipoAprobacion} ha sido aprobada${
            data.comentarios ? `. Comentarios: ${data.comentarios}` : ''
          }`,
          usuarioId: data.adminId,
        },
      });

      // Notificar al técnico que solicitó
      await this.notificacionService.crearNotificacion({
        usuarioId: aprobacion.solicitadoPor,
        tipo: 'caso_actualizado',
        prioridad: 'alta',
        titulo: 'Aprobación Autorizada',
        mensaje: `Su solicitud de ${aprobacion.tipoAprobacion} para el caso ${aprobacion.caso.numeroCaso} ha sido aprobada`,
        casoId: aprobacion.casoId,
      });

      return {
        success: true,
        data: aprobacion,
        message: 'Aprobación autorizada exitosamente',
      };
    } catch (error) {
      console.error('Error al aprobar:', error);
      return {
        success: false,
        error: 'Error al aprobar solicitud',
      };
    }
  }

  /**
   * Rechazar una solicitud
   */
  async rechazar(data: {
    aprobacionId: string;
    adminId: string;
    motivo: string;
  }) {
    try {
      const aprobacion = await prisma.aprobacion.update({
        where: { id: data.aprobacionId },
        data: {
          estado: 'rechazado',
          aprobadoPor: data.adminId,
          fechaRespuesta: new Date(),
          comentarios: data.motivo,
        },
        include: {
          caso: {
            include: {
              usuario: true,
            },
          },
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: aprobacion.casoId,
          tipoEvento: 'comentario_agregado',
          titulo: 'Aprobación rechazada',
          descripcion: `La solicitud de ${aprobacion.tipoAprobacion} ha sido rechazada. Motivo: ${data.motivo}`,
          usuarioId: data.adminId,
        },
      });

      // Notificar al técnico que solicitó
      await this.notificacionService.crearNotificacion({
        usuarioId: aprobacion.solicitadoPor,
        tipo: 'caso_actualizado',
        prioridad: 'alta',
        titulo: 'Aprobación Rechazada',
        mensaje: `Su solicitud de ${aprobacion.tipoAprobacion} para el caso ${aprobacion.caso.numeroCaso} ha sido rechazada. Motivo: ${data.motivo}`,
        casoId: aprobacion.casoId,
      });

      return {
        success: true,
        data: aprobacion,
        message: 'Aprobación rechazada',
      };
    } catch (error) {
      console.error('Error al rechazar:', error);
      return {
        success: false,
        error: 'Error al rechazar solicitud',
      };
    }
  }

  /**
   * Solicitar más información
   */
  async solicitarMasInformacion(data: {
    aprobacionId: string;
    adminId: string;
    comentarios: string;
  }) {
    try {
      const aprobacion = await prisma.aprobacion.update({
        where: { id: data.aprobacionId },
        data: {
          estado: 'solicitar_info',
          aprobadoPor: data.adminId,
          fechaRespuesta: new Date(),
          comentarios: data.comentarios,
        },
        include: {
          caso: {
            include: {
              usuario: true,
            },
          },
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: aprobacion.casoId,
          tipoEvento: 'comentario_agregado',
          titulo: 'Se solicita más información',
          descripcion: data.comentarios,
          usuarioId: data.adminId,
        },
      });

      // Notificar al técnico que solicitó
      await this.notificacionService.crearNotificacion({
        usuarioId: aprobacion.solicitadoPor,
        tipo: 'caso_actualizado',
        prioridad: 'media',
        titulo: 'Se Requiere Más Información',
        mensaje: `Se necesita más información sobre su solicitud de ${aprobacion.tipoAprobacion} para el caso ${aprobacion.caso.numeroCaso}`,
        casoId: aprobacion.casoId,
      });

      return {
        success: true,
        data: aprobacion,
        message: 'Se solicitó más información',
      };
    } catch (error) {
      console.error('Error al solicitar información:', error);
      return {
        success: false,
        error: 'Error al solicitar información',
      };
    }
  }

  // ========================================
  // CONSULTAS
  // ========================================

  /**
   * Obtener todas las aprobaciones pendientes
   */
  async obtenerPendientes() {
    try {
      const aprobaciones = await prisma.aprobacion.findMany({
        where: {
          estado: 'pendiente',
        },
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
              tecnicoAsignado: true,
            },
          },
        },
        orderBy: {
          fechaSolicitud: 'desc',
        },
      });

      return {
        success: true,
        data: aprobaciones,
      };
    } catch (error) {
      console.error('Error al obtener aprobaciones pendientes:', error);
      return {
        success: false,
        error: 'Error al obtener aprobaciones pendientes',
      };
    }
  }

  /**
   * Obtener aprobación por ID
   */
  async obtenerPorId(aprobacionId: string) {
    try {
      const aprobacion = await prisma.aprobacion.findUnique({
        where: { id: aprobacionId },
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
              tecnicoAsignado: true,
            },
          },
        },
      });

      if (!aprobacion) {
        return {
          success: false,
          error: 'Aprobación no encontrada',
        };
      }

      return {
        success: true,
        data: aprobacion,
      };
    } catch (error) {
      console.error('Error al obtener aprobación:', error);
      return {
        success: false,
        error: 'Error al obtener aprobación',
      };
    }
  }

  /**
   * Obtener aprobaciones por caso
   */
  async obtenerPorCaso(casoId: string) {
    try {
      const aprobaciones = await prisma.aprobacion.findMany({
        where: { casoId },
        orderBy: {
          fechaSolicitud: 'desc',
        },
      });

      return {
        success: true,
        data: aprobaciones,
      };
    } catch (error) {
      console.error('Error al obtener aprobaciones del caso:', error);
      return {
        success: false,
        error: 'Error al obtener aprobaciones',
      };
    }
  }

  /**
   * Obtener aprobaciones por técnico
   */
  async obtenerPorTecnico(tecnicoId: string) {
    try {
      const aprobaciones = await prisma.aprobacion.findMany({
        where: { solicitadoPor: tecnicoId },
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
            },
          },
        },
        orderBy: {
          fechaSolicitud: 'desc',
        },
      });

      return {
        success: true,
        data: aprobaciones,
      };
    } catch (error) {
      console.error('Error al obtener aprobaciones del técnico:', error);
      return {
        success: false,
        error: 'Error al obtener aprobaciones',
      };
    }
  }

  /**
   * Obtener todas las aprobaciones (con filtros)
   */
  async obtenerTodas(filtros?: {
    estado?: 'pendiente' | 'aprobado' | 'rechazado' | 'solicitar_info';
    tipoAprobacion?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
  }) {
    try {
      const where: any = {};

      if (filtros?.estado) {
        where.estado = filtros.estado;
      }

      if (filtros?.tipoAprobacion) {
        where.tipoAprobacion = filtros.tipoAprobacion;
      }

      if (filtros?.fechaInicio && filtros?.fechaFin) {
        where.fechaSolicitud = {
          gte: filtros.fechaInicio,
          lte: filtros.fechaFin,
        };
      }

      const aprobaciones = await prisma.aprobacion.findMany({
        where,
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
              tecnicoAsignado: true,
            },
          },
        },
        orderBy: {
          fechaSolicitud: 'desc',
        },
      });

      return {
        success: true,
        data: aprobaciones,
      };
    } catch (error) {
      console.error('Error al obtener aprobaciones:', error);
      return {
        success: false,
        error: 'Error al obtener aprobaciones',
      };
    }
  }

  /**
   * Obtener estadísticas de aprobaciones
   */
  async obtenerEstadisticas(fechaInicio?: Date, fechaFin?: Date) {
    try {
      const where: any = {};

      if (fechaInicio && fechaFin) {
        where.fechaSolicitud = {
          gte: fechaInicio,
          lte: fechaFin,
        };
      }

      const total = await prisma.aprobacion.count({ where });

      const pendientes = await prisma.aprobacion.count({
        where: { ...where, estado: 'pendiente' },
      });

      const aprobadas = await prisma.aprobacion.count({
        where: { ...where, estado: 'aprobado' },
      });

      const rechazadas = await prisma.aprobacion.count({
        where: { ...where, estado: 'rechazado' },
      });

      const solicitandoInfo = await prisma.aprobacion.count({
        where: { ...where, estado: 'solicitar_info' },
      });

      // Calcular costo total estimado de aprobaciones aprobadas
      const aprobacionesAprobadas = await prisma.aprobacion.findMany({
        where: { ...where, estado: 'aprobado' },
        select: { costoEstimado: true },
      });

      const costoTotalEstimado = aprobacionesAprobadas.reduce((sum, aprobacion) => {
        return sum + (aprobacion.costoEstimado ? Number(aprobacion.costoEstimado) : 0);
      }, 0);

      // Aprobaciones por tipo
      const porTipo = await prisma.aprobacion.groupBy({
        by: ['tipoAprobacion'],
        where,
        _count: true,
      });

      return {
        success: true,
        data: {
          total,
          pendientes,
          aprobadas,
          rechazadas,
          solicitandoInfo,
          costoTotalEstimado,
          tasaAprobacion: total > 0 ? (aprobadas / total) * 100 : 0,
          tasaRechazo: total > 0 ? (rechazadas / total) * 100 : 0,
          porTipo: porTipo.map((t) => ({
            tipo: t.tipoAprobacion,
            cantidad: t._count,
          })),
        },
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        error: 'Error al obtener estadísticas',
      };
    }
  }

  /**
   * Actualizar una aprobación (para agregar más información)
   */
  async actualizarAprobacion(data: {
    aprobacionId: string;
    descripcion?: string;
    costoEstimado?: number;
    justificacion?: string;
  }) {
    try {
      const updateData: any = {};

      if (data.descripcion) updateData.descripcion = data.descripcion;
      if (data.costoEstimado !== undefined)
        updateData.costoEstimado = new Decimal(data.costoEstimado);
      if (data.justificacion) updateData.justificacion = data.justificacion;

      // Si se actualiza y estaba en "solicitar_info", volver a pendiente
      const aprobacionActual = await prisma.aprobacion.findUnique({
        where: { id: data.aprobacionId },
      });

      if (aprobacionActual?.estado === 'solicitar_info') {
        updateData.estado = 'pendiente';
        updateData.aprobadoPor = null;
        updateData.fechaRespuesta = null;
      }

      const aprobacion = await prisma.aprobacion.update({
        where: { id: data.aprobacionId },
        data: updateData,
        include: {
          caso: true,
        },
      });

      // Crear evento en timeline
      await prisma.timelineEvento.create({
        data: {
          casoId: aprobacion.casoId,
          tipoEvento: 'comentario_agregado',
          titulo: 'Aprobación actualizada',
          descripcion: 'Se ha actualizado la información de la solicitud de aprobación',
        },
      });

      // Notificar a admins si volvió a pendiente
      if (aprobacionActual?.estado === 'solicitar_info') {
        await this.notificacionService.notificarAdmins({
          tipo: 'caso_actualizado',
          prioridad: 'media',
          titulo: 'Aprobación Actualizada',
          mensaje: `Se ha actualizado la solicitud de aprobación para el caso ${aprobacion.caso.numeroCaso}`,
          casoId: aprobacion.casoId,
        });
      }

      return {
        success: true,
        data: aprobacion,
        message: 'Aprobación actualizada exitosamente',
      };
    } catch (error) {
      console.error('Error al actualizar aprobación:', error);
      return {
        success: false,
        error: 'Error al actualizar aprobación',
      };
    }
  }

  /**
   * Eliminar una aprobación (solo si está pendiente)
   */
  async eliminarAprobacion(aprobacionId: string, usuarioId: string) {
    try {
      const aprobacion = await prisma.aprobacion.findUnique({
        where: { id: aprobacionId },
      });

      if (!aprobacion) {
        return {
          success: false,
          error: 'Aprobación no encontrada',
        };
      }

      // Solo se puede eliminar si está pendiente y el que la elimina es quien la solicitó
      if (aprobacion.estado !== 'pendiente' || aprobacion.solicitadoPor !== usuarioId) {
        return {
          success: false,
          error: 'No se puede eliminar esta aprobación',
        };
      }

      await prisma.aprobacion.delete({
        where: { id: aprobacionId },
      });

      return {
        success: true,
        message: 'Aprobación eliminada exitosamente',
      };
    } catch (error) {
      console.error('Error al eliminar aprobación:', error);
      return {
        success: false,
        error: 'Error al eliminar aprobación',
      };
    }
  }
}

export default new AprobacionesService();
