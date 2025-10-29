// ========================================
// INICIALIZADOR DE TODOS LOS JOBS
// ========================================

import { iniciarSeguimientoCitas } from './seguimientoCitas';
import {
  iniciarRecordatorios,
  iniciarRecordatoriosProximos,
  iniciarAlertasCitasSinConfirmar,
} from './recordatorios';
import { logger } from '../utils/logger';

/**
 * Iniciar todos los jobs programados
 */
export const iniciarTodosLosJobs = () => {
  logger.info('🚀 Iniciando todos los jobs programados...');

  try {
    // Jobs de citas
    iniciarSeguimientoCitas();
    iniciarRecordatorios();
    iniciarRecordatoriosProximos();
    iniciarAlertasCitasSinConfirmar();

    logger.info('✅ Todos los jobs iniciados correctamente');
  } catch (error) {
    logger.error('❌ Error al iniciar jobs:', error);
  }
};

export default {
  iniciarTodosLosJobs,
};
