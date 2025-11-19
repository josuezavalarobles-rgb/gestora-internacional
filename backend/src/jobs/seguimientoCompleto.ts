/**
 * =========================================================================
 * CRON JOBS - SEGUIMIENTO COMPLETO AUTOMATIZADO
 * =========================================================================
 *
 * Estos jobs ejecutan automáticamente el flujo completo de seguimiento:
 * 1. Recordatorios a técnicos (7:00 AM diario)
 * 2. Preguntas de status post-cita (cada hora)
 * 3. Repreguntar sin respuesta (cada 6 horas)
 */

import cron from 'node-cron';
import { logger } from '../utils/logger';
import { SeguimientoCompletoService } from '../services/seguimiento/SeguimientoCompletoService';

const seguimientoService = SeguimientoCompletoService.getInstance();

/**
 * JOB 1: Enviar recordatorios a técnicos
 * Se ejecuta todos los días a las 7:00 AM
 */
export const iniciarJobRecordatoriosTecnicos = () => {
  // Ejecutar todos los días a las 7:00 AM
  cron.schedule('0 7 * * *', async () => {
    try {
      logger.info('⏰ [CRON] Iniciando job de recordatorios a técnicos...');
      // TODO: Implementar enviarRecordatoriosTecnicos
      logger.warn('Job de recordatorios a técnicos temporalmente deshabilitado');
      // await seguimientoService.enviarRecordatorioTecnico();
      logger.info('✅ [CRON] Job de recordatorios completado');
    } catch (error) {
      logger.error('❌ [CRON] Error en job de recordatorios:', error);
    }
  }, {
    timezone: 'America/Santo_Domingo'
  });

  logger.info('✅ Job de recordatorios a técnicos inicializado (7:00 AM diario)');
};

/**
 * JOB 2: Preguntar status de citas completadas
 * Se ejecuta cada hora
 */
export const iniciarJobPreguntarStatus = () => {
  // Ejecutar cada hora
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('📞 [CRON] Iniciando job de preguntas de status...');
      // TODO: Implementar preguntarStatusCita
      logger.warn('Job de preguntas de status temporalmente deshabilitado');
      logger.info('✅ [CRON] Job de preguntas de status completado');
    } catch (error) {
      logger.error('❌ [CRON] Error en job de preguntas de status:', error);
    }
  }, {
    timezone: 'America/Santo_Domingo'
  });

  logger.info('✅ Job de preguntas de status inicializado (cada hora)');
};

/**
 * JOB 3: Repreguntar a casos sin respuesta
 * Se ejecuta cada 6 horas
 */
export const iniciarJobRepreguntarSinRespuesta = () => {
  // Ejecutar cada 6 horas (00:00, 06:00, 12:00, 18:00)
  cron.schedule('0 */6 * * *', async () => {
    try {
      logger.info('🔄 [CRON] Iniciando job de recordatorios sin respuesta...');
      // TODO: Implementar repreguntarCasossSinRespuesta
      logger.warn('Job de recordatorios sin respuesta temporalmente deshabilitado');
      logger.info('✅ [CRON] Job de recordatorios sin respuesta completado');
    } catch (error) {
      logger.error('❌ [CRON] Error en job de recordatorios sin respuesta:', error);
    }
  }, {
    timezone: 'America/Santo_Domingo'
  });

  logger.info('✅ Job de recordatorios sin respuesta inicializado (cada 6 horas)');
};

/**
 * Iniciar todos los jobs de seguimiento completo
 */
export const iniciarJobsSeguimientoCompleto = () => {
  logger.info('🚀 Inicializando jobs de seguimiento completo...');

  iniciarJobRecordatoriosTecnicos();
  iniciarJobPreguntarStatus();
  iniciarJobRepreguntarSinRespuesta();

  logger.info('✅ Todos los jobs de seguimiento completo inicializados');
};
