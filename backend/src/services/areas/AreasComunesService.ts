/**
 * AREAS COMUNES SERVICE - STUB
 * TEMPORARILY DISABLED - Implementation needs to be fixed
 */

import { logger } from '../../utils/logger';
import { TipoAreaComun } from '@prisma/client';

export interface CrearAreaComunDTO {
  condominioId: string;
  nombre: string;
  tipo: TipoAreaComun;
  descripcion?: string;
  capacidadMaxima?: number;
  costoPorHora?: number;
  horarioApertura?: string;
  horarioCierre?: string;
  diasDisponibles?: string[];
  requiereAprobacion?: boolean;
  tiempoMinimoReserva?: number;
  tiempoMaximoReserva?: number;
  anticipacionMinima?: number;
  normas?: string;
  foto?: string;
}

export interface CrearReservaDTO {
  areaId: string;
  unidadId: string;
  fechaInicio: Date;
  fechaFin: Date;
  cantidadPersonas?: number;
  proposito?: string;
  observaciones?: string;
}

export class AreasComunesService {
  private static instance: AreasComunesService;

  private constructor() {}

  public static getInstance(): AreasComunesService {
    if (!AreasComunesService.instance) {
      AreasComunesService.instance = new AreasComunesService();
    }
    return AreasComunesService.instance;
  }

  async crearArea(data: CrearAreaComunDTO): Promise<any> {
    logger.warn('AreasComunesService.crearArea - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async obtenerAreas(condominioId: string): Promise<any[]> {
    logger.warn('AreasComunesService.obtenerAreas - NOT IMPLEMENTED');
    return [];
  }

  async crearReserva(data: CrearReservaDTO): Promise<any> {
    logger.warn('AreasComunesService.crearReserva - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async obtenerReservas(filtros?: any): Promise<any[]> {
    logger.warn('AreasComunesService.obtenerReservas - NOT IMPLEMENTED');
    return [];
  }

  async cancelarReserva(reservaId: string): Promise<any> {
    logger.warn('AreasComunesService.cancelarReserva - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async verificarDisponibilidad(areaId: string, fechaInicio: Date, fechaFin: Date): Promise<boolean> {
    logger.warn('AreasComunesService.verificarDisponibilidad - NOT IMPLEMENTED');
    return false;
  }
}

/* ORIGINAL IMPLEMENTATION COMMENTED OUT - NEEDS FIX */
