// ========================================
// ESTADOS DE CUENTA CONTROLLER
// ========================================

import { Request, Response } from 'express';
import { EstadosCuentaService } from '../services';
import { logger } from '../utils/logger';

const estadosCuentaService = EstadosCuentaService.getInstance();

export class EstadosCuentaController {
  /**
   * Crear estado de cuenta
   */
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const estadoCuenta = await estadosCuentaService.crearEstadoCuenta(req.body);
      res.status(201).json(estadoCuenta);
    } catch (error) {
      logger.error('Error en EstadosCuentaController.crear:', error);
      res.status(500).json({ error: 'Error al crear estado de cuenta' });
    }
  }

  /**
   * Registrar transacción
   */
  async registrarTransaccion(req: Request, res: Response): Promise<void> {
    try {
      const transaccion = await estadosCuentaService.registrarTransaccion(req.body);
      res.status(201).json(transaccion);
    } catch (error) {
      logger.error('Error en EstadosCuentaController.registrarTransaccion:', error);
      res.status(500).json({ error: 'Error al registrar transacción' });
    }
  }

  /**
   * Procesar distribución de gastos
   */
  async procesarDistribucion(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId, periodo } = req.body;
      await estadosCuentaService.procesarDistribucionGastos(condominioId, periodo);
      res.json({ mensaje: 'Distribución procesada exitosamente' });
    } catch (error) {
      logger.error('Error en EstadosCuentaController.procesarDistribucion:', error);
      res.status(500).json({ error: 'Error al procesar distribución' });
    }
  }

  /**
   * Registrar pago
   */
  async registrarPago(req: Request, res: Response): Promise<void> {
    try {
      const { unidadId, periodo, monto, metodoPago, referencia, notas } = req.body;

      const transaccion = await estadosCuentaService.registrarPago(
        unidadId,
        periodo,
        monto,
        metodoPago,
        referencia,
        notas
      );

      res.status(201).json(transaccion);
    } catch (error) {
      logger.error('Error en EstadosCuentaController.registrarPago:', error);
      res.status(500).json({ error: 'Error al registrar pago' });
    }
  }

  /**
   * Obtener estado de cuenta
   */
  async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { unidadId, periodo } = req.query;

      const estadoCuenta = await estadosCuentaService.obtenerEstadoCuenta(
        unidadId as string,
        periodo as string
      );

      if (!estadoCuenta) {
        res.status(404).json({ error: 'Estado de cuenta no encontrado' });
        return;
      }

      res.json(estadoCuenta);
    } catch (error) {
      logger.error('Error en EstadosCuentaController.obtener:', error);
      res.status(500).json({ error: 'Error al obtener estado de cuenta' });
    }
  }

  /**
   * Obtener historial
   */
  async obtenerHistorial(req: Request, res: Response): Promise<void> {
    try {
      const { unidadId } = req.params;
      const historial = await estadosCuentaService.obtenerHistorialEstadosCuenta(
        unidadId
      );
      res.json(historial);
    } catch (error) {
      logger.error('Error en EstadosCuentaController.obtenerHistorial:', error);
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  }

  /**
   * Obtener unidades morosas
   */
  async obtenerMorosas(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId, periodo } = req.query;

      const morosas = await estadosCuentaService.obtenerUnidadesMorosas(
        condominioId as string,
        periodo as string
      );

      res.json(morosas);
    } catch (error) {
      logger.error('Error en EstadosCuentaController.obtenerMorosas:', error);
      res.status(500).json({ error: 'Error al obtener unidades morosas' });
    }
  }

  /**
   * Generar reporte de recaudación
   */
  async generarReporteRecaudacion(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId, periodo } = req.query;

      const reporte = await estadosCuentaService.generarReporteRecaudacion(
        condominioId as string,
        periodo as string
      );

      res.json(reporte);
    } catch (error) {
      logger.error('Error en EstadosCuentaController.generarReporteRecaudacion:', error);
      res.status(500).json({ error: 'Error al generar reporte de recaudación' });
    }
  }

  /**
   * Generar recordatorios de pago
   */
  async generarRecordatorios(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId, periodo } = req.query;

      const recordatorios = await estadosCuentaService.generarRecordatoriosPago(
        condominioId as string,
        periodo as string
      );

      res.json(recordatorios);
    } catch (error) {
      logger.error('Error en EstadosCuentaController.generarRecordatorios:', error);
      res.status(500).json({ error: 'Error al generar recordatorios' });
    }
  }
}

export default new EstadosCuentaController();
