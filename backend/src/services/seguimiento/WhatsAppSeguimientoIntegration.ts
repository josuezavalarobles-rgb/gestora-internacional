/**
 * ========================================
 * INTEGRACIÓN SEGUIMIENTO ← → WHATSAPP
 * ========================================
 * Conecta el sistema de seguimiento automático con WhatsApp
 * - Envía mensajes de seguimiento automático
 * - Procesa respuestas de propietarios
 * - Detecta intención (solucionado / no solucionado)
 */

import { WASocket } from '@whiskeysockets/baileys';
import { logger } from '../../utils/logger';
import { SeguimientoAutomaticoService } from './SeguimientoAutomaticoService';
import { EncuestaSatisfaccionService } from '../encuestas/EncuestaSatisfaccionService';
import { getPrismaClient } from '../../config/database/postgres';

const prisma = getPrismaClient();

export class WhatsAppSeguimientoIntegration {
  private static instance: WhatsAppSeguimientoIntegration;
  private seguimientoService: SeguimientoAutomaticoService;
  private encuestaService: EncuestaSatisfaccionService;

  private constructor() {
    this.seguimientoService = SeguimientoAutomaticoService.getInstance();
    this.encuestaService = EncuestaSatisfaccionService.getInstance();
  }

  public static getInstance(): WhatsAppSeguimientoIntegration {
    if (!WhatsAppSeguimientoIntegration.instance) {
      WhatsAppSeguimientoIntegration.instance = new WhatsAppSeguimientoIntegration();
    }
    return WhatsAppSeguimientoIntegration.instance;
  }

  /**
   * Enviar mensaje de seguimiento inicial a un propietario
   */
  public async enviarSeguimientoInicial(
    sock: WASocket,
    casoId: string,
    citaId: string
  ): Promise<boolean> {
    try {
      const caso = await prisma.caso.findUnique({
        where: { id: casoId },
        include: {
          usuario: true,
        },
      });

      if (!caso) {
        throw new Error(`Caso ${casoId} no encontrado`);
      }

      const telefono = this.formatearTelefono(caso.usuario.telefono);
      const mensaje = this.seguimientoService.getMensajeSeguimientoInicial(
        caso.usuario.nombreCompleto,
        caso.numeroCaso,
        caso.unidad
      );

      await sock.sendMessage(telefono, {
        text: mensaje,
      });

      logger.info(
        `✅ Mensaje de seguimiento inicial enviado a ${caso.usuario.nombreCompleto} (${caso.numeroCaso})`
      );

      return true;
    } catch (error) {
      logger.error('❌ Error enviando mensaje de seguimiento inicial:', error);
      return false;
    }
  }

  /**
   * Enviar mensaje de reintento a un propietario
   */
  public async enviarReintento(
    sock: WASocket,
    seguimientoId: string,
    intentoNumero: number
  ): Promise<boolean> {
    try {
      const seguimiento = await prisma.seguimientoCaso.findUnique({
        where: { id: seguimientoId },
        include: {
          caso: {
            include: {
              usuario: true,
            },
          },
        },
      });

      if (!seguimiento) {
        throw new Error(`Seguimiento ${seguimientoId} no encontrado`);
      }

      const telefono = this.formatearTelefono(seguimiento.caso.usuario.telefono);
      const mensaje = this.seguimientoService.getMensajeReintento(
        seguimiento.caso.usuario.nombreCompleto,
        seguimiento.caso.numeroCaso,
        seguimiento.caso.unidad,
        intentoNumero
      );

      await sock.sendMessage(telefono, {
        text: mensaje,
      });

      logger.info(
        `✅ Mensaje de reintento ${intentoNumero} enviado a ${seguimiento.caso.usuario.nombreCompleto} (${seguimiento.caso.numeroCaso})`
      );

      return true;
    } catch (error) {
      logger.error('❌ Error enviando mensaje de reintento:', error);
      return false;
    }
  }

  /**
   * Procesar respuesta de seguimiento desde WhatsApp
   */
  public async procesarRespuestaSeguimiento(
    sock: WASocket,
    telefono: string,
    mensaje: string
  ): Promise<string | null> {
    try {
      // Buscar caso con seguimiento activo para este teléfono
      const usuario = await prisma.usuario.findUnique({
        where: { telefono },
      });

      if (!usuario) {
        logger.warn(`Usuario con teléfono ${telefono} no encontrado`);
        return null;
      }

      // Buscar caso con seguimiento activo
      const seguimiento = await prisma.seguimientoCaso.findFirst({
        where: {
          activo: true,
          caso: {
            usuarioId: usuario.id,
          },
        },
        include: {
          caso: true,
        },
      });

      if (!seguimiento) {
        logger.info(`No hay seguimiento activo para usuario ${usuario.nombreCompleto}`);
        return null;
      }

      logger.info(
        `📞 Procesando respuesta de seguimiento para caso ${seguimiento.caso.numeroCaso}: "${mensaje}"`
      );

      // Procesar respuesta
      const resultado = await this.seguimientoService.procesarRespuestaSeguimiento(
        seguimiento.casoId,
        mensaje
      );

      // Enviar respuesta al propietario
      const telefonoFormateado = this.formatearTelefono(telefono);
      await sock.sendMessage(telefonoFormateado, {
        text: resultado.mensaje,
      });

      logger.info(
        `✅ Respuesta de seguimiento procesada - Acción: ${resultado.accion} (${seguimiento.caso.numeroCaso})`
      );

      // Si el caso fue cerrado, enviar encuesta de satisfacción
      if (resultado.accion === 'cerrar') {
        // Obtener la encuesta que fue creada
        const encuesta = await prisma.encuestaSatisfaccion.findFirst({
          where: { casoId: seguimiento.casoId },
          orderBy: { fechaEnvio: 'desc' },
        });

        if (encuesta) {
          // Enviar mensaje de encuesta por WhatsApp
          const mensajeEncuesta = this.encuestaService.getMensajeEncuesta(
            usuario.nombreCompleto,
            seguimiento.caso.numeroCaso
          );

          await sock.sendMessage(telefonoFormateado, {
            text: mensajeEncuesta,
          });

          logger.info(
            `📋 Encuesta de satisfacción enviada por WhatsApp para caso ${seguimiento.caso.numeroCaso}`
          );
        }
      }

      // Si el caso fue reabierto, necesita nueva asignación
      if (resultado.accion === 'reabrir') {
        // TODO: Trigger nueva asignación automática
        logger.info(`🔄 Caso ${seguimiento.caso.numeroCaso} requiere nueva asignación`);
      }

      return resultado.mensaje;
    } catch (error) {
      logger.error('❌ Error procesando respuesta de seguimiento:', error);
      return null;
    }
  }

  /**
   * Detectar si un mensaje es respuesta a un seguimiento
   */
  public async esRespuestaSeguimiento(telefono: string): Promise<boolean> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { telefono },
      });

      if (!usuario) {
        return false;
      }

      const seguimiento = await prisma.seguimientoCaso.findFirst({
        where: {
          activo: true,
          caso: {
            usuarioId: usuario.id,
          },
        },
      });

      return seguimiento !== null;
    } catch (error) {
      logger.error('❌ Error verificando si es respuesta de seguimiento:', error);
      return false;
    }
  }

  /**
   * Formatear número de teléfono para WhatsApp
   */
  private formatearTelefono(telefono: string): string {
    // Remover caracteres no numéricos
    let numero = telefono.replace(/\D/g, '');

    // Agregar código de país si no lo tiene
    if (!numero.startsWith('1') && numero.length === 10) {
      numero = '1' + numero; // República Dominicana
    }

    // Formato: 18095551234@s.whatsapp.net
    return `${numero}@s.whatsapp.net`;
  }

  /**
   * Enviar todos los seguimientos pendientes por WhatsApp
   * Llamado por el cron job
   */
  public async enviarSeguimientosPendientes(sock: WASocket): Promise<void> {
    try {
      const ahora = new Date();

      // 1. Seguimientos iniciales
      const seguimientosIniciales = await prisma.seguimientoCaso.findMany({
        where: {
          activo: true,
          intentos: 0,
          proximoIntento: {
            lte: ahora,
          },
        },
        include: {
          caso: {
            include: {
              usuario: true,
            },
          },
        },
        take: 50, // Procesar máximo 50 a la vez
      });

      logger.info(`📤 ${seguimientosIniciales.length} seguimientos iniciales por enviar`);

      for (const seguimiento of seguimientosIniciales) {
        const exito = await this.enviarSeguimientoInicial(
          sock,
          seguimiento.casoId,
          seguimiento.citaId || ''
        );

        if (exito) {
          // Actualizar intentos
          await prisma.seguimientoCaso.update({
            where: { id: seguimiento.id },
            data: {
              intentos: 1,
              ultimoIntento: new Date(),
              proximoIntento: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 día
            },
          });
        }

        // Esperar 2 segundos entre mensajes para no saturar
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // 2. Reintentos
      const reintentos = await prisma.seguimientoCaso.findMany({
        where: {
          activo: true,
          intentos: {
            gt: 0,
            lt: 7,
          },
          proximoIntento: {
            lte: ahora,
          },
        },
        include: {
          caso: {
            include: {
              usuario: true,
            },
          },
        },
        take: 50,
      });

      logger.info(`🔄 ${reintentos.length} reintentos por enviar`);

      for (const seguimiento of reintentos) {
        const exito = await this.enviarReintento(sock, seguimiento.id, seguimiento.intentos + 1);

        if (exito) {
          await this.seguimientoService.ejecutarReintento(seguimiento.id);
        }

        // Esperar 2 segundos entre mensajes
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      logger.error('❌ Error enviando seguimientos pendientes:', error);
    }
  }
}
