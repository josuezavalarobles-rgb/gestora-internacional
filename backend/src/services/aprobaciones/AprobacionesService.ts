/**
 * APROBACIONES SERVICE - STUB
 * TEMPORARILY DISABLED - Implementation needs to be fixed
 */

import { logger } from '../../utils/logger';

export class AprobacionesService {
  constructor() {}

  async solicitarAprobacion(data: any): Promise<any> {
    logger.warn('AprobacionesService.solicitarAprobacion - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async aprobarSolicitud(aprobacionId: string, aprobadoPor: string, comentarios?: string): Promise<any> {
    logger.warn('AprobacionesService.aprobarSolicitud - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async rechazarSolicitud(aprobacionId: string, rechazadoPor: string, motivo: string): Promise<any> {
    logger.warn('AprobacionesService.rechazarSolicitud - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async listarAprobacionesPendientes(): Promise<any[]> {
    logger.warn('AprobacionesService.listarAprobacionesPendientes - NOT IMPLEMENTED');
    return [];
  }
}

/* ORIGINAL IMPLEMENTATION COMMENTED OUT - NEEDS FIX */
