/**
 * ========================================
 * ADMIN CONTROLLER
 * Gestión administrativa y limpieza de datos
 * ========================================
 */

import { Request, Response } from 'express';
import { AdminService } from '../services/admin/AdminService';
import { logger } from '../utils/logger';

const adminService = AdminService.getInstance();

/**
 * Limpiar TODOS los datos de prueba
 * DELETE /api/v1/admin/limpiar-todos-datos
 */
export const limpiarTodosLosDatos = async (req: Request, res: Response) => {
  try {
    logger.warn('⚠️  Solicitud de limpieza COMPLETA de datos recibida');

    const resultado = await adminService.limpiarTodosLosDatos();

    res.status(200).json({
      success: true,
      message: 'Todos los datos han sido eliminados exitosamente',
      data: resultado,
    });
  } catch (error) {
    logger.error('❌ Error al limpiar todos los datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar los datos',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * Limpiar solo datos de DEMO
 * DELETE /api/v1/admin/limpiar-datos-demo
 */
export const limpiarDatosDemo = async (req: Request, res: Response) => {
  try {
    logger.warn('⚠️  Solicitud de limpieza de datos DEMO recibida');

    const resultado = await adminService.limpiarDatosDemo();

    res.status(200).json({
      success: true,
      message: 'Datos de demostración eliminados exitosamente',
      data: resultado,
    });
  } catch (error) {
    logger.error('❌ Error al limpiar datos demo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar datos de demostración',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

/**
 * Obtener estadísticas de la base de datos
 * GET /api/v1/admin/estadisticas
 */
export const obtenerEstadisticas = async (req: Request, res: Response) => {
  try {
    const estadisticas = await adminService.obtenerEstadisticas();

    res.status(200).json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: estadisticas,
    });
  } catch (error) {
    logger.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
