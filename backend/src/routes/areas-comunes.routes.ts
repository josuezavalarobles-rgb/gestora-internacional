/**
 * ========================================
 * RUTAS DE ÁREAS COMUNES Y RESERVAS
 * ========================================
 */

import { Router } from 'express';
import {
  obtenerAreasComunes,
  obtenerAreaById,
  crearArea,
  actualizarArea,
  obtenerReservas,
  crearReserva,
  cancelarReserva,
} from '../controllers/areasComunes.controller';

const router = Router();

/**
 * @route   GET /api/areas-comunes/:id/reservas
 * @desc    Obtener reservas de un área (calendario)
 * @query   fecha, mes
 * @access  Private
 */
router.get('/:id/reservas', obtenerReservas);

/**
 * @route   GET /api/areas-comunes
 * @desc    Obtener todas las áreas comunes con disponibilidad
 * @query   condominioId, tipo, estado, requiereReserva
 * @access  Private
 */
router.get('/', obtenerAreasComunes);

/**
 * @route   GET /api/areas-comunes/:id
 * @desc    Obtener área común por ID con reservas futuras
 * @access  Private
 */
router.get('/:id', obtenerAreaById);

/**
 * @route   POST /api/areas-comunes
 * @desc    Crear nueva área común
 * @access  Private
 */
router.post('/', crearArea);

/**
 * @route   PUT /api/areas-comunes/:id
 * @desc    Actualizar área común
 * @access  Private
 */
router.put('/:id', actualizarArea);

/**
 * @route   POST /api/areas-comunes/:id/reservas
 * @desc    Crear reserva con validación de disponibilidad
 * @access  Private
 */
router.post('/:id/reservas', crearReserva);

/**
 * @route   PUT /api/areas-comunes/reservas/:id/cancelar
 * @desc    Cancelar reserva
 * @access  Private
 */
router.put('/reservas/:id/cancelar', cancelarReserva);

export default router;
