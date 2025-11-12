/**
 * ========================================
 * CONTROLADOR DE DASHBOARD ADMINISTRATIVO
 * ========================================
 * Endpoints para el dashboard de monitoreo
 */

import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard/DashboardService';
import { ExportService } from '../services/export/ExportService';
import { logger } from '../utils/logger';
import * as path from 'path';

const dashboardService = DashboardService.getInstance();
const exportService = ExportService.getInstance();

export class DashboardController {
  /**
   * GET /api/v1/dashboard/metricas
   * Obtener métricas generales del dashboard
   */
  public static async obtenerMetricas(req: Request, res: Response): Promise<void> {
    try {
      const { fechaInicio, fechaFin, condominioId } = req.query;

      const inicio = fechaInicio ? new Date(fechaInicio as string) : undefined;
      const fin = fechaFin ? new Date(fechaFin as string) : undefined;

      const metricas = await dashboardService.obtenerMetricasGenerales(
        inicio,
        fin,
        condominioId as string
      );

      res.status(200).json({
        success: true,
        data: metricas,
      });
    } catch (error) {
      logger.error('❌ Error en obtenerMetricas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener métricas del dashboard',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * GET /api/v1/dashboard/casos
   * Obtener lista de casos con detalles
   */
  public static async obtenerCasos(req: Request, res: Response): Promise<void> {
    try {
      const {
        estado,
        condominioId,
        tecnicoId,
        fechaInicio,
        fechaFin,
        prioridad,
        pagina = '1',
        limite = '50',
      } = req.query;

      const filtros: any = {};

      if (estado) filtros.estado = estado as string;
      if (condominioId) filtros.condominioId = condominioId as string;
      if (tecnicoId) filtros.tecnicoId = tecnicoId as string;
      if (prioridad) filtros.prioridad = prioridad as string;
      if (fechaInicio) filtros.fechaInicio = new Date(fechaInicio as string);
      if (fechaFin) filtros.fechaFin = new Date(fechaFin as string);

      const paginacion = {
        pagina: parseInt(pagina as string),
        limite: parseInt(limite as string),
      };

      const resultado = await dashboardService.obtenerCasosDetallados(filtros, paginacion);

      res.status(200).json({
        success: true,
        data: resultado.casos,
        pagination: {
          total: resultado.total,
          pagina: paginacion.pagina,
          limite: paginacion.limite,
          totalPaginas: Math.ceil(resultado.total / paginacion.limite),
        },
      });
    } catch (error) {
      logger.error('❌ Error en obtenerCasos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener casos',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * GET /api/v1/dashboard/conversaciones
   * Obtener historial de conversaciones de WhatsApp
   */
  public static async obtenerConversaciones(req: Request, res: Response): Promise<void> {
    try {
      const { telefono, fechaInicio, fechaFin, pagina = '1', limite = '20' } = req.query;

      const filtros: any = {};

      if (telefono) filtros.telefono = telefono as string;
      if (fechaInicio) filtros.fechaInicio = new Date(fechaInicio as string);
      if (fechaFin) filtros.fechaFin = new Date(fechaFin as string);

      const paginacion = {
        pagina: parseInt(pagina as string),
        limite: parseInt(limite as string),
      };

      const resultado = await dashboardService.obtenerHistorialConversaciones(
        filtros,
        paginacion
      );

      res.status(200).json({
        success: true,
        data: resultado.conversaciones,
        pagination: {
          total: resultado.total,
          pagina: paginacion.pagina,
          limite: paginacion.limite,
          totalPaginas: Math.ceil(resultado.total / paginacion.limite),
        },
      });
    } catch (error) {
      logger.error('❌ Error en obtenerConversaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener conversaciones',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * GET /api/v1/dashboard/conversaciones/:telefono
   * Obtener conversación específica por teléfono
   */
  public static async obtenerConversacionPorTelefono(req: Request, res: Response): Promise<void> {
    try {
      const { telefono } = req.params;

      const conversacion = await dashboardService.obtenerConversacionPorTelefono(telefono);

      if (!conversacion) {
        res.status(404).json({
          success: false,
          message: 'Conversación no encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: conversacion,
      });
    } catch (error) {
      logger.error('❌ Error en obtenerConversacionPorTelefono:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener conversación',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * GET /api/v1/dashboard/satisfaccion
   * Obtener estadísticas de satisfacción del cliente
   */
  public static async obtenerSatisfaccion(req: Request, res: Response): Promise<void> {
    try {
      const { fechaInicio, fechaFin, condominioId } = req.query;

      const inicio = fechaInicio ? new Date(fechaInicio as string) : undefined;
      const fin = fechaFin ? new Date(fechaFin as string) : undefined;

      const estadisticas = await dashboardService.obtenerEstadisticasSatisfaccion(
        inicio,
        fin,
        condominioId as string
      );

      res.status(200).json({
        success: true,
        data: estadisticas,
      });
    } catch (error) {
      logger.error('❌ Error en obtenerSatisfaccion:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de satisfacción',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * GET /api/v1/dashboard/reporte
   * Generar reporte exportable completo
   */
  public static async generarReporte(req: Request, res: Response): Promise<void> {
    try {
      const { fechaInicio, fechaFin, condominioId } = req.query;

      if (!fechaInicio || !fechaFin) {
        res.status(400).json({
          success: false,
          message: 'Debe especificar fechaInicio y fechaFin',
        });
        return;
      }

      const inicio = new Date(fechaInicio as string);
      const fin = new Date(fechaFin as string);

      const reporte = await dashboardService.generarReporteExportable(
        inicio,
        fin,
        condominioId as string
      );

      res.status(200).json({
        success: true,
        data: reporte,
      });
    } catch (error) {
      logger.error('❌ Error en generarReporte:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar reporte',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * GET /api/v1/dashboard/resumen
   * Obtener resumen ejecutivo del dashboard
   */
  public static async obtenerResumen(req: Request, res: Response): Promise<void> {
    try {
      const { condominioId } = req.query;

      // Métricas de hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      const [metricasHoy, metricasMes, metricasTotal] = await Promise.all([
        // Hoy
        dashboardService.obtenerMetricasGenerales(hoy, manana, condominioId as string),
        // Este mes
        dashboardService.obtenerMetricasGenerales(
          new Date(hoy.getFullYear(), hoy.getMonth(), 1),
          new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0),
          condominioId as string
        ),
        // Histórico total
        dashboardService.obtenerMetricasGenerales(undefined, undefined, condominioId as string),
      ]);

      res.status(200).json({
        success: true,
        data: {
          hoy: metricasHoy,
          esteMes: metricasMes,
          total: metricasTotal,
        },
      });
    } catch (error) {
      logger.error('❌ Error en obtenerResumen:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen del dashboard',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * GET /api/v1/dashboard/export/reporte-excel
   * Exportar reporte completo a Excel
   */
  public static async exportarReporteExcel(req: Request, res: Response): Promise<void> {
    try {
      const { fechaInicio, fechaFin, condominioId } = req.query;

      if (!fechaInicio || !fechaFin) {
        res.status(400).json({
          success: false,
          message: 'Debe especificar fechaInicio y fechaFin',
        });
        return;
      }

      const inicio = new Date(fechaInicio as string);
      const fin = new Date(fechaFin as string);

      const filepath = await exportService.exportarReporteExcel(
        inicio,
        fin,
        condominioId as string
      );

      // Enviar archivo
      const filename = path.basename(filepath);
      res.download(filepath, filename, (err) => {
        if (err) {
          logger.error('❌ Error descargando archivo:', err);
        }
      });
    } catch (error) {
      logger.error('❌ Error en exportarReporteExcel:', error);
      res.status(500).json({
        success: false,
        message: 'Error al exportar reporte a Excel',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  /**
   * GET /api/v1/dashboard/export/casos-excel
   * Exportar casos a Excel
   */
  public static async exportarCasosExcel(req: Request, res: Response): Promise<void> {
    try {
      const { estado, condominioId, tecnicoId, fechaInicio, fechaFin } = req.query;

      const filtros: any = {};

      if (estado) filtros.estado = estado as string;
      if (condominioId) filtros.condominioId = condominioId as string;
      if (tecnicoId) filtros.tecnicoId = tecnicoId as string;
      if (fechaInicio) filtros.fechaInicio = new Date(fechaInicio as string);
      if (fechaFin) filtros.fechaFin = new Date(fechaFin as string);

      const filepath = await exportService.exportarCasosExcel(filtros);

      // Enviar archivo
      const filename = path.basename(filepath);
      res.download(filepath, filename, (err) => {
        if (err) {
          logger.error('❌ Error descargando archivo:', err);
        }
      });
    } catch (error) {
      logger.error('❌ Error en exportarCasosExcel:', error);
      res.status(500).json({
        success: false,
        message: 'Error al exportar casos a Excel',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}
