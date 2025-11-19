/**
 * PREDICCION IA SERVICE - STUB
 * TEMPORARILY DISABLED - Implementation needs to be fixed
 */

import { logger } from '../../utils/logger';

export interface DatosPrediccion {
  valores: number[];
  fechas: Date[];
}

export interface ResultadoPrediccion {
  valorPredicho: number;
  confianza: number;
  rangoMinimo: number;
  rangoMaximo: number;
  factores: string[];
}

export class PrediccionIAService {
  private static instance: PrediccionIAService;

  private constructor() {}

  public static getInstance(): PrediccionIAService {
    if (!PrediccionIAService.instance) {
      PrediccionIAService.instance = new PrediccionIAService();
    }
    return PrediccionIAService.instance;
  }

  async predecirGastoMensual(condominioId: string): Promise<ResultadoPrediccion> {
    logger.warn('PrediccionIAService.predecirGastoMensual - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async predecirConsumoEnergia(condominioId: string): Promise<ResultadoPrediccion> {
    logger.warn('PrediccionIAService.predecirConsumoEnergia - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async obtenerPredicciones(condominioId: string): Promise<any[]> {
    logger.warn('PrediccionIAService.obtenerPredicciones - NOT IMPLEMENTED');
    return [];
  }
}

/* ORIGINAL IMPLEMENTATION COMMENTED OUT - NEEDS FIX */
