/**
 * ========================================
 * RUTAS DE GASTOS
 * ========================================
 */

import { Router } from 'express';
import {
  obtenerGastos,
  obtenerGastoById,
  crearGasto,
  actualizarGasto,
  marcarComoPagado,
  obtenerEstadisticasGastos,
} from '../controllers/gastos.controller';

const router = Router();

/**
 * @route   GET /api/gastos/estadisticas
 * @desc    Obtener estadísticas de gastos del mes
 * @query   condominioId, mes
 * @access  Private
 */
router.get('/estadisticas', obtenerEstadisticasGastos);

/**
 * @route   GET /api/gastos
 * @desc    Obtener todos los gastos con filtros
 * @query   condominioId, tipo, pagado, mes, proveedorId, search
 * @access  Private
 */
router.get('/', obtenerGastos);

/**
 * @route   GET /api/gastos/:id
 * @desc    Obtener gasto por ID con distribución
 * @access  Private
 */
router.get('/:id', obtenerGastoById);

/**
 * @route   POST /api/gastos
 * @desc    Crear nuevo gasto con NCF automático
 * @access  Private
 */
router.post('/', crearGasto);

/**
 * @route   PUT /api/gastos/:id
 * @desc    Actualizar gasto
 * @access  Private
 */
router.put('/:id', actualizarGasto);

/**
 * @route   PUT /api/gastos/:id/pagar
 * @desc    Marcar gasto como pagado
 * @access  Private
 */
router.put('/:id/pagar', marcarComoPagado);

export default router;
