/**
 * ========================================
 * SERVICIO DE NOTIFICACIONES
 * ========================================
 */

import { PrismaClient, TipoNotificacion, PrioridadNotificacion } from '@prisma/client';
import { getPrismaClient } from '../../config/database/postgres';
import { logger } from '../../utils/logger';
import { SocketService } from '../sockets/SocketService';

const prisma = getPrismaClient();

export class NotificacionService {
  constructor() {
    // Sin dependencias circulares
  }

  private async getWhatsAppService() {
    // Importación dinámica para evitar ciclos
    const { WhatsAppService } = await import('../whatsapp/WhatsAppService');
    return WhatsAppService.getInstance();
  }

  /**
   * Notificar nuevo caso creado
   */
  public async notificarNuevoCaso(caso: any): Promise<void> {
    try {
      // 1. Notificar a administradores
      const admins = await prisma.usuario.findMany({
        where: {
          tipoUsuario: { in: ['admin', 'super_admin'] },
          estado: 'activo',
        },
      });

      for (const admin of admins) {
        await this.crearNotificacion({
          usuarioId: admin.id,
          tipo: TipoNotificacion.caso_asignado,
          prioridad:
            caso.prioridad === 'urgente'
              ? PrioridadNotificacion.critica
              : PrioridadNotificacion.media,
          casoId: caso.id,
          titulo: `Nuevo caso: ${caso.numeroCaso}`,
          mensaje: `${caso.usuario.nombreCompleto} reportó: ${caso.descripcion.substring(0, 100)}...`,
          urlAccion: `/casos/${caso.id}`,
        });
      }

      // 2. Notificar por WhatsApp al usuario (confirmación)
      const whatsapp = await this.getWhatsAppService();
      await whatsapp.sendMessage(
        caso.usuario.telefono,
        `✅ Tu caso ${caso.numeroCaso} ha sido registrado exitosamente.\n\n` +
          `📋 Tipo: ${caso.tipo === 'garantia' ? 'Garantía' : 'Condominio'}\n` +
          `⚠️ Prioridad: ${caso.prioridad}\n\n` +
          `Un técnico revisará tu caso y te contactará pronto. Te mantendremos informado de cada actualización.`
      );

      // 3. WebSocket en tiempo real
      SocketService.getInstance()
        .getIO()
        .emit('nuevo-caso', {
          caso,
          mensaje: `Nuevo caso ${caso.numeroCaso} creado`,
        });

      logger.info(`📬 Notificación enviada para caso ${caso.numeroCaso}`);
    } catch (error) {
      logger.error('❌ Error al notificar nuevo caso:', error);
    }
  }

  /**
   * Notificar caso asignado a técnico
   */
  public async notificarCasoAsignado(casoId: string, tecnicoId: string): Promise<void> {
    try {
      const caso = await prisma.caso.findUnique({
        where: { id: casoId },
        include: {
          usuario: true,
          condominio: true,
        },
      });

      if (!caso) return;

      const tecnico = await prisma.usuario.findUnique({
        where: { id: tecnicoId },
      });

      if (!tecnico) return;

      // Notificar al técnico
      await this.crearNotificacion({
        usuarioId: tecnicoId,
        tipo: TipoNotificacion.caso_asignado,
        prioridad:
          caso.prioridad === 'urgente'
            ? PrioridadNotificacion.critica
            : PrioridadNotificacion.alta,
        casoId: caso.id,
        titulo: `Caso asignado: ${caso.numeroCaso}`,
        mensaje: `Se te asignó el caso de ${caso.usuario.nombreCompleto} - ${caso.descripcion.substring(0, 100)}`,
        urlAccion: `/casos/${caso.id}`,
      });

      // WhatsApp al técnico (si tiene teléfono)
      if (tecnico.telefono) {
        const whatsapp = await this.getWhatsAppService();
        await whatsapp.sendMessage(
          tecnico.telefono,
          `🔔 Nuevo caso asignado\n\n` +
            `📋 Caso: ${caso.numeroCaso}\n` +
            `👤 Cliente: ${caso.usuario.nombreCompleto}\n` +
            `📍 Unidad: ${caso.unidad}\n` +
            `⚠️ Prioridad: ${caso.prioridad}\n\n` +
            `Ingresa al panel para ver los detalles.`
        );
      }

      // WebSocket
      SocketService.getInstance()
        .getIO()
        .to(`user-${tecnicoId}`)
        .emit('caso-asignado', {
          caso,
          mensaje: `Nuevo caso ${caso.numeroCaso} asignado`,
        });

      logger.info(`📬 Notificación de asignación enviada a ${tecnico.nombreCompleto}`);
    } catch (error) {
      logger.error('❌ Error al notificar caso asignado:', error);
    }
  }

  /**
   * Notificar cambio de estado
   */
  public async notificarCambioEstado(casoId: string, nuevoEstado: string): Promise<void> {
    try {
      const caso = await prisma.caso.findUnique({
        where: { id: casoId },
        include: {
          usuario: true,
          tecnicoAsignado: true,
        },
      });

      if (!caso) return;

      const mensajesEstado: Record<string, string> = {
        asignado: '👤 Tu caso ha sido asignado a un técnico',
        en_proceso: '🔧 Un técnico está trabajando en tu caso',
        en_visita: '🚗 El técnico está en camino',
        resuelto: '✅ Tu caso ha sido resuelto',
        cerrado: '✅ Tu caso ha sido cerrado exitosamente',
      };

      const mensaje = mensajesEstado[nuevoEstado] || 'Tu caso ha sido actualizado';

      // Notificar al usuario por WhatsApp
      const whatsapp = await this.getWhatsAppService();
      await whatsapp.sendMessage(
        caso.usuario.telefono,
        `🔔 Actualización del caso ${caso.numeroCaso}\n\n${mensaje}\n\n` +
          (caso.tecnicoAsignado
            ? `Técnico: ${caso.tecnicoAsignado.nombreCompleto}\n\n`
            : '') +
          `Si tienes preguntas, responde a este mensaje.`
      );

      // Crear notificación en panel
      await this.crearNotificacion({
        usuarioId: caso.usuarioId,
        tipo: TipoNotificacion.caso_actualizado,
        prioridad: PrioridadNotificacion.media,
        casoId: caso.id,
        titulo: `Estado actualizado: ${caso.numeroCaso}`,
        mensaje: mensaje,
        urlAccion: `/casos/${caso.id}`,
      });

      logger.info(`📬 Notificación de cambio de estado enviada para ${caso.numeroCaso}`);
    } catch (error) {
      logger.error('❌ Error al notificar cambio de estado:', error);
    }
  }

  /**
   * Notificar visita programada
   */
  public async notificarVisitaProgramada(casoId: string, fechaVisita: Date): Promise<void> {
    try {
      const caso = await prisma.caso.findUnique({
        where: { id: casoId },
        include: {
          usuario: true,
          tecnicoAsignado: true,
        },
      });

      if (!caso) return;

      const fechaFormateada = fechaVisita.toLocaleDateString('es-DO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const horaFormateada = fechaVisita.toLocaleTimeString('es-DO', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const whatsapp = await this.getWhatsAppService();
      await whatsapp.sendMessage(
        caso.usuario.telefono,
        `📅 Visita técnica programada\n\n` +
          `Caso: ${caso.numeroCaso}\n` +
          `Fecha: ${fechaFormateada}\n` +
          `Hora: ${horaFormateada}\n\n` +
          (caso.tecnicoAsignado
            ? `Técnico: ${caso.tecnicoAsignado.nombreCompleto}\n\n`
            : '') +
          `Por favor, asegúrate de estar disponible. Te enviaremos un recordatorio el día de la visita.`
      );

      logger.info(`📬 Notificación de visita programada enviada`);
    } catch (error) {
      logger.error('❌ Error al notificar visita programada:', error);
    }
  }

  /**
   * Notificar cuando el bot necesita ayuda humana
   */
  public async notificarNuevoCasoRequiereHumano(
    telefono: string,
    razon: string
  ): Promise<void> {
    try {
      const admins = await prisma.usuario.findMany({
        where: {
          tipoUsuario: { in: ['admin', 'super_admin'] },
          estado: 'activo',
        },
      });

      for (const admin of admins) {
        await this.crearNotificacion({
          usuarioId: admin.id,
          tipo: TipoNotificacion.bot_necesita_ayuda,
          prioridad: PrioridadNotificacion.alta,
          titulo: '🤖 Bot necesita asistencia',
          mensaje: `Usuario ${telefono}: ${razon}`,
          urlAccion: `/chat/${telefono}`,
        });
      }

      // WebSocket
      SocketService.getInstance()
        .getIO()
        .emit('bot-necesita-ayuda', {
          telefono,
          razon,
        });

      logger.info(`📬 Notificación de escalamiento enviada para ${telefono}`);
    } catch (error) {
      logger.error('❌ Error al notificar escalamiento:', error);
    }
  }

  /**
   * Notificar SLA próximo a vencer
   */
  public async notificarSLAProximoVencer(casoId: string): Promise<void> {
    try {
      const caso = await prisma.caso.findUnique({
        where: { id: casoId },
        include: {
          tecnicoAsignado: true,
        },
      });

      if (!caso || !caso.tecnicoAsignadoId) return;

      await this.crearNotificacion({
        usuarioId: caso.tecnicoAsignadoId,
        tipo: TipoNotificacion.sla_proximo_vencer,
        prioridad: PrioridadNotificacion.alta,
        casoId: caso.id,
        titulo: `⚠️ SLA próximo a vencer: ${caso.numeroCaso}`,
        mensaje: `El caso está próximo a exceder el tiempo de respuesta establecido`,
        urlAccion: `/casos/${caso.id}`,
      });

      logger.info(`⚠️  Notificación de SLA enviada para ${caso.numeroCaso}`);
    } catch (error) {
      logger.error('❌ Error al notificar SLA:', error);
    }
  }

  /**
   * Crear notificación en la base de datos
   */
  private async crearNotificacion(data: {
    usuarioId: string;
    tipo: TipoNotificacion;
    prioridad: PrioridadNotificacion;
    titulo: string;
    mensaje: string;
    casoId?: string;
    urlAccion?: string;
  }): Promise<void> {
    try {
      const notificacion = await prisma.notificacion.create({
        data,
      });

      // Emitir por WebSocket al usuario específico
      SocketService.getInstance()
        .getIO()
        .to(`user-${data.usuarioId}`)
        .emit('notificacion', notificacion);
    } catch (error) {
      logger.error('❌ Error al crear notificación:', error);
    }
  }

  /**
   * Marcar notificación como leída
   */
  public async marcarComoLeida(notificacionId: string): Promise<void> {
    await prisma.notificacion.update({
      where: { id: notificacionId },
      data: {
        leida: true,
        fechaLeida: new Date(),
      },
    });
  }

  /**
   * Obtener notificaciones del usuario
   */
  public async obtenerNotificaciones(usuarioId: string, noLeidas = false): Promise<any[]> {
    return prisma.notificacion.findMany({
      where: {
        usuarioId,
        ...(noLeidas && { leida: false }),
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
      take: 50,
    });
  }

  /**
   * Contar notificaciones no leídas
   */
  public async contarNoLeidas(usuarioId: string): Promise<number> {
    return prisma.notificacion.count({
      where: {
        usuarioId,
        leida: false,
      },
    });
  }
}
