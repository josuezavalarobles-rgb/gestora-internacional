// ========================================
// INICIALIZADOR DE TODOS LOS JOBS
// ========================================

import { iniciarSeguimientoCitas } from './seguimientoCitas';
import {
  iniciarRecordatorios,
  iniciarRecordatoriosProximos,
  iniciarAlertasCitasSinConfirmar,
} from './recordatorios';
import { iniciarJobsSeguimientoCompleto } from './seguimientoCompleto';
import { CronService } from '../services/cron/CronService';
import { logger } from '../utils/logger';

/**
 * Iniciar todos los jobs programados
 */
export const iniciarTodosLosJobs = () => {
  logger.info('🚀 Iniciando todos los jobs programados...');

  try {
    // Sistema de tareas programadas CRON (seguimiento automático, SLA, limpieza)
    const cronService = CronService.getInstance();
    cronService.iniciar();

    // Jobs de citas
    iniciarSeguimientoCitas();
    iniciarRecordatorios();
    iniciarRecordatoriosProximos();
    iniciarAlertasCitasSinConfirmar();

    // 🎯 NUEVO: Jobs de seguimiento completo automatizado
    iniciarJobsSeguimientoCompleto();

    logger.info('✅ Todos los jobs iniciados correctamente');
  } catch (error) {
    logger.error('❌ Error al iniciar jobs:', error);
  }
};

export default {
  iniciarTodosLosJobs,
};
