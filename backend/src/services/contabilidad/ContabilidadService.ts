/**
 * CONTABILIDAD SERVICE - STUB
 * TEMPORARILY DISABLED - Implementation needs to be fixed
 */

import { logger } from '../../utils/logger';
import { TipoNCF } from '@prisma/client';

export interface CrearGastoDTO {
  organizacionId: string;
  condominioId: string;
  cuentaContableId: string;
  proveedorId?: string;
  numeroFactura?: string;
  tipoNCF?: TipoNCF;
  ncf?: string;
  concepto: string;
  descripcion?: string;
  subtotal: number;
  itbis?: number;
  total: number;
  fechaEmision: Date;
  fechaVencimiento?: Date;
  formaPago: string;
  distribuirUnidades: boolean;
  adjuntos?: string[];
  notas?: string;
}

export interface CrearIngresoDTO {
  organizacionId: string;
  condominioId: string;
  cuentaContableId: string;
  unidadId?: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  fechaRecepcion: Date;
  metodoPago: string;
  referencia?: string;
  adjuntos?: string[];
}

export class ContabilidadService {
  private static instance: ContabilidadService;

  private constructor() {}

  public static getInstance(): ContabilidadService {
    if (!ContabilidadService.instance) {
      ContabilidadService.instance = new ContabilidadService();
    }
    return ContabilidadService.instance;
  }

  async registrarGasto(data: CrearGastoDTO): Promise<any> {
    logger.warn('ContabilidadService.registrarGasto - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async registrarIngreso(data: CrearIngresoDTO): Promise<any> {
    logger.warn('ContabilidadService.registrarIngreso - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }

  async obtenerGastos(filtros?: any): Promise<any[]> {
    logger.warn('ContabilidadService.obtenerGastos - NOT IMPLEMENTED');
    return [];
  }

  async obtenerIngresos(filtros?: any): Promise<any[]> {
    logger.warn('ContabilidadService.obtenerIngresos - NOT IMPLEMENTED');
    return [];
  }

  async obtenerResumenFinanciero(condominioId: string, periodo: string): Promise<any> {
    logger.warn('ContabilidadService.obtenerResumenFinanciero - NOT IMPLEMENTED');
    return { ingresos: 0, gastos: 0, balance: 0 };
  }

  async generarNCF(tipoNCF: TipoNCF, organizacionId: string): Promise<string> {
    logger.warn('ContabilidadService.generarNCF - NOT IMPLEMENTED');
    throw new Error('Not implemented');
  }
}

/* ORIGINAL IMPLEMENTATION COMMENTED OUT - NEEDS FIX */
