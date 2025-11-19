/**
 * ========================================
 * RUTAS DE PROVEEDORES
 * ========================================
 */

import { Router } from 'express';
import {
  obtenerProveedores,
  obtenerProveedorById,
  crearProveedor,
  actualizarProveedor,
  evaluarProveedor,
} from '../controllers/proveedores.controller';

const router = Router();

/**
 * @route   GET /api/proveedores
 * @desc    Obtener todos los proveedores con filtros
 * @query   organizacionId, tipo, activo, search
 * @access  Private
 */
router.get('/', obtenerProveedores);

/**
 * @route   GET /api/proveedores/:id
 * @desc    Obtener proveedor por ID con detalles completos
 * @access  Private
 */
router.get('/:id', obtenerProveedorById);

/**
 * @route   POST /api/proveedores
 * @desc    Crear nuevo proveedor
 * @access  Private
 */
router.post('/', crearProveedor);

/**
 * @route   PUT /api/proveedores/:id
 * @desc    Actualizar proveedor
 * @access  Private
 */
router.put('/:id', actualizarProveedor);

/**
 * @route   POST /api/proveedores/:id/evaluar
 * @desc    Evaluar proveedor (calidad, puntualidad, precio, comunicación)
 * @access  Private
 */
router.post('/:id/evaluar', evaluarProveedor);

export default router;
