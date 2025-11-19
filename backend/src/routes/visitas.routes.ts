/**
 * ========================================
 * RUTAS DE VISITAS
 * ========================================
 */

import { Router } from 'express';
import {
  obtenerVisitas,
  obtenerVisitaById,
  registrarVisita,
  autorizarVisita,
  rechazarVisita,
  registrarSalida,
  obtenerEstadisticasVisitas,
} from '../controllers/visitas.controller';

const router = Router();

/**
 * @route   GET /api/visitas/estadisticas
 * @desc    Obtener estadísticas de visitas
 * @query   condominioId, fecha, mes
 * @access  Private
 */
router.get('/estadisticas', obtenerEstadisticasVisitas);

/**
 * @route   GET /api/visitas
 * @desc    Obtener todas las visitas con filtros
 * @query   condominioId, unidadId, estado, tipo, fecha, search
 * @access  Private
 */
router.get('/', obtenerVisitas);

/**
 * @route   GET /api/visitas/:id
 * @desc    Obtener visita por ID
 * @access  Private
 */
router.get('/:id', obtenerVisitaById);

/**
 * @route   POST /api/visitas
 * @desc    Registrar nueva visita (llegada a garita)
 * @access  Private
 */
router.post('/', registrarVisita);

/**
 * @route   PUT /api/visitas/:id/autorizar
 * @desc    Autorizar visita (residente autoriza)
 * @access  Private
 */
router.put('/:id/autorizar', autorizarVisita);

/**
 * @route   PUT /api/visitas/:id/rechazar
 * @desc    Rechazar visita
 * @access  Private
 */
router.put('/:id/rechazar', rechazarVisita);

/**
 * @route   PUT /api/visitas/:id/salida
 * @desc    Registrar salida de visita
 * @access  Private
 */
router.put('/:id/salida', registrarSalida);

export default router;
