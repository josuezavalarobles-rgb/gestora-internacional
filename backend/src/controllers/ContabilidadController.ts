// ========================================
// CONTABILIDAD CONTROLLER
// ========================================

import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export class ContabilidadController {
  // ========================================
  // NCF
  // ========================================

  async crearSecuenciaNCF(req: Request, res: Response): Promise<void> {
    logger.warn('ContabilidadController.crearSecuenciaNCF - NOT IMPLEMENTED');
    res.status(501).json({
      success: false,
      error: 'Funcionalidad temporalmente deshabilitada'
    });
  }

  async obtenerSiguienteNCF(req: Request, res: Response): Promise<void> {
    logger.warn('ContabilidadController.obtenerSiguienteNCF - NOT IMPLEMENTED');
    res.status(501).json({
      success: false,
      error: 'Funcionalidad temporalmente deshabilitada'
    });
  }

  // ========================================
  // PLAN DE CUENTAS
  // ========================================

  async crearCuentaContable(req: Request, res: Response): Promise<void> {
    logger.warn('ContabilidadController.crearCuentaContable - NOT IMPLEMENTED');
    res.status(501).json({
      success: false,
      error: 'Funcionalidad temporalmente deshabilitada'
    });
  }

  async obtenerPlanCuentas(req: Request, res: Response): Promise<void> {
    logger.warn('ContabilidadController.obtenerPlanCuentas - NOT IMPLEMENTED');
    res.status(501).json({
      success: false,
      error: 'Funcionalidad temporalmente deshabilitada',
      data: []
    });
  }

  // ========================================
  // GASTOS
  // ========================================

  async crearGasto(req: Request, res: Response): Promise<void> {
    logger.warn('ContabilidadController.crearGasto - NOT IMPLEMENTED');
    res.status(501).json({
      success: false,
      error: 'Funcionalidad temporalmente deshabilitada'
    });
  }

  async obtenerGastos(req: Request, res: Response): Promise<void> {
    logger.warn('ContabilidadController.obtenerGastos - NOT IMPLEMENTED');
    res.status(501).json({
      success: false,
      error: 'Funcionalidad temporalmente deshabilitada',
      data: []
    });
  }

  async marcarGastoPagado(req: Request, res: Response): Promise<void> {
    logger.warn('ContabilidadController.marcarGastoPagado - NOT IMPLEMENTED');
    res.status(501).json({
      success: false,
      error: 'Funcionalidad temporalmente deshabilitada'
    });
  }

  // ========================================
  // INGRESOS
  // ========================================

  async crearIngreso(req: Request, res: Response): Promise<void> {
    logger.warn('ContabilidadController.crearIngreso - NOT IMPLEMENTED');
    res.status(501).json({
      success: false,
      error: 'Funcionalidad temporalmente deshabilitada'
    });
  }

  async obtenerIngresos(req: Request, res: Response): Promise<void> {
    logger.warn('ContabilidadController.obtenerIngresos - NOT IMPLEMENTED');
    res.status(501).json({
      success: false,
      error: 'Funcionalidad temporalmente deshabilitada',
      data: []
    });
  }

  // ========================================
  // REPORTES
  // ========================================

  async obtenerBalanceSaldos(req: Request, res: Response): Promise<void> {
    logger.warn('ContabilidadController.obtenerBalanceSaldos - NOT IMPLEMENTED');
    res.status(501).json({
      success: false,
      error: 'Funcionalidad temporalmente deshabilitada'
    });
  }

  async obtenerGastosPorCategoria(req: Request, res: Response): Promise<void> {
    logger.warn('ContabilidadController.obtenerGastosPorCategoria - NOT IMPLEMENTED');
    res.status(501).json({
      success: false,
      error: 'Funcionalidad temporalmente deshabilitada',
      data: []
    });
  }
}

export default new ContabilidadController();
