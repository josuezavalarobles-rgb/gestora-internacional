/**
 * ========================================
 * RUTAS DEL DASHBOARD ADMINISTRATIVO
 * ========================================
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';

const router = Router();

/**
 * GET /api/v1/dashboard/metricas
 * Obtener métricas generales del dashboard
 *
 * Query params:
 * - fechaInicio: Date (opcional)
 * - fechaFin: Date (opcional)
 * - condominioId: string (opcional)
 */
router.get('/metricas', DashboardController.obtenerMetricas);

/**
 * GET /api/v1/dashboard/resumen
 * Obtener resumen ejecutivo (hoy, este mes, total)
 *
 * Query params:
 * - condominioId: string (opcional)
 */
router.get('/resumen', DashboardController.obtenerResumen);

/**
 * GET /api/v1/dashboard/casos
 * Obtener lista de casos con detalles
 *
 * Query params:
 * - estado: string (opcional)
 * - condominioId: string (opcional)
 * - tecnicoId: string (opcional)
 * - fechaInicio: Date (opcional)
 * - fechaFin: Date (opcional)
 * - prioridad: string (opcional)
 * - pagina: number (default: 1)
 * - limite: number (default: 50)
 */
router.get('/casos', DashboardController.obtenerCasos);

/**
 * GET /api/v1/dashboard/conversaciones
 * Obtener historial de conversaciones de WhatsApp
 *
 * Query params:
 * - telefono: string (opcional)
 * - fechaInicio: Date (opcional)
 * - fechaFin: Date (opcional)
 * - pagina: number (default: 1)
 * - limite: number (default: 20)
 */
router.get('/conversaciones', DashboardController.obtenerConversaciones);

/**
 * GET /api/v1/dashboard/conversaciones/:telefono
 * Obtener conversación específica por teléfono
 */
router.get('/conversaciones/:telefono', DashboardController.obtenerConversacionPorTelefono);

/**
 * GET /api/v1/dashboard/satisfaccion
 * Obtener estadísticas de satisfacción del cliente
 *
 * Query params:
 * - fechaInicio: Date (opcional)
 * - fechaFin: Date (opcional)
 * - condominioId: string (opcional)
 */
router.get('/satisfaccion', DashboardController.obtenerSatisfaccion);

/**
 * GET /api/v1/dashboard/reporte
 * Generar reporte exportable completo
 *
 * Query params:
 * - fechaInicio: Date (requerido)
 * - fechaFin: Date (requerido)
 * - condominioId: string (opcional)
 */
router.get('/reporte', DashboardController.generarReporte);

/**
 * GET /api/v1/dashboard/export/reporte-excel
 * Exportar reporte completo a Excel
 *
 * Query params:
 * - fechaInicio: Date (requerido)
 * - fechaFin: Date (requerido)
 * - condominioId: string (opcional)
 */
router.get('/export/reporte-excel', DashboardController.exportarReporteExcel);

/**
 * GET /api/v1/dashboard/export/casos-excel
 * Exportar casos a Excel
 *
 * Query params:
 * - estado: string (opcional)
 * - condominioId: string (opcional)
 * - tecnicoId: string (opcional)
 * - fechaInicio: Date (opcional)
 * - fechaFin: Date (opcional)
 */
router.get('/export/casos-excel', DashboardController.exportarCasosExcel);

export default router;
