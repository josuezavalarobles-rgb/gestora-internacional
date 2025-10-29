// ========================================
// JOB: RECORDATORIOS DE CITAS
// Envía recordatorios 1 día antes de cada cita
// ========================================

import * as cron from 'node-cron';
import prisma from '../config/database/prisma';
import { AIService } from '../services/ai/AIService';
import { WhatsAppService } from '../services/whatsapp/WhatsAppService';
import { logger } from '../utils/logger';

/**
 * Job que se ejecuta diariamente a las 9:00 AM
 * para enviar recordatorios de citas del día siguiente
 */
export const iniciarRecordatorios = () => {
  // Ejecutar todos los días a las 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('🔔 Ejecutando job de recordatorios de citas...');

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      const pasadoManana = new Date(manana);
      pasadoManana.setDate(pasadoManana.getDate() + 1);

      // Buscar citas confirmadas para mañana
      const citasManana = await prisma.cita.findMany({
        where: {
          fecha: {
            gte: manana,
            lt: pasadoManana,
          },
          estado: {
            in: ['confirmada_propietario', 'confirmada_ingenieria'],
          },
        },
        include: {
          caso: {
            include: {
              usuario: true,
              condominio: true,
            },
          },
          bloqueHorario: true,
        },
        orderBy: {
          bloqueHorario: {
            horaInicio: 'asc',
          },
        },
      });

      logger.info(`📋 Encontradas ${citasManana.length} citas para recordar`);

      const aiService = AIService.getInstance();
      const whatsappService = WhatsAppService.getInstance();

      for (const cita of citasManana) {
        try {
          // Generar mensaje de recordatorio
          const mensaje = aiService.generarRecordatorioCita({
            nombreUsuario: cita.caso.usuario.nombreCompleto.split(' ')[0],
            fecha: cita.fecha,
            horaInicio: cita.bloqueHorario.horaInicio,
            horaFin: cita.bloqueHorario.horaFin,
            unidad: cita.caso.unidad,
            direccion: cita.caso.condominio.direccion,
          });

          // Enviar por WhatsApp
          await whatsappService.enviarMensaje(cita.caso.usuario.telefono, mensaje);

          // Registrar en timeline
          await prisma.timelineEvento.create({
            data: {
              casoId: cita.casoId,
              tipoEvento: 'comentario_agregado',
              titulo: 'Recordatorio de cita enviado',
              descripcion: `Se envió recordatorio de cita para mañana ${cita.bloqueHorario.horaInicio}-${cita.bloqueHorario.horaFin}`,
            },
          });

          logger.info(`✅ Recordatorio enviado para caso ${cita.caso.numeroCaso}`);
        } catch (error) {
          logger.error(
            `❌ Error al enviar recordatorio para caso ${cita.caso.numeroCaso}:`,
            error
          );
        }
      }

      logger.info('✅ Job de recordatorios completado');
    } catch (error) {
      logger.error('❌ Error en job de recordatorios:', error);
    }
  });

  logger.info('✅ Job de recordatorios iniciado (diario a las 9:00 AM)');
};

/**
 * Recordatorio para citas próximas a vencer (2 horas antes)
 * Se ejecuta cada 30 minutos
 */
export const iniciarRecordatoriosProximos = () => {
  // Ejecutar cada 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    try {
      logger.info('⏰ Verificando citas próximas...');

      const ahora = new Date();
      const enDosHoras = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);

      // Buscar citas que están a punto de ocurrir
      const citasProximas = await prisma.cita.findMany({
        where: {
          fecha: {
            gte: ahora,
            lte: enDosHoras,
          },
          estado: {
            in: ['confirmada_propietario', 'confirmada_ingenieria'],
          },
        },
        include: {
          caso: {
            include: {
              usuario: true,
              tecnicoAsignado: true,
            },
          },
          bloqueHorario: true,
        },
      });

      const whatsappService = WhatsAppService.getInstance();

      for (const cita of citasProximas) {
        try {
          // Verificar si ya se envió recordatorio (evitar duplicados)
          const recordatorioExistente = await prisma.timelineEvento.findFirst({
            where: {
              casoId: cita.casoId,
              titulo: 'Recordatorio 2h antes enviado',
              fecha: {
                gte: new Date(ahora.getTime() - 30 * 60 * 1000), // Últimos 30 min
              },
            },
          });

          if (recordatorioExistente) {
            continue; // Ya se envió, skip
          }

          // Enviar a propietario
          const mensajePropietario = `Hola ${
            cita.caso.usuario.nombreCompleto.split(' ')[0]
          }! 👋\n\nRecordatorio: Tu visita técnica está programada para HOY en aproximadamente 2 horas (${
            cita.bloqueHorario.horaInicio
          }-${cita.bloqueHorario.horaFin})\n\nPor favor confirma que estarás disponible. 📲`;

          await whatsappService.enviarMensaje(cita.caso.usuario.telefono, mensajePropietario);

          // Enviar a técnico si está asignado
          if (cita.tecnicoId && cita.caso.tecnicoAsignado) {
            const mensajeTecnico = `Recordatorio: Tienes una visita programada en 2 horas\n\nCaso: ${cita.caso.numeroCaso}\nHorario: ${cita.bloqueHorario.horaInicio}-${cita.bloqueHorario.horaFin}\nUbicación: ${cita.caso.unidad}`;

            await whatsappService.enviarMensaje(
              cita.caso.tecnicoAsignado.telefono,
              mensajeTecnico
            );
          }

          // Registrar que se envió
          await prisma.timelineEvento.create({
            data: {
              casoId: cita.casoId,
              tipoEvento: 'comentario_agregado',
              titulo: 'Recordatorio 2h antes enviado',
              descripcion: 'Se envió recordatorio 2 horas antes de la visita',
            },
          });

          logger.info(`✅ Recordatorio 2h enviado para caso ${cita.caso.numeroCaso}`);
        } catch (error) {
          logger.error(`❌ Error enviando recordatorio próximo:`, error);
        }
      }
    } catch (error) {
      logger.error('❌ Error en job de recordatorios próximos:', error);
    }
  });

  logger.info('✅ Job de recordatorios próximos iniciado (cada 30 minutos)');
};

/**
 * Detectar citas no confirmadas (3 días antes) y enviar alerta
 */
export const iniciarAlertasCitasSinConfirmar = () => {
  // Ejecutar diariamente a las 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    try {
      logger.info('⚠️ Verificando citas sin confirmar...');

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const tresDiasDespues = new Date(hoy);
      tresDiasDespues.setDate(tresDiasDespues.getDate() + 3);

      const cincoDiasDespues = new Date(hoy);
      cincoDiasDespues.setDate(cincoDiasDespues.getDate() + 5);

      // Buscar citas pendientes de confirmación
      const citasSinConfirmar = await prisma.cita.findMany({
        where: {
          fecha: {
            gte: tresDiasDespues,
            lt: cincoDiasDespues,
          },
          estado: 'pendiente',
        },
        include: {
          caso: {
            include: {
              usuario: true,
            },
          },
          bloqueHorario: true,
        },
      });

      logger.info(`📋 Encontradas ${citasSinConfirmar.length} citas sin confirmar`);

      const whatsappService = WhatsAppService.getInstance();

      for (const cita of citasSinConfirmar) {
        try {
          const mensaje = `Hola ${
            cita.caso.usuario.nombreCompleto.split(' ')[0]
          }! 👋\n\nTe recordamos que tienes una cita programada para el ${cita.fecha.toLocaleDateString()} de ${
            cita.bloqueHorario.horaInicio
          } a ${
            cita.bloqueHorario.horaFin
          }\n\nPor favor confirma tu disponibilidad respondiendo "Confirmo" o si necesitas reprogramar, escribe "Reprogramar". 📅`;

          await whatsappService.enviarMensaje(cita.caso.usuario.telefono, mensaje);

          logger.info(`✅ Alerta enviada para caso ${cita.caso.numeroCaso}`);
        } catch (error) {
          logger.error(`❌ Error enviando alerta:`, error);
        }
      }
    } catch (error) {
      logger.error('❌ Error en job de alertas sin confirmar:', error);
    }
  });

  logger.info('✅ Job de alertas citas sin confirmar iniciado (diario a las 10:00 AM)');
};

export default {
  iniciarRecordatorios,
  iniciarRecordatoriosProximos,
  iniciarAlertasCitasSinConfirmar,
};
