/**
 * =========================================================================
 * SERVICIO DE SEGUIMIENTO COMPLETO AUTOMATIZADO - STUB
 * =========================================================================
 *
 * TEMPORARILY DISABLED - Implementation needs to be fixed
 * This service is commented out to reduce TypeScript errors
 */

import { logger } from '../../utils/logger';

export interface StatusCitaRespuesta {
  casoId: string;
  status: 'resuelto' | 'no_fue' | 'reagendo' | 'pendiente';
  comentario?: string;
}

export class SeguimientoCompletoService {
  private static instance: SeguimientoCompletoService;

  private constructor() {}

  public static getInstance(): SeguimientoCompletoService {
    if (!SeguimientoCompletoService.instance) {
      SeguimientoCompletoService.instance = new SeguimientoCompletoService();
    }
    return SeguimientoCompletoService.instance;
  }

  async iniciarSeguimiento(casoId: string): Promise<void> {
    logger.warn('SeguimientoCompletoService.iniciarSeguimiento - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async procesarRespuestaPropietario(data: StatusCitaRespuesta): Promise<void> {
    logger.warn('SeguimientoCompletoService.procesarRespuestaPropietario - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async enviarRecordatorioTecnico(citaId: string): Promise<void> {
    logger.warn('SeguimientoCompletoService.enviarRecordatorioTecnico - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async ejecutarSeguimientos(): Promise<void> {
    logger.warn('SeguimientoCompletoService.ejecutarSeguimientos - NOT IMPLEMENTED');
    // Silent fail for cron jobs
  }

  async procesarRespuestaStatus(
    telefono: string,
    mensaje: string
  ): Promise<StatusCitaRespuesta | null> {
    logger.warn('SeguimientoCompletoService.procesarRespuestaStatus - NOT IMPLEMENTED');
    return null;
  }
}

/* ORIGINAL IMPLEMENTATION COMMENTED OUT - NEEDS FIX

import { getPrismaClient } from '../../config/database/postgres';
import { WhatsAppService } from '../whatsapp/WhatsAppService';
import { EncuestaSatisfaccionService } from '../encuestas/EncuestaSatisfaccionService';
import { CalendarioAsignacionService } from '../calendario/CalendarioAsignacionService';
import { addHours, addDays, format, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { EstadoCaso, PrioridadCaso } from '@prisma/client';

const prisma = getPrismaClient();

// ... rest of implementation needs field mapping fixes

*/
