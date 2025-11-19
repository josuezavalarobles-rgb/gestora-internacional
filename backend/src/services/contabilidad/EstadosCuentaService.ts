/**
 * ESTADOS DE CUENTA SERVICE - STUB
 * TEMPORARILY DISABLED - Implementation needs to be fixed
 */

import { logger } from '../../utils/logger';

export interface CrearEstadoCuentaDTO {
  unidadId: string;
  periodo: string;
  saldoAnterior?: number;
  notas?: string;
}

export interface RegistrarTransaccionDTO {
  estadoCuentaId: string;
  tipo: 'cargo' | 'abono';
  concepto: string;
  descripcion?: string;
  monto: number;
  fecha: Date;
  gastoId?: string;
  ingresoId?: string;
  referencia?: string;
}

export class EstadosCuentaService {
  private static instance: EstadosCuentaService;

  private constructor() {}

  public static getInstance(): EstadosCuentaService {
    if (!EstadosCuentaService.instance) {
      EstadosCuentaService.instance = new EstadosCuentaService();
    }
    return EstadosCuentaService.instance;
  }

  async crearEstadoCuenta(data: CrearEstadoCuentaDTO): Promise<any> {
    logger.warn('EstadosCuentaService.crearEstadoCuenta - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async obtenerEstadoCuenta(unidadId: string, periodo: string): Promise<any> {
    logger.warn('EstadosCuentaService.obtenerEstadoCuenta - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async registrarTransaccion(data: RegistrarTransaccionDTO): Promise<any> {
    logger.warn('EstadosCuentaService.registrarTransaccion - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async obtenerTransacciones(estadoCuentaId: string): Promise<any[]> {
    logger.warn('EstadosCuentaService.obtenerTransacciones - NOT IMPLEMENTED');
    return [];
  }

  async obtenerResumenUnidad(unidadId: string): Promise<any> {
    logger.warn('EstadosCuentaService.obtenerResumenUnidad - NOT IMPLEMENTED');
    return { saldoActual: 0, pendiente: 0, pagado: 0 };
  }
}

/* ORIGINAL IMPLEMENTATION COMMENTED OUT - NEEDS FIX */
