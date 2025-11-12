/**
 * ========================================
 * SERVICIO DE NOTIFICACIONES GRUPALES - WHATSAPP
 * ========================================
 * Envía notificaciones al grupo de WhatsApp de administradores e ingenieros
 * cuando se genera un nuevo caso
 * - Número del caso
 * - Unidad del propietario
 * - Fecha y hora de la visita
 * - Descripción del problema
 * - Ingeniero asignado
 * - Prioridad y categoría
 */

import { WASocket } from '@whiskeysockets/baileys';
import { logger } from '../../utils/logger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface NotificacionCasoData {
  caso: {
    numeroCaso: string;
    descripcion: string;
    categoria: string;
    prioridad: string;
    tipo: string;
  };
  propietario: {
    nombreCompleto: string;
    unidad: string;
    telefono: string;
  };
  condominio: {
    nombre: string;
    direccion: string;
  };
  cita: {
    fecha: Date;
    horaInicio: string;
    horaFin: string;
  };
  ingeniero: {
    nombreCompleto: string;
    telefono: string;
  };
  evidencias?: {
    totalImagenes: number;
    totalVideos: number;
    totalAudios: number;
  };
}

export class WhatsAppGroupNotificationService {
  private static instance: WhatsAppGroupNotificationService;

  private constructor() {}

  public static getInstance(): WhatsAppGroupNotificationService {
    if (!WhatsAppGroupNotificationService.instance) {
      WhatsAppGroupNotificationService.instance = new WhatsAppGroupNotificationService();
    }
    return WhatsAppGroupNotificationService.instance;
  }

  /**
   * Enviar notificación de nuevo caso al grupo de WhatsApp
   */
  public async notificarNuevoCaso(
    sock: WASocket,
    groupJid: string,
    data: NotificacionCasoData
  ): Promise<boolean> {
    try {
      logger.info(`📱 Enviando notificación de caso ${data.caso.numeroCaso} al grupo ${groupJid}`);

      const mensaje = this.generarMensajeNuevoCaso(data);

      await sock.sendMessage(groupJid, {
        text: mensaje,
      });

      logger.info(`✅ Notificación grupal enviada exitosamente`);
      return true;
    } catch (error) {
      logger.error('❌ Error enviando notificación grupal:', error);
      return false;
    }
  }

  /**
   * Generar mensaje formateado para WhatsApp
   */
  private generarMensajeNuevoCaso(data: NotificacionCasoData): string {
    const fechaFormateada = format(data.cita.fecha, "EEEE, d 'de' MMMM yyyy", { locale: es });

    const categoriasMap: Record<string, string> = {
      filtraciones_humedad: 'Filtraciones / Humedad',
      problemas_electricos: 'Problemas Eléctricos',
      plomeria: 'Plomería',
      puertas_ventanas: 'Puertas / Ventanas',
      pisos_paredes_techo: 'Pisos / Paredes / Techo',
      aires_acondicionados: 'Aires Acondicionados',
      areas_comunes: 'Áreas Comunes',
      seguridad: 'Seguridad',
      otro: 'Otro',
    };

    const categoriaTexto = categoriasMap[data.caso.categoria] || data.caso.categoria;

    const prioridadEmoji = {
      urgente: '🔴',
      alta: '🟠',
      media: '🟡',
      baja: '🟢',
    }[data.caso.prioridad] || '⚪';

    const tipoEmoji = data.caso.tipo === 'garantia' ? '🛡️' : '🏢';

    let mensaje = `
🔧 *NUEVO CASO ASIGNADO*
━━━━━━━━━━━━━━━━━━━━

📋 *Caso:* ${data.caso.numeroCaso}
${tipoEmoji} *Tipo:* ${data.caso.tipo.toUpperCase()}
${prioridadEmoji} *Prioridad:* ${data.caso.prioridad.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━
🏠 *PROPIETARIO*
━━━━━━━━━━━━━━━━━━━━

👤 *Nombre:* ${data.propietario.nombreCompleto}
🚪 *Unidad:* ${data.propietario.unidad}
📞 *Teléfono:* ${data.propietario.telefono}
🏢 *Condominio:* ${data.condominio.nombre}

━━━━━━━━━━━━━━━━━━━━
🔧 *DETALLES DEL PROBLEMA*
━━━━━━━━━━━━━━━━━━━━

📂 *Categoría:* ${categoriaTexto}

📝 *Descripción:*
${data.caso.descripcion}
`;

    // Agregar evidencias si existen
    if (data.evidencias) {
      const totalEvidencias =
        data.evidencias.totalImagenes + data.evidencias.totalVideos + data.evidencias.totalAudios;

      if (totalEvidencias > 0) {
        mensaje += `
━━━━━━━━━━━━━━━━━━━━
📎 *EVIDENCIAS RECIBIDAS*
━━━━━━━━━━━━━━━━━━━━
`;

        if (data.evidencias.totalImagenes > 0) {
          mensaje += `\n📷 ${data.evidencias.totalImagenes} imagen(es)`;
        }
        if (data.evidencias.totalVideos > 0) {
          mensaje += `\n🎥 ${data.evidencias.totalVideos} video(s)`;
        }
        if (data.evidencias.totalAudios > 0) {
          mensaje += `\n🎤 ${data.evidencias.totalAudios} audio(s)`;
        }
      }
    }

    mensaje += `

━━━━━━━━━━━━━━━━━━━━
📅 *VISITA PROGRAMADA*
━━━━━━━━━━━━━━━━━━━━

📆 *Fecha:* ${fechaFormateada}
⏰ *Hora:* ${data.cita.horaInicio} - ${data.cita.horaFin}

━━━━━━━━━━━━━━━━━━━━
👷 *INGENIERO ASIGNADO*
━━━━━━━━━━━━━━━━━━━━

👤 ${data.ingeniero.nombreCompleto}
📞 ${data.ingeniero.telefono}

━━━━━━━━━━━━━━━━━━━━

✅ *El ingeniero ha sido notificado por email con todos los detalles y evidencias adjuntas.*

_Amico Management - Sistema de Gestión de Condominios_
`;

    return mensaje.trim();
  }

  /**
   * Enviar notificación de actualización de caso
   */
  public async notificarActualizacionCaso(
    sock: WASocket,
    groupJid: string,
    numeroCaso: string,
    nuevoEstado: string,
    comentario?: string
  ): Promise<boolean> {
    try {
      logger.info(
        `📱 Enviando notificación de actualización del caso ${numeroCaso} al grupo ${groupJid}`
      );

      const estadosMap: Record<string, string> = {
        nuevo: '🆕 Nuevo',
        asignado: '👷 Asignado',
        en_proceso: '🔧 En Proceso',
        en_visita: '🚗 En Visita',
        esperando_repuestos: '📦 Esperando Repuestos',
        esperando_validacion: '⏳ Esperando Validación',
        resuelto: '✅ Resuelto',
        cerrado: '🔒 Cerrado',
        cancelado: '❌ Cancelado',
      };

      const estadoTexto = estadosMap[nuevoEstado] || nuevoEstado;

      let mensaje = `
📢 *ACTUALIZACIÓN DE CASO*
━━━━━━━━━━━━━━━━━━━━

📋 *Caso:* ${numeroCaso}
📊 *Nuevo Estado:* ${estadoTexto}
`;

      if (comentario) {
        mensaje += `
💬 *Comentario:*
${comentario}
`;
      }

      mensaje += `
━━━━━━━━━━━━━━━━━━━━
_Amico Management - Sistema de Gestión de Condominios_
`;

      await sock.sendMessage(groupJid, {
        text: mensaje.trim(),
      });

      logger.info(`✅ Notificación de actualización enviada exitosamente`);
      return true;
    } catch (error) {
      logger.error('❌ Error enviando notificación de actualización:', error);
      return false;
    }
  }

  /**
   * Enviar notificación de reprogramación de cita
   */
  public async notificarReprogramacionCita(
    sock: WASocket,
    groupJid: string,
    numeroCaso: string,
    unidad: string,
    nuevaFecha: Date,
    nuevoHorario: string,
    razon?: string
  ): Promise<boolean> {
    try {
      logger.info(
        `📱 Enviando notificación de reprogramación del caso ${numeroCaso} al grupo ${groupJid}`
      );

      const fechaFormateada = format(nuevaFecha, "EEEE, d 'de' MMMM yyyy", { locale: es });

      let mensaje = `
📅 *CITA REPROGRAMADA*
━━━━━━━━━━━━━━━━━━━━

📋 *Caso:* ${numeroCaso}
🚪 *Unidad:* ${unidad}

📆 *Nueva Fecha:* ${fechaFormateada}
⏰ *Nuevo Horario:* ${nuevoHorario}
`;

      if (razon) {
        mensaje += `
📝 *Razón:*
${razon}
`;
      }

      mensaje += `
━━━━━━━━━━━━━━━━━━━━
_Amico Management - Sistema de Gestión de Condominios_
`;

      await sock.sendMessage(groupJid, {
        text: mensaje.trim(),
      });

      logger.info(`✅ Notificación de reprogramación enviada exitosamente`);
      return true;
    } catch (error) {
      logger.error('❌ Error enviando notificación de reprogramación:', error);
      return false;
    }
  }

  /**
   * Verificar si un JID es de un grupo
   */
  public isGroupJid(jid: string): boolean {
    return jid.endsWith('@g.us');
  }

  /**
   * Obtener información de un grupo
   */
  public async getGroupInfo(sock: WASocket, groupJid: string) {
    try {
      const metadata = await sock.groupMetadata(groupJid);
      return {
        id: metadata.id,
        subject: metadata.subject,
        owner: metadata.owner,
        participants: metadata.participants.length,
        desc: metadata.desc,
      };
    } catch (error) {
      logger.error(`❌ Error obteniendo información del grupo ${groupJid}:`, error);
      return null;
    }
  }

  /**
   * Enviar notificación de caso urgente (con mención a todos)
   */
  public async notificarCasoUrgente(
    sock: WASocket,
    groupJid: string,
    data: NotificacionCasoData
  ): Promise<boolean> {
    try {
      logger.info(
        `🚨 Enviando notificación URGENTE del caso ${data.caso.numeroCaso} al grupo ${groupJid}`
      );

      const fechaFormateada = format(data.cita.fecha, "EEEE, d 'de' MMMM yyyy", { locale: es });

      const mensaje = `
🚨 *¡CASO URGENTE!* 🚨
━━━━━━━━━━━━━━━━━━━━

⚠️ *REQUIERE ATENCIÓN INMEDIATA* ⚠️

📋 *Caso:* ${data.caso.numeroCaso}
🚪 *Unidad:* ${data.propietario.unidad}
🏢 *Condominio:* ${data.condominio.nombre}

📝 *Descripción:*
${data.caso.descripcion}

━━━━━━━━━━━━━━━━━━━━
📅 *VISITA PROGRAMADA*
━━━━━━━━━━━━━━━━━━━━

📆 *Fecha:* ${fechaFormateada}
⏰ *Hora:* ${data.cita.horaInicio} - ${data.cita.horaFin}

👷 *Asignado a:* ${data.ingeniero.nombreCompleto}

━━━━━━━━━━━━━━━━━━━━

🔔 *Por favor, confirmar recepción de esta notificación.*

_Amico Management - Sistema de Gestión de Condominios_
`;

      await sock.sendMessage(groupJid, {
        text: mensaje.trim(),
      });

      logger.info(`✅ Notificación urgente enviada exitosamente`);
      return true;
    } catch (error) {
      logger.error('❌ Error enviando notificación urgente:', error);
      return false;
    }
  }
}
