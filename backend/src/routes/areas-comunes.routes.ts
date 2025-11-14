/**
 * ========================================
 * ÁREAS COMUNES Y RESERVAS ROUTES
 * ========================================
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole';
import { AreasComunesService } from '../services/areas/AreasComunesService';

const router = Router();
const areasService = new AreasComunesService();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/v1/areas-comunes
 * @desc    Obtener todas las áreas comunes de un condominio
 * @access  Authenticated
 */
router.get('/', async (req, res, next) => {
  try {
    const { condominioId } = req.query;
    const areas = await areasService.obtenerAreas(condominioId as string);
    res.json({ success: true, data: areas });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/areas-comunes/:id
 * @desc    Obtener detalle de un área común
 * @access  Authenticated
 */
router.get('/:id', async (req, res, next) => {
  try {
    const area = await areasService.obtenerAreaPorId(req.params.id);
    res.json({ success: true, data: area });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/areas-comunes
 * @desc    Crear nueva área común
 * @access  Admin
 */
router.post('/', requireRole(['admin']), async (req, res, next) => {
  try {
    const area = await areasService.crearArea(req.body);
    res.status(201).json({ success: true, data: area });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/areas-comunes/:id
 * @desc    Actualizar área común
 * @access  Admin
 */
router.put('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const area = await areasService.actualizarArea(req.params.id, req.body);
    res.json({ success: true, data: area });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/areas-comunes/:id
 * @desc    Eliminar área común
 * @access  Admin
 */
router.delete('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    await areasService.eliminarArea(req.params.id);
    res.json({ success: true, message: 'Área común eliminada' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/areas-comunes/:id/disponibilidad
 * @desc    Ver disponibilidad de un área para una fecha
 * @access  Authenticated
 */
router.get('/:id/disponibilidad', async (req, res, next) => {
  try {
    const { fecha } = req.query;
    const disponibilidad = await areasService.verificarDisponibilidad(
      req.params.id,
      fecha as string
    );
    res.json({ success: true, data: disponibilidad });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/areas-comunes/:id/reservar
 * @desc    Crear reserva de área común
 * @access  Authenticated
 */
router.post('/:id/reservar', async (req, res, next) => {
  try {
    const reserva = await areasService.crearReserva({
      ...req.body,
      areaId: req.params.id,
      usuarioId: req.user!.id,
    });
    res.status(201).json({ success: true, data: reserva });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/areas-comunes/reservas/mis-reservas
 * @desc    Obtener reservas del usuario autenticado
 * @access  Authenticated
 */
router.get('/reservas/mis-reservas', async (req, res, next) => {
  try {
    const reservas = await areasService.obtenerReservasUsuario(req.user!.id);
    res.json({ success: true, data: reservas });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/areas-comunes/reservas/:reservaId/cancelar
 * @desc    Cancelar una reserva
 * @access  Authenticated
 */
router.put('/reservas/:reservaId/cancelar', async (req, res, next) => {
  try {
    const reserva = await areasService.cancelarReserva(
      req.params.reservaId,
      req.user!.id,
      req.body.motivoCancelacion
    );
    res.json({ success: true, data: reserva });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/areas-comunes/reservas/:reservaId/confirmar
 * @desc    Confirmar una reserva (Admin)
 * @access  Admin
 */
router.put(
  '/reservas/:reservaId/confirmar',
  requireRole(['admin']),
  async (req, res, next) => {
    try {
      const reserva = await areasService.confirmarReserva(req.params.reservaId);
      res.json({ success: true, data: reserva });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
