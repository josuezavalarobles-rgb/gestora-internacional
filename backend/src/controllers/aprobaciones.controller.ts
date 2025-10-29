// ========================================
// CONTROLADOR DE APROBACIONES
// ========================================

import { Request, Response } from 'express';
import AprobacionesService from '../services/aprobaciones/AprobacionesService';
import { logger } from '../utils/logger';

export class AprobacionesController {
  /**
   * Solicitar una nueva aprobación
   */
  async solicitarAprobacion(req: Request, res: Response) {
    try {
      const { casoId, tipoAprobacion, descripcion, costoEstimado, justificacion, solicitadoPor } =
        req.body;

      if (!casoId || !tipoAprobacion || !descripcion || !solicitadoPor) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos',
        });
      }

      const resultado = await AprobacionesService.solicitarAprobacion({
        casoId,
        tipoAprobacion,
        descripcion,
        costoEstimado,
        justificacion,
        solicitadoPor,
      });

      if (resultado.success) {
        res.status(201).json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en solicitarAprobacion:', error);
      res.status(500).json({ success: false, error: 'Error al solicitar aprobación' });
    }
  }

  /**
   * Aprobar una solicitud
   */
  async aprobar(req: Request, res: Response) {
    try {
      const { aprobacionId } = req.params;
      const { adminId, comentarios } = req.body;

      if (!adminId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el ID del administrador',
        });
      }

      const resultado = await AprobacionesService.aprobar({
        aprobacionId,
        adminId,
        comentarios,
      });

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en aprobar:', error);
      res.status(500).json({ success: false, error: 'Error al aprobar' });
    }
  }

  /**
   * Rechazar una solicitud
   */
  async rechazar(req: Request, res: Response) {
    try {
      const { aprobacionId } = req.params;
      const { adminId, motivo } = req.body;

      if (!adminId || !motivo) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren adminId y motivo',
        });
      }

      const resultado = await AprobacionesService.rechazar({
        aprobacionId,
        adminId,
        motivo,
      });

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en rechazar:', error);
      res.status(500).json({ success: false, error: 'Error al rechazar' });
    }
  }

  /**
   * Solicitar más información
   */
  async solicitarInfo(req: Request, res: Response) {
    try {
      const { aprobacionId } = req.params;
      const { adminId, comentarios } = req.body;

      if (!adminId || !comentarios) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren adminId y comentarios',
        });
      }

      const resultado = await AprobacionesService.solicitarMasInformacion({
        aprobacionId,
        adminId,
        comentarios,
      });

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en solicitarInfo:', error);
      res.status(500).json({ success: false, error: 'Error al solicitar información' });
    }
  }

  /**
   * Obtener aprobaciones pendientes
   */
  async obtenerPendientes(req: Request, res: Response) {
    try {
      const resultado = await AprobacionesService.obtenerPendientes();
      res.json(resultado);
    } catch (error) {
      logger.error('Error en obtenerPendientes:', error);
      res.status(500).json({ success: false, error: 'Error al obtener aprobaciones' });
    }
  }

  /**
   * Obtener aprobación por ID
   */
  async obtenerPorId(req: Request, res: Response) {
    try {
      const { aprobacionId } = req.params;

      const resultado = await AprobacionesService.obtenerPorId(aprobacionId);

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(404).json(resultado);
      }
    } catch (error) {
      logger.error('Error en obtenerPorId:', error);
      res.status(500).json({ success: false, error: 'Error al obtener aprobación' });
    }
  }

  /**
   * Obtener aprobaciones por caso
   */
  async obtenerPorCaso(req: Request, res: Response) {
    try {
      const { casoId } = req.params;

      const resultado = await AprobacionesService.obtenerPorCaso(casoId);
      res.json(resultado);
    } catch (error) {
      logger.error('Error en obtenerPorCaso:', error);
      res.status(500).json({ success: false, error: 'Error al obtener aprobaciones' });
    }
  }

  /**
   * Obtener aprobaciones por técnico
   */
  async obtenerPorTecnico(req: Request, res: Response) {
    try {
      const { tecnicoId } = req.params;

      const resultado = await AprobacionesService.obtenerPorTecnico(tecnicoId);
      res.json(resultado);
    } catch (error) {
      logger.error('Error en obtenerPorTecnico:', error);
      res.status(500).json({ success: false, error: 'Error al obtener aprobaciones' });
    }
  }

  /**
   * Obtener todas las aprobaciones con filtros
   */
  async obtenerTodas(req: Request, res: Response) {
    try {
      const { estado, tipoAprobacion, fechaInicio, fechaFin } = req.query;

      const filtros: any = {};

      if (estado) filtros.estado = estado as string;
      if (tipoAprobacion) filtros.tipoAprobacion = tipoAprobacion as string;
      if (fechaInicio) filtros.fechaInicio = new Date(fechaInicio as string);
      if (fechaFin) filtros.fechaFin = new Date(fechaFin as string);

      const resultado = await AprobacionesService.obtenerTodas(filtros);
      res.json(resultado);
    } catch (error) {
      logger.error('Error en obtenerTodas:', error);
      res.status(500).json({ success: false, error: 'Error al obtener aprobaciones' });
    }
  }

  /**
   * Obtener estadísticas de aprobaciones
   */
  async obtenerEstadisticas(req: Request, res: Response) {
    try {
      const { fechaInicio, fechaFin } = req.query;

      const resultado = await AprobacionesService.obtenerEstadisticas(
        fechaInicio ? new Date(fechaInicio as string) : undefined,
        fechaFin ? new Date(fechaFin as string) : undefined
      );

      res.json(resultado);
    } catch (error) {
      logger.error('Error en obtenerEstadisticas:', error);
      res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
  }

  /**
   * Actualizar una aprobación
   */
  async actualizarAprobacion(req: Request, res: Response) {
    try {
      const { aprobacionId } = req.params;
      const { descripcion, costoEstimado, justificacion } = req.body;

      const resultado = await AprobacionesService.actualizarAprobacion({
        aprobacionId,
        descripcion,
        costoEstimado,
        justificacion,
      });

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en actualizarAprobacion:', error);
      res.status(500).json({ success: false, error: 'Error al actualizar aprobación' });
    }
  }

  /**
   * Eliminar una aprobación
   */
  async eliminarAprobacion(req: Request, res: Response) {
    try {
      const { aprobacionId } = req.params;
      const { usuarioId } = req.body;

      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el ID del usuario',
        });
      }

      const resultado = await AprobacionesService.eliminarAprobacion(aprobacionId, usuarioId);

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en eliminarAprobacion:', error);
      res.status(500).json({ success: false, error: 'Error al eliminar aprobación' });
    }
  }
}

export default new AprobacionesController();
