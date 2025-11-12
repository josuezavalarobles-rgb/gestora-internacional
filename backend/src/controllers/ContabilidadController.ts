// ========================================
// CONTABILIDAD CONTROLLER
// ========================================

import { Request, Response } from 'express';
import { ContabilidadService } from '../services';
import { logger } from '../utils/logger';

const contabilidadService = ContabilidadService.getInstance();

export class ContabilidadController {
  // ========================================
  // NCF
  // ========================================

  async crearSecuenciaNCF(req: Request, res: Response): Promise<void> {
    try {
      const secuencia = await contabilidadService.crearSecuenciaNCF(req.body);
      res.status(201).json(secuencia);
    } catch (error) {
      logger.error('Error en ContabilidadController.crearSecuenciaNCF:', error);
      res.status(500).json({ error: 'Error al crear secuencia NCF' });
    }
  }

  async obtenerSiguienteNCF(req: Request, res: Response): Promise<void> {
    try {
      const { organizacionId, tipoNCF } = req.query;
      const ncf = await contabilidadService.obtenerSiguienteNCF(
        organizacionId as string,
        tipoNCF as any
      );
      res.json({ ncf });
    } catch (error) {
      logger.error('Error en ContabilidadController.obtenerSiguienteNCF:', error);
      res.status(500).json({ error: 'Error al obtener NCF' });
    }
  }

  // ========================================
  // PLAN DE CUENTAS
  // ========================================

  async crearCuentaContable(req: Request, res: Response): Promise<void> {
    try {
      const cuenta = await contabilidadService.crearCuentaContable(req.body);
      res.status(201).json(cuenta);
    } catch (error) {
      logger.error('Error en ContabilidadController.crearCuentaContable:', error);
      res.status(500).json({ error: 'Error al crear cuenta contable' });
    }
  }

  async obtenerPlanCuentas(req: Request, res: Response): Promise<void> {
    try {
      const { organizacionId } = req.query;
      const cuentas = await contabilidadService.obtenerPlanCuentas(
        organizacionId as string
      );
      res.json(cuentas);
    } catch (error) {
      logger.error('Error en ContabilidadController.obtenerPlanCuentas:', error);
      res.status(500).json({ error: 'Error al obtener plan de cuentas' });
    }
  }

  // ========================================
  // GASTOS
  // ========================================

  async crearGasto(req: Request, res: Response): Promise<void> {
    try {
      const gasto = await contabilidadService.crearGasto(req.body);
      res.status(201).json(gasto);
    } catch (error) {
      logger.error('Error en ContabilidadController.crearGasto:', error);
      res.status(500).json({ error: 'Error al crear gasto' });
    }
  }

  async obtenerGastos(req: Request, res: Response): Promise<void> {
    try {
      const { organizacionId, condominioId, proveedorId, fechaDesde, fechaHasta, pagado } =
        req.query;

      const gastos = await contabilidadService.obtenerGastos(organizacionId as string, {
        condominioId: condominioId as string,
        proveedorId: proveedorId as string,
        fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
        pagado: pagado ? pagado === 'true' : undefined,
      });

      res.json(gastos);
    } catch (error) {
      logger.error('Error en ContabilidadController.obtenerGastos:', error);
      res.status(500).json({ error: 'Error al obtener gastos' });
    }
  }

  async marcarGastoPagado(req: Request, res: Response): Promise<void> {
    try {
      const { fechaPago } = req.body;
      const gasto = await contabilidadService.marcarGastoPagado(
        req.params.id,
        new Date(fechaPago)
      );
      res.json(gasto);
    } catch (error) {
      logger.error('Error en ContabilidadController.marcarGastoPagado:', error);
      res.status(500).json({ error: 'Error al marcar gasto como pagado' });
    }
  }

  // ========================================
  // INGRESOS
  // ========================================

  async crearIngreso(req: Request, res: Response): Promise<void> {
    try {
      const ingreso = await contabilidadService.crearIngreso(req.body);
      res.status(201).json(ingreso);
    } catch (error) {
      logger.error('Error en ContabilidadController.crearIngreso:', error);
      res.status(500).json({ error: 'Error al crear ingreso' });
    }
  }

  async obtenerIngresos(req: Request, res: Response): Promise<void> {
    try {
      const { organizacionId, condominioId, unidadId, fechaDesde, fechaHasta } = req.query;

      const ingresos = await contabilidadService.obtenerIngresos(
        organizacionId as string,
        {
          condominioId: condominioId as string,
          unidadId: unidadId as string,
          fechaDesde: fechaDesde ? new Date(fechaDesde as string) : undefined,
          fechaHasta: fechaHasta ? new Date(fechaHasta as string) : undefined,
        }
      );

      res.json(ingresos);
    } catch (error) {
      logger.error('Error en ContabilidadController.obtenerIngresos:', error);
      res.status(500).json({ error: 'Error al obtener ingresos' });
    }
  }

  // ========================================
  // REPORTES
  // ========================================

  async obtenerBalanceSaldos(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId, fechaDesde, fechaHasta } = req.query;

      const balance = await contabilidadService.obtenerBalanceSaldos(
        condominioId as string,
        new Date(fechaDesde as string),
        new Date(fechaHasta as string)
      );

      res.json(balance);
    } catch (error) {
      logger.error('Error en ContabilidadController.obtenerBalanceSaldos:', error);
      res.status(500).json({ error: 'Error al obtener balance de saldos' });
    }
  }

  async obtenerGastosPorCategoria(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId, fechaDesde, fechaHasta } = req.query;

      const gastos = await contabilidadService.obtenerGastosPorCategoria(
        condominioId as string,
        new Date(fechaDesde as string),
        new Date(fechaHasta as string)
      );

      res.json(gastos);
    } catch (error) {
      logger.error('Error en ContabilidadController.obtenerGastosPorCategoria:', error);
      res.status(500).json({ error: 'Error al obtener gastos por categoría' });
    }
  }
}

export default new ContabilidadController();
