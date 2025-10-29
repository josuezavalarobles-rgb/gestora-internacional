// ========================================
// CONTROLADOR DE CITAS
// ========================================

import { Request, Response } from 'express';
import CitasService from '../services/citas/CitasService';
import { logger } from '../utils/logger';

export class CitasController {
  /**
   * Inicializar bloques horarios estándar
   */
  async inicializarBloques(req: Request, res: Response) {
    try {
      const resultado = await CitasService.inicializarBloquesHorarios();
      res.json(resultado);
    } catch (error) {
      logger.error('Error en inicializarBloques:', error);
      res.status(500).json({ success: false, error: 'Error al inicializar bloques' });
    }
  }

  /**
   * Obtener bloques horarios activos
   */
  async obtenerBloques(req: Request, res: Response) {
    try {
      const resultado = await CitasService.obtenerBloquesHorarios();
      res.json(resultado);
    } catch (error) {
      logger.error('Error en obtenerBloques:', error);
      res.status(500).json({ success: false, error: 'Error al obtener bloques' });
    }
  }

  /**
   * Obtener horarios disponibles para una fecha
   */
  async obtenerDisponibilidad(req: Request, res: Response) {
    try {
      const { fecha } = req.params;
      const fechaObj = new Date(fecha);

      const resultado = await CitasService.obtenerHorariosDisponibles(fechaObj);
      res.json(resultado);
    } catch (error) {
      logger.error('Error en obtenerDisponibilidad:', error);
      res.status(500).json({ success: false, error: 'Error al obtener disponibilidad' });
    }
  }

  /**
   * Programar una nueva cita
   */
  async programarCita(req: Request, res: Response) {
    try {
      const { casoId, fecha, bloqueHorarioId, tecnicoId, notas } = req.body;

      if (!casoId || !fecha || !bloqueHorarioId) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos',
        });
      }

      const resultado = await CitasService.programarCita({
        casoId,
        fecha: new Date(fecha),
        bloqueHorarioId,
        tecnicoId,
        notas,
      });

      if (resultado.success) {
        res.status(201).json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en programarCita:', error);
      res.status(500).json({ success: false, error: 'Error al programar cita' });
    }
  }

  /**
   * Confirmar cita por propietario
   */
  async confirmarPropietario(req: Request, res: Response) {
    try {
      const { citaId } = req.params;

      const resultado = await CitasService.confirmarCitaPropietario(citaId);

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en confirmarPropietario:', error);
      res.status(500).json({ success: false, error: 'Error al confirmar cita' });
    }
  }

  /**
   * Confirmar cita por ingeniería
   */
  async confirmarIngenieria(req: Request, res: Response) {
    try {
      const { citaId } = req.params;
      const { tecnicoId } = req.body;

      if (!tecnicoId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el ID del técnico',
        });
      }

      const resultado = await CitasService.confirmarCitaIngenieria(citaId, tecnicoId);

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en confirmarIngenieria:', error);
      res.status(500).json({ success: false, error: 'Error al confirmar cita' });
    }
  }

  /**
   * Reprogramar cita
   */
  async reprogramarCita(req: Request, res: Response) {
    try {
      const { citaId } = req.params;
      const { nuevaFecha, nuevoBloqueId, motivo } = req.body;

      if (!nuevaFecha || !nuevoBloqueId) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos',
        });
      }

      const resultado = await CitasService.reprogramarCita({
        citaId,
        nuevaFecha: new Date(nuevaFecha),
        nuevoBloqueId,
        motivo,
      });

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en reprogramarCita:', error);
      res.status(500).json({ success: false, error: 'Error al reprogramar cita' });
    }
  }

  /**
   * Cancelar cita
   */
  async cancelarCita(req: Request, res: Response) {
    try {
      const { citaId } = req.params;
      const { motivo } = req.body;

      if (!motivo) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el motivo de cancelación',
        });
      }

      const resultado = await CitasService.cancelarCita(citaId, motivo);

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en cancelarCita:', error);
      res.status(500).json({ success: false, error: 'Error al cancelar cita' });
    }
  }

  /**
   * Marcar cita como completada
   */
  async completarCita(req: Request, res: Response) {
    try {
      const { citaId } = req.params;
      const { solucionado, comentarioPropietario } = req.body;

      if (solucionado === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere indicar si el problema fue solucionado',
        });
      }

      const resultado = await CitasService.marcarCitaCompletada({
        citaId,
        solucionado,
        comentarioPropietario,
      });

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en completarCita:', error);
      res.status(500).json({ success: false, error: 'Error al completar cita' });
    }
  }

  /**
   * Marcar cita como no realizada
   */
  async noRealizarCita(req: Request, res: Response) {
    try {
      const { citaId } = req.params;
      const { motivo } = req.body;

      if (!motivo) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el motivo',
        });
      }

      const resultado = await CitasService.marcarCitaNoRealizada(citaId, motivo);

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(400).json(resultado);
      }
    } catch (error) {
      logger.error('Error en noRealizarCita:', error);
      res.status(500).json({ success: false, error: 'Error al marcar cita' });
    }
  }

  /**
   * Obtener citas del día
   */
  async obtenerCitasDelDia(req: Request, res: Response) {
    try {
      const { fecha } = req.params;
      const fechaObj = new Date(fecha);

      const resultado = await CitasService.obtenerCitasDelDia(fechaObj);
      res.json(resultado);
    } catch (error) {
      logger.error('Error en obtenerCitasDelDia:', error);
      res.status(500).json({ success: false, error: 'Error al obtener citas' });
    }
  }

  /**
   * Obtener citas por técnico
   */
  async obtenerCitasPorTecnico(req: Request, res: Response) {
    try {
      const { tecnicoId } = req.params;
      const { fechaInicio, fechaFin } = req.query;

      const resultado = await CitasService.obtenerCitasPorTecnico(
        tecnicoId,
        fechaInicio ? new Date(fechaInicio as string) : undefined,
        fechaFin ? new Date(fechaFin as string) : undefined
      );

      res.json(resultado);
    } catch (error) {
      logger.error('Error en obtenerCitasPorTecnico:', error);
      res.status(500).json({ success: false, error: 'Error al obtener citas' });
    }
  }

  /**
   * Obtener cita por ID
   */
  async obtenerCitaPorId(req: Request, res: Response) {
    try {
      const { citaId } = req.params;

      const resultado = await CitasService.obtenerCitaPorId(citaId);

      if (resultado.success) {
        res.json(resultado);
      } else {
        res.status(404).json(resultado);
      }
    } catch (error) {
      logger.error('Error en obtenerCitaPorId:', error);
      res.status(500).json({ success: false, error: 'Error al obtener cita' });
    }
  }

  /**
   * Obtener citas pendientes de confirmación
   */
  async obtenerPendientes(req: Request, res: Response) {
    try {
      const resultado = await CitasService.obtenerCitasPendientesConfirmacion();
      res.json(resultado);
    } catch (error) {
      logger.error('Error en obtenerPendientes:', error);
      res.status(500).json({ success: false, error: 'Error al obtener citas' });
    }
  }

  /**
   * Obtener estadísticas de citas
   */
  async obtenerEstadisticas(req: Request, res: Response) {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren fechaInicio y fechaFin',
        });
      }

      const resultado = await CitasService.obtenerEstadisticasCitas(
        new Date(fechaInicio as string),
        new Date(fechaFin as string)
      );

      res.json(resultado);
    } catch (error) {
      logger.error('Error en obtenerEstadisticas:', error);
      res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
  }
}

export default new CitasController();
