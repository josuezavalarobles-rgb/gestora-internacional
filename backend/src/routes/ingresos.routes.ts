/**
 * ========================================
 * RUTAS DE INGRESOS
 * ========================================
 */

import { Router } from 'express';
import {
  obtenerIngresos,
  obtenerIngresoById,
  crearIngreso,
  actualizarIngreso,
  marcarComoCobrado,
  obtenerEstadisticasIngresos,
} from '../controllers/ingresos.controller';

const router = Router();

/**
 * @route   GET /api/ingresos/estadisticas
 * @desc    Obtener estadísticas de ingresos
 * @query   condominioId, mes
 * @access  Private
 */
router.get('/estadisticas', obtenerEstadisticasIngresos);

/**
 * @route   GET /api/ingresos
 * @desc    Obtener todos los ingresos con filtros
 * @query   condominioId, tipo, cobrado, mes, unidadId, search
 * @access  Private
 */
router.get('/', obtenerIngresos);

/**
 * @route   GET /api/ingresos/:id
 * @desc    Obtener ingreso por ID
 * @access  Private
 */
router.get('/:id', obtenerIngresoById);

/**
 * @route   POST /api/ingresos
 * @desc    Crear nuevo ingreso con recibo automático
 * @access  Private
 */
router.post('/', crearIngreso);

/**
 * @route   PUT /api/ingresos/:id
 * @desc    Actualizar ingreso
 * @access  Private
 */
router.put('/:id', actualizarIngreso);

/**
 * @route   PUT /api/ingresos/:id/cobrar
 * @desc    Marcar ingreso como cobrado
 * @access  Private
 */
router.put('/:id/cobrar', marcarComoCobrado);

export default router;
