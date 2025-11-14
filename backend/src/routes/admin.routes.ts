/**
 * ========================================
 * ADMIN ROUTES
 * Gestión administrativa y limpieza de datos
 * ========================================
 */

import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// Todas las rutas requieren autenticación y rol de ADMIN
router.use(authenticate);
router.use(requireRole(['admin']));

/**
 * @route   DELETE /api/v1/admin/limpiar-todos-datos
 * @desc    Limpiar TODOS los datos de la base de datos
 * @access  Admin only
 * @warning ⚠️ PELIGROSO: Elimina toda la información
 */
router.delete('/limpiar-todos-datos', adminController.limpiarTodosLosDatos);

/**
 * @route   DELETE /api/v1/admin/limpiar-datos-demo
 * @desc    Limpiar solo datos de DEMO (org-demo-001)
 * @access  Admin only
 */
router.delete('/limpiar-datos-demo', adminController.limpiarDatosDemo);

/**
 * @route   GET /api/v1/admin/estadisticas
 * @desc    Obtener estadísticas de la base de datos
 * @access  Admin only
 */
router.get('/estadisticas', adminController.obtenerEstadisticas);

export default router;
