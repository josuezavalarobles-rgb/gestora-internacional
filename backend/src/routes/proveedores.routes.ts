// ========================================
// PROVEEDORES ROUTES
// ========================================

import { Router } from 'express';
import { ProveedorController } from '../controllers';

const router = Router();

/**
 * @route   POST /api/v1/proveedores
 * @desc    Crear nuevo proveedor
 * @access  Private
 */
router.post('/', ProveedorController.crear.bind(ProveedorController));

/**
 * @route   GET /api/v1/proveedores
 * @desc    Obtener todos los proveedores
 * @access  Private
 * @query   organizacionId, tipo, activo, buscar
 */
router.get('/', ProveedorController.obtenerTodos.bind(ProveedorController));

/**
 * @route   GET /api/v1/proveedores/top
 * @desc    Obtener top proveedores por calificación
 * @access  Private
 * @query   organizacionId, limite
 */
router.get('/top', ProveedorController.obtenerTop.bind(ProveedorController));

/**
 * @route   GET /api/v1/proveedores/:id
 * @desc    Obtener proveedor por ID
 * @access  Private
 */
router.get('/:id', ProveedorController.obtenerPorId.bind(ProveedorController));

/**
 * @route   PUT /api/v1/proveedores/:id
 * @desc    Actualizar proveedor
 * @access  Private
 */
router.put('/:id', ProveedorController.actualizar.bind(ProveedorController));

/**
 * @route   DELETE /api/v1/proveedores/:id
 * @desc    Desactivar proveedor
 * @access  Private
 */
router.delete('/:id', ProveedorController.desactivar.bind(ProveedorController));

/**
 * @route   POST /api/v1/proveedores/evaluar
 * @desc    Evaluar proveedor
 * @access  Private
 */
router.post('/evaluar', ProveedorController.evaluar.bind(ProveedorController));

export default router;
