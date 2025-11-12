// ========================================
// PROVEEDOR CONTROLLER
// ========================================

import { Request, Response } from 'express';
import { ProveedorService } from '../services';
import { logger } from '../utils/logger';

const proveedorService = ProveedorService.getInstance();

export class ProveedorController {
  /**
   * Crear proveedor
   */
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const proveedor = await proveedorService.crearProveedor(req.body);
      res.status(201).json(proveedor);
    } catch (error) {
      logger.error('Error en ProveedorController.crear:', error);
      res.status(500).json({ error: 'Error al crear proveedor' });
    }
  }

  /**
   * Obtener todos los proveedores
   */
  async obtenerTodos(req: Request, res: Response): Promise<void> {
    try {
      const { organizacionId, tipo, activo, buscar } = req.query;

      const proveedores = await proveedorService.obtenerProveedores(
        organizacionId as string,
        {
          tipo: tipo as any,
          activo: activo ? activo === 'true' : undefined,
          buscar: buscar as string,
        }
      );

      res.json(proveedores);
    } catch (error) {
      logger.error('Error en ProveedorController.obtenerTodos:', error);
      res.status(500).json({ error: 'Error al obtener proveedores' });
    }
  }

  /**
   * Obtener proveedor por ID
   */
  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const proveedor = await proveedorService.obtenerProveedorPorId(req.params.id);

      if (!proveedor) {
        res.status(404).json({ error: 'Proveedor no encontrado' });
        return;
      }

      res.json(proveedor);
    } catch (error) {
      logger.error('Error en ProveedorController.obtenerPorId:', error);
      res.status(500).json({ error: 'Error al obtener proveedor' });
    }
  }

  /**
   * Actualizar proveedor
   */
  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const proveedor = await proveedorService.actualizarProveedor(
        req.params.id,
        req.body
      );
      res.json(proveedor);
    } catch (error) {
      logger.error('Error en ProveedorController.actualizar:', error);
      res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
  }

  /**
   * Evaluar proveedor
   */
  async evaluar(req: Request, res: Response): Promise<void> {
    try {
      const evaluacion = await proveedorService.evaluarProveedor(req.body);
      res.status(201).json(evaluacion);
    } catch (error) {
      logger.error('Error en ProveedorController.evaluar:', error);
      res.status(500).json({ error: 'Error al evaluar proveedor' });
    }
  }

  /**
   * Obtener top proveedores
   */
  async obtenerTop(req: Request, res: Response): Promise<void> {
    try {
      const { organizacionId } = req.query;
      const limite = parseInt(req.query.limite as string) || 10;

      const proveedores = await proveedorService.obtenerTopProveedores(
        organizacionId as string,
        limite
      );

      res.json(proveedores);
    } catch (error) {
      logger.error('Error en ProveedorController.obtenerTop:', error);
      res.status(500).json({ error: 'Error al obtener top proveedores' });
    }
  }

  /**
   * Desactivar proveedor
   */
  async desactivar(req: Request, res: Response): Promise<void> {
    try {
      await proveedorService.desactivarProveedor(req.params.id);
      res.json({ mensaje: 'Proveedor desactivado exitosamente' });
    } catch (error) {
      logger.error('Error en ProveedorController.desactivar:', error);
      res.status(500).json({ error: 'Error al desactivar proveedor' });
    }
  }
}

export default new ProveedorController();
