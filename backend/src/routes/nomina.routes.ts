/**
 * ========================================
 * RUTAS DE NÓMINA
 * ========================================
 */

import { Router } from 'express';
import {
  obtenerPersonal,
  obtenerPersonalById,
  crearPersonal,
  actualizarPersonal,
  obtenerNominas,
  generarNomina,
  marcarNominaPagada,
} from '../controllers/nomina.controller';

const router = Router();

/**
 * @route   GET /api/nomina/personal
 * @desc    Obtener todo el personal
 * @query   organizacionId, tipo, estado, search
 * @access  Private
 */
router.get('/personal', obtenerPersonal);

/**
 * @route   GET /api/nomina/personal/:id
 * @desc    Obtener personal por ID con historial de nóminas
 * @access  Private
 */
router.get('/personal/:id', obtenerPersonalById);

/**
 * @route   POST /api/nomina/personal
 * @desc    Crear nuevo personal
 * @access  Private
 */
router.post('/personal', crearPersonal);

/**
 * @route   PUT /api/nomina/personal/:id
 * @desc    Actualizar personal
 * @access  Private
 */
router.put('/personal/:id', actualizarPersonal);

/**
 * @route   GET /api/nomina/nominas
 * @desc    Obtener nóminas por período
 * @query   periodo, personalId, pagado
 * @access  Private
 */
router.get('/nominas', obtenerNominas);

/**
 * @route   POST /api/nomina/generar
 * @desc    Generar nómina con cálculos automáticos de AFP, ARS, ISR
 * @access  Private
 */
router.post('/generar', generarNomina);

/**
 * @route   PUT /api/nomina/:id/pagar
 * @desc    Marcar nómina como pagada
 * @access  Private
 */
router.put('/:id/pagar', marcarNominaPagada);

export default router;
