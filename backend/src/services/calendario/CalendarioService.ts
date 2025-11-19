/**
 * CALENDARIO SERVICE - STUB
 * TEMPORARILY DISABLED - Implementation needs to be fixed
 */

import { logger } from '../../utils/logger';
import { TipoEventoCalendario } from '@prisma/client';

export interface CrearEventoDTO {
  condominioId: string;
  tipo: TipoEventoCalendario;
  titulo: string;
  descripcion?: string;
  fechaInicio: Date;
  fechaFin: Date;
  ubicacion?: string;
  organizador?: string;
  participantes?: string[];
  adjuntos?: string[];
  todoElDia?: boolean;
  color?: string;
}

export interface CrearRecordatorioDTO {
  eventoId: string;
  usuarioId: string;
  tiempoAntes: number;
  metodo: 'email' | 'whatsapp' | 'notificacion';
}

export class CalendarioService {
  private static instance: CalendarioService;

  private constructor() {}

  public static getInstance(): CalendarioService {
    if (!CalendarioService.instance) {
      CalendarioService.instance = new CalendarioService();
    }
    return CalendarioService.instance;
  }

  async crearEvento(data: CrearEventoDTO): Promise<any> {
    logger.warn('CalendarioService.crearEvento - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async obtenerEventos(filtros?: any): Promise<any[]> {
    logger.warn('CalendarioService.obtenerEventos - NOT IMPLEMENTED');
    return [];
  }

  async actualizarEvento(eventoId: string, data: Partial<CrearEventoDTO>): Promise<any> {
    logger.warn('CalendarioService.actualizarEvento - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async crearRecordatorio(data: CrearRecordatorioDTO): Promise<any> {
    logger.warn('CalendarioService.crearRecordatorio - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async obtenerEventoPorId(eventoId: string): Promise<any> {
    logger.warn('CalendarioService.obtenerEventoPorId - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async eliminarEvento(eventoId: string): Promise<void> {
    logger.warn('CalendarioService.eliminarEvento - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async obtenerProximosEventos(condominioId: string, dias: number): Promise<any[]> {
    logger.warn('CalendarioService.obtenerProximosEventos - NOT IMPLEMENTED');
    return [];
  }

  async agregarRecordatorio(data: CrearRecordatorioDTO): Promise<any> {
    logger.warn('CalendarioService.agregarRecordatorio - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }
}

/* ORIGINAL IMPLEMENTATION COMMENTED OUT - NEEDS FIX */
