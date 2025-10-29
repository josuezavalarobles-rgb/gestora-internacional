// ========================================
// JOB: SEGUIMIENTO POST-VISITA
// Ejecuta 2 horas después de cada cita
// ========================================

import * as cron from 'node-cron';
import prisma from '../config/database/prisma';
import { AIService } from '../services/ai/AIService';
import { WhatsAppService } from '../services/whatsapp/WhatsAppService';
import { logger } from '../utils/logger';

/**
 * Job que se ejecuta cada hora para enviar seguimiento post-visita
 * a citas que fueron completadas hace 2 horas
 */
export const iniciarSeguimientoCitas = () => {
  // Ejecutar cada hora
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('🔄 Ejecutando job de seguimiento post-visita...');

      const ahora = new Date();
      const dosHorasAtras = new Date(ahora.getTime() - 2 * 60 * 60 * 1000);

      // Buscar citas completadas hace aproximadamente 2 horas
      // que aún no tienen feedback del propietario
      const citasParaSeguimiento = await prisma.cita.findMany({
        where: {
          estado: 'completada',
          visitaRealizada: true,
          solucionado: null, // No han respondido aún
          fechaCreacion: {
            gte: new Date(dosHorasAtras.getTime() - 30 * 60 * 1000), // -30 min
            lte: new Date(dosHorasAtras.getTime() + 30 * 60 * 1000), // +30 min
          },
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

      logger.info(`📋 Encontradas ${citasParaSeguimiento.length} citas para seguimiento`);

      const aiService = AIService.getInstance();
      const whatsappService = WhatsAppService.getInstance();

      for (const cita of citasParaSeguimiento) {
        try {
          // Generar mensaje de seguimiento
          const mensaje = aiService.generarSeguimientoPostVisita({
            nombreUsuario: cita.caso.usuario.nombreCompleto.split(' ')[0],
            numeroCaso: cita.caso.numeroCaso,
            fecha: cita.fecha,
          });

          // Enviar por WhatsApp
          await whatsappService.enviarMensaje(cita.caso.usuario.telefono, mensaje);

          // Marcar que se envió seguimiento (podríamos agregar un campo en la BD)
          await prisma.timelineEvento.create({
            data: {
              casoId: cita.casoId,
              tipoEvento: 'comentario_agregado',
              titulo: 'Seguimiento post-visita enviado',
              descripcion: 'Se envió mensaje de seguimiento automático al propietario',
            },
          });

          logger.info(`✅ Seguimiento enviado para caso ${cita.caso.numeroCaso}`);
        } catch (error) {
          logger.error(
            `❌ Error al enviar seguimiento para caso ${cita.caso.numeroCaso}:`,
            error
          );
        }
      }

      logger.info('✅ Job de seguimiento post-visita completado');
    } catch (error) {
      logger.error('❌ Error en job de seguimiento post-visita:', error);
    }
  });

  logger.info('✅ Job de seguimiento post-visita iniciado (cada hora)');
};

/**
 * Procesar respuesta de seguimiento cuando el usuario responde
 */
export const procesarRespuestaSeguimiento = async (
  citaId: string,
  mensaje: string
): Promise<boolean> => {
  try {
    const aiService = AIService.getInstance();
    const resultado = aiService.parsearRespuestaSatisfaccion(mensaje);

    if (resultado.solucionado !== null) {
      // Actualizar cita con el resultado
      await prisma.cita.update({
        where: { id: citaId },
        data: {
          solucionado: resultado.solucionado,
          comentarioPropietario: resultado.comentario,
        },
      });

      // Actualizar estado del caso
      const cita = await prisma.cita.findUnique({
        where: { id: citaId },
        include: { caso: true },
      });

      if (cita) {
        const nuevoEstado = resultado.solucionado ? 'resuelto' : 'en_proceso';
        await prisma.caso.update({
          where: { id: cita.casoId },
          data: {
            estado: nuevoEstado,
            fechaResolucion: resultado.solucionado ? new Date() : undefined,
          },
        });

        // Crear evento en timeline
        await prisma.timelineEvento.create({
          data: {
            casoId: cita.casoId,
            tipoEvento: 'visita_completada',
            titulo: resultado.solucionado
              ? 'Problema resuelto confirmado'
              : 'Problema persiste - Requiere seguimiento',
            descripcion: resultado.comentario || 'Feedback del propietario recibido',
          },
        });

        return true;
      }
    }

    return false;
  } catch (error) {
    logger.error('❌ Error procesando respuesta de seguimiento:', error);
    return false;
  }
};

export default {
  iniciarSeguimientoCitas,
  procesarRespuestaSeguimiento,
};
