/**
 * ========================================
 * SERVICIO DE NOTIFICACIONES POR EMAIL
 * ========================================
 * Envía emails a ingenieros/técnicos con información de casos asignados
 * - Descripción del problema
 * - Evidencias (imágenes, videos, audios)
 * - Fecha y hora de la visita
 * - Información del propietario
 */

import nodemailer from 'nodemailer';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import path from 'path';

export interface EmailCasoData {
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
    email: string;
  };
  evidencias?: {
    imagenes: string[];
    videos: string[];
    audios: string[];
    documentos: string[];
  };
}

export class EmailNotificationService {
  private static instance: EmailNotificationService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  public static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  /**
   * Enviar email de asignación de caso a ingeniero
   */
  public async enviarEmailAsignacionCaso(data: EmailCasoData): Promise<boolean> {
    try {
      logger.info(`📧 Enviando email de asignación a ${data.ingeniero.email}`);

      const htmlContent = this.generarHTMLEmailAsignacion(data);

      const mailOptions = {
        from: `"Amico Management" <${config.email.from}>`,
        to: data.ingeniero.email,
        subject: `🔧 Nuevo Caso Asignado: ${data.caso.numeroCaso} - ${data.condominio.nombre}`,
        html: htmlContent,
        attachments: await this.prepararAdjuntos(data.evidencias),
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`✅ Email enviado: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('❌ Error enviando email:', error);
      return false;
    }
  }

  /**
   * Generar HTML del email de asignación
   */
  private generarHTMLEmailAsignacion(data: EmailCasoData): string {
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

    const prioridadColor = {
      urgente: '#dc2626',
      alta: '#ea580c',
      media: '#ca8a04',
      baja: '#65a30d',
    }[data.caso.prioridad] || '#6b7280';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Caso Asignado</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                🔧 Nuevo Caso Asignado
                            </h1>
                            <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">
                                ${data.caso.numeroCaso}
                            </p>
                        </td>
                    </tr>

                    <!-- Saludo -->
                    <tr>
                        <td style="padding: 30px 40px 20px 40px;">
                            <p style="font-size: 16px; color: #374151; margin: 0; line-height: 1.6;">
                                Hola <strong>${data.ingeniero.nombreCompleto}</strong>,
                            </p>
                            <p style="font-size: 16px; color: #374151; margin: 15px 0 0 0; line-height: 1.6;">
                                Se te ha asignado un nuevo caso para revisión. A continuación, los detalles:
                            </p>
                        </td>
                    </tr>

                    <!-- Información de la Cita -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <table width="100%" cellpadding="15" style="background-color: #f9fafb; border-radius: 8px; border: 2px solid #e5e7eb;">
                                <tr>
                                    <td colspan="2" style="background-color: #3b82f6; color: #ffffff; font-weight: bold; font-size: 16px; text-align: center; border-radius: 6px 6px 0 0;">
                                        📅 FECHA Y HORA DE VISITA
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width: 40%; color: #6b7280; font-weight: 600;">Fecha:</td>
                                    <td style="color: #111827; font-weight: bold;">${fechaFormateada}</td>
                                </tr>
                                <tr>
                                    <td style="color: #6b7280; font-weight: 600;">Hora:</td>
                                    <td style="color: #111827; font-weight: bold; font-size: 18px;">${data.cita.horaInicio} - ${data.cita.horaFin}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Información del Caso -->
                    <tr>
                        <td style="padding: 20px 40px 0 40px;">
                            <table width="100%" cellpadding="12" style="background-color: #fffbeb; border-radius: 8px; border: 2px solid #fbbf24;">
                                <tr>
                                    <td colspan="2" style="background-color: #fbbf24; color: #78350f; font-weight: bold; font-size: 16px; text-align: center; border-radius: 6px 6px 0 0;">
                                        📋 DETALLES DEL CASO
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width: 40%; color: #92400e; font-weight: 600;">Tipo:</td>
                                    <td style="color: #78350f; font-weight: bold; text-transform: uppercase;">${data.caso.tipo}</td>
                                </tr>
                                <tr>
                                    <td style="color: #92400e; font-weight: 600;">Categoría:</td>
                                    <td style="color: #78350f;">${categoriaTexto}</td>
                                </tr>
                                <tr>
                                    <td style="color: #92400e; font-weight: 600;">Prioridad:</td>
                                    <td>
                                        <span style="background-color: ${prioridadColor}; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-weight: bold; text-transform: uppercase; font-size: 12px;">
                                            ${data.caso.prioridad}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Descripción del Problema -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
                                <h3 style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px;">📝 Descripción del Problema:</h3>
                                <p style="color: #7f1d1d; margin: 0; line-height: 1.6; font-size: 15px;">
                                    ${data.caso.descripcion}
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Información del Propietario -->
                    <tr>
                        <td style="padding: 0 40px 20px 40px;">
                            <table width="100%" cellpadding="12" style="background-color: #f0f9ff; border-radius: 8px; border: 2px solid #60a5fa;">
                                <tr>
                                    <td colspan="2" style="background-color: #60a5fa; color: #ffffff; font-weight: bold; font-size: 16px; text-align: center; border-radius: 6px 6px 0 0;">
                                        🏠 INFORMACIÓN DEL PROPIETARIO
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width: 40%; color: #1e40af; font-weight: 600;">Nombre:</td>
                                    <td style="color: #1e3a8a; font-weight: bold;">${data.propietario.nombreCompleto}</td>
                                </tr>
                                <tr>
                                    <td style="color: #1e40af; font-weight: 600;">Unidad:</td>
                                    <td style="color: #1e3a8a; font-weight: bold;">${data.propietario.unidad}</td>
                                </tr>
                                <tr>
                                    <td style="color: #1e40af; font-weight: 600;">Teléfono:</td>
                                    <td style="color: #1e3a8a; font-weight: bold;">${data.propietario.telefono}</td>
                                </tr>
                                <tr>
                                    <td style="color: #1e40af; font-weight: 600;">Condominio:</td>
                                    <td style="color: #1e3a8a;">${data.condominio.nombre}</td>
                                </tr>
                                <tr>
                                    <td style="color: #1e40af; font-weight: 600;">Dirección:</td>
                                    <td style="color: #1e3a8a;">${data.condominio.direccion}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Evidencias Adjuntas -->
                    ${
                      data.evidencias &&
                      (data.evidencias.imagenes.length > 0 ||
                        data.evidencias.audios.length > 0 ||
                        data.evidencias.videos.length > 0)
                        ? `
                    <tr>
                        <td style="padding: 0 40px 20px 40px;">
                            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border: 2px solid #86efac;">
                                <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 16px;">📎 Evidencias Adjuntas:</h3>
                                <ul style="margin: 0; padding-left: 20px; color: #166534;">
                                    ${
                                      data.evidencias.imagenes.length > 0
                                        ? `<li>${data.evidencias.imagenes.length} imagen(es)</li>`
                                        : ''
                                    }
                                    ${
                                      data.evidencias.videos.length > 0
                                        ? `<li>${data.evidencias.videos.length} video(s)</li>`
                                        : ''
                                    }
                                    ${
                                      data.evidencias.audios.length > 0
                                        ? `<li>${data.evidencias.audios.length} audio(s)</li>`
                                        : ''
                                    }
                                </ul>
                            </div>
                        </td>
                    </tr>
                    `
                        : ''
                    }

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; margin: 0; font-size: 14px;">
                                Por favor, confirma tu asistencia respondiendo a este correo.
                            </p>
                            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">
                                <strong>Amico Management</strong> - Sistema de Gestión de Condominios
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
  }

  /**
   * Preparar archivos adjuntos (evidencias)
   */
  private async prepararAdjuntos(evidencias?: {
    imagenes: string[];
    videos: string[];
    audios: string[];
    documentos: string[];
  }): Promise<any[]> {
    if (!evidencias) {
      return [];
    }

    const adjuntos: any[] = [];

    // Agregar imágenes
    for (const imagen of evidencias.imagenes) {
      adjuntos.push({
        filename: path.basename(imagen),
        path: imagen,
      });
    }

    // Agregar audios
    for (const audio of evidencias.audios) {
      adjuntos.push({
        filename: path.basename(audio),
        path: audio,
      });
    }

    // Nota: Videos generalmente son muy grandes para email
    // Se pueden enviar como links en lugar de adjuntos

    return adjuntos;
  }

  /**
   * Enviar notificación de cierre de caso al ingeniero (en el mismo hilo)
   */
  public async enviarNotificacionCierreCaso(
    emailIngeniero: string,
    numeroCaso: string,
    nombreIngeniero: string,
    nombrePropietario: string,
    unidad: string,
    condominio: string,
    respuestaPropietario: string
  ): Promise<void> {
    try {
      const subject = `Re: [${numeroCaso}] Reparación Completada - ${condominio}`;

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 20px 0; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #6b7280; }
    .value { color: #111827; }
    .quote { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; font-style: italic; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    .check-icon { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="check-icon">✅</div>
      <h1 style="margin: 0;">Caso Cerrado Exitosamente</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">${numeroCaso}</p>
    </div>

    <div class="content">
      <p>Hola <strong>${nombreIngeniero}</strong>,</p>

      <p>Te informamos que el propietario ha confirmado que la reparación fue completada satisfactoriamente. El caso ha sido cerrado automáticamente.</p>

      <div class="success-badge">
        🎉 Reparación Confirmada
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Caso:</span>
          <span class="value">${numeroCaso}</span>
        </div>
        <div class="info-row">
          <span class="label">Propietario:</span>
          <span class="value">${nombrePropietario}</span>
        </div>
        <div class="info-row">
          <span class="label">Unidad:</span>
          <span class="value">${unidad}</span>
        </div>
        <div class="info-row">
          <span class="label">Condominio:</span>
          <span class="value">${condominio}</span>
        </div>
        <div class="info-row">
          <span class="label">Estado:</span>
          <span class="value"><strong style="color: #10b981;">CERRADO</strong></span>
        </div>
      </div>

      <h3>📝 Respuesta del Propietario:</h3>
      <div class="quote">
        "${respuestaPropietario}"
      </div>

      <p><strong>¡Excelente trabajo!</strong> El propietario está satisfecho con la reparación realizada.</p>

      <p>Se ha enviado una encuesta de satisfacción al propietario para evaluar la calidad del servicio.</p>

      <div class="footer">
        <p><strong>Amico Management</strong></p>
        <p>Sistema de Gestión de Condominios</p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
          Este email fue generado automáticamente por el sistema de seguimiento.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
      `.trim();

      await this.transporter.sendMail({
        from: this.from,
        to: emailIngeniero,
        subject,
        html,
      });

      logger.info(`📧 Email de cierre de caso enviado a ${emailIngeniero} (${numeroCaso})`);
    } catch (error) {
      logger.error('❌ Error enviando email de cierre de caso:', error);
      throw error;
    }
  }

  /**
   * Verificar conexión con servidor de email
   */
  public async verificarConexion(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('✅ Conexión con servidor de email verificada');
      return true;
    } catch (error) {
      logger.error('❌ Error conectando con servidor de email:', error);
      return false;
    }
  }
}
