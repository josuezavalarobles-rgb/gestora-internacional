/**
 * ========================================
 * RUTAS DE CONTABILIDAD
 * ========================================
 */

import { Router } from 'express';
import {
  obtenerPlanCuentas,
  obtenerCuentaById,
  crearCuenta,
  actualizarCuenta,
  obtenerBalance,
} from '../controllers/contabilidad.controller';

const router = Router();

/**
 * @route   GET /api/contabilidad/balance
 * @desc    Obtener balance general con totales por tipo
 * @query   organizacionId, fechaInicio, fechaFin, condominioId
 * @access  Private
 */
router.get('/balance', obtenerBalance);

/**
 * @route   GET /api/contabilidad/plan-cuentas
 * @desc    Obtener plan de cuentas jerárquico
 * @query   organizacionId, tipo, activa
 * @access  Private
 */
router.get('/plan-cuentas', obtenerPlanCuentas);

/**
 * @route   GET /api/contabilidad/cuentas/:id
 * @desc    Obtener cuenta por ID con movimientos
 * @access  Private
 */
router.get('/cuentas/:id', obtenerCuentaById);

/**
 * @route   POST /api/contabilidad/cuentas
 * @desc    Crear nueva cuenta contable
 * @access  Private
 */
router.post('/cuentas', crearCuenta);

/**
 * @route   PUT /api/contabilidad/cuentas/:id
 * @desc    Actualizar cuenta contable
 * @access  Private
 */
router.put('/cuentas/:id', actualizarCuenta);

export default router;
