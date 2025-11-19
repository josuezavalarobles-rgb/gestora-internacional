/**
 * ========================================
 * CALENDARIO Y EVENTOS ROUTES
 * ========================================
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole';
import { CalendarioService } from '../services/calendario/CalendarioService';

const router = Router();
const calendarioService = CalendarioService.getInstance();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/v1/calendario
 * @desc    Obtener eventos del calendario
 * @access  Authenticated
 */
router.get('/', async (req, res, next) => {
  try {
    const { condominioId, fechaInicio, fechaFin, tipo } = req.query;
    const eventos = await calendarioService.obtenerEventos({
      condominioId: condominioId as string,
      fechaInicio: fechaInicio as string,
      fechaFin: fechaFin as string,
      tipo: tipo as any,
    });
    res.json({ success: true, data: eventos });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/calendario/:id
 * @desc    Obtener detalle de un evento
 * @access  Authenticated
 */
router.get('/:id', async (req, res, next) => {
  try {
    const evento = await calendarioService.obtenerEventoPorId(req.params.id);
    res.json({ success: true, data: evento });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/calendario
 * @desc    Crear nuevo evento
 * @access  Admin
 */
router.post('/', requireRole(['admin']), async (req, res, next) => {
  try {
    const evento = await calendarioService.crearEvento({
      ...req.body,
      creadoPor: req.user!.id,
    });
    res.status(201).json({ success: true, data: evento });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/calendario/:id
 * @desc    Actualizar evento
 * @access  Admin
 */
router.put('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const evento = await calendarioService.actualizarEvento(req.params.id, req.body);
    res.json({ success: true, data: evento });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/calendario/:id
 * @desc    Eliminar evento
 * @access  Admin
 */
router.delete('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    await calendarioService.eliminarEvento(req.params.id);
    res.json({ success: true, message: 'Evento eliminado' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/calendario/proximos
 * @desc    Obtener próximos eventos
 * @access  Authenticated
 */
router.get('/proximos/listado', async (req, res, next) => {
  try {
    const { condominioId, dias } = req.query;
    const eventos = await calendarioService.obtenerProximosEventos(
      condominioId as string,
      parseInt(dias as string) || 7
    );
    res.json({ success: true, data: eventos });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/calendario/:eventoId/recordatorios
 * @desc    Configurar recordatorio para un evento
 * @access  Admin
 */
router.post(
  '/:eventoId/recordatorios',
  requireRole(['admin']),
  async (req, res, next) => {
    try {
      const recordatorio = await calendarioService.agregarRecordatorio({
        ...req.body,
        eventoId: req.params.eventoId,
      });
      res.status(201).json({ success: true, data: recordatorio });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/calendario/tipos
 * @desc    Obtener tipos de eventos disponibles
 * @access  Authenticated
 */
router.get('/tipos/listado', (req, res) => {
  const tipos = [
    { value: 'asamblea', label: 'Asamblea' },
    { value: 'reunion_junta', label: 'Reunión de Junta' },
    { value: 'mantenimiento_programado', label: 'Mantenimiento Programado' },
    { value: 'corte_servicio', label: 'Corte de Servicio' },
    { value: 'evento_social', label: 'Evento Social' },
    { value: 'fecha_limite_pago', label: 'Fecha Límite de Pago' },
    { value: 'otro', label: 'Otro' },
  ];
  res.json({ success: true, data: tipos });
});

export default router;
