/**
 * ========================================
 * UNIDADES ROUTES
 * Apartamentos, Locales, Dependientes, Vehículos
 * ========================================
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole';
import { UnidadService } from '../services/unidades/UnidadService';

const router = Router();
const unidadService = UnidadService.getInstance();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ========================================
// UNIDADES
// ========================================

/**
 * @route   GET /api/v1/unidades
 * @desc    Obtener todas las unidades de un condominio
 * @access  Admin
 */
router.get('/', requireRole(['admin']), async (req, res, next) => {
  try {
    const { condominioId, tipo, estado } = req.query;
    const unidades = await unidadService.obtenerUnidades({
      condominioId: condominioId as string,
      tipo: tipo as any,
      estado: estado as any,
    });
    res.json({ success: true, data: unidades });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/unidades/mi-unidad
 * @desc    Obtener datos de mi unidad
 * @access  Propietario
 */
router.get('/mi-unidad', async (req, res, next) => {
  try {
    const unidad = await unidadService.obtenerUnidadUsuario(req.user!.id);
    res.json({ success: true, data: unidad });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/unidades/:id
 * @desc    Obtener detalle de una unidad
 * @access  Admin, Propietario (de su propia unidad)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const unidad = await unidadService.obtenerUnidadPorId(req.params.id);
    res.json({ success: true, data: unidad });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/unidades
 * @desc    Crear nueva unidad
 * @access  Admin
 */
router.post('/', requireRole(['admin']), async (req, res, next) => {
  try {
    const unidad = await unidadService.crearUnidad(req.body);
    res.status(201).json({ success: true, data: unidad });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/unidades/:id
 * @desc    Actualizar datos de unidad
 * @access  Admin
 */
router.put('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const unidad = await unidadService.actualizarUnidad(req.params.id, req.body);
    res.json({ success: true, data: unidad });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/unidades/:id/asignar-propietario
 * @desc    Asignar propietario a unidad
 * @access  Admin
 */
router.put('/:id/asignar-propietario', requireRole(['admin']), async (req, res, next) => {
  try {
    const { propietarioId } = req.body;
    const unidad = await unidadService.asignarPropietario(req.params.id, propietarioId);
    res.json({ success: true, data: unidad });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/unidades/:id/asignar-inquilino
 * @desc    Asignar inquilino a unidad
 * @access  Admin, Propietario
 */
router.put('/:id/asignar-inquilino', async (req, res, next) => {
  try {
    const { inquilinoId } = req.body;
    const unidad = await unidadService.asignarInquilino(req.params.id, inquilinoId);
    res.json({ success: true, data: unidad });
  } catch (error) {
    next(error);
  }
});

// ========================================
// DEPENDIENTES
// ========================================

/**
 * @route   GET /api/v1/unidades/:unidadId/dependientes
 * @desc    Obtener dependientes de una unidad
 * @access  Admin, Propietario
 */
router.get('/:unidadId/dependientes', async (req, res, next) => {
  try {
    const dependientes = await unidadService.obtenerDependientes(req.params.unidadId);
    res.json({ success: true, data: dependientes });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/unidades/:unidadId/dependientes
 * @desc    Registrar dependiente (familiar, empleado doméstico)
 * @access  Propietario, Admin
 */
router.post('/:unidadId/dependientes', async (req, res, next) => {
  try {
    const dependiente = await unidadService.agregarDependiente({
      ...req.body,
      unidadId: req.params.unidadId,
    });
    res.status(201).json({ success: true, data: dependiente });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/unidades/dependientes/:dependienteId
 * @desc    Actualizar datos de dependiente
 * @access  Propietario, Admin
 */
router.put('/dependientes/:dependienteId', async (req, res, next) => {
  try {
    const dependiente = await unidadService.actualizarDependiente(
      req.params.dependienteId,
      req.body
    );
    res.json({ success: true, data: dependiente });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/unidades/dependientes/:dependienteId
 * @desc    Eliminar dependiente
 * @access  Propietario, Admin
 */
router.delete('/dependientes/:dependienteId', async (req, res, next) => {
  try {
    await unidadService.eliminarDependiente(req.params.dependienteId);
    res.json({ success: true, message: 'Dependiente eliminado' });
  } catch (error) {
    next(error);
  }
});

// ========================================
// VEHÍCULOS
// ========================================

/**
 * @route   GET /api/v1/unidades/:unidadId/vehiculos
 * @desc    Obtener vehículos de una unidad
 * @access  Admin, Propietario
 */
router.get('/:unidadId/vehiculos', async (req, res, next) => {
  try {
    const vehiculos = await unidadService.obtenerVehiculos(req.params.unidadId);
    res.json({ success: true, data: vehiculos });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/unidades/:unidadId/vehiculos
 * @desc    Registrar vehículo
 * @access  Propietario, Admin
 */
router.post('/:unidadId/vehiculos', async (req, res, next) => {
  try {
    const vehiculo = await unidadService.agregarVehiculo({
      ...req.body,
      unidadId: req.params.unidadId,
    });
    res.status(201).json({ success: true, data: vehiculo });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/unidades/vehiculos/:vehiculoId
 * @desc    Actualizar datos de vehículo
 * @access  Propietario, Admin
 */
router.put('/vehiculos/:vehiculoId', async (req, res, next) => {
  try {
    const vehiculo = await unidadService.actualizarVehiculo(
      req.params.vehiculoId,
      req.body
    );
    res.json({ success: true, data: vehiculo });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/unidades/vehiculos/:vehiculoId
 * @desc    Eliminar vehículo
 * @access  Propietario, Admin
 */
router.delete('/vehiculos/:vehiculoId', async (req, res, next) => {
  try {
    await unidadService.eliminarVehiculo(req.params.vehiculoId);
    res.json({ success: true, message: 'Vehículo eliminado' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/unidades/vehiculos/buscar-placa/:placa
 * @desc    Buscar vehículo por placa
 * @access  Admin, Seguridad
 */
router.get(
  '/vehiculos/buscar-placa/:placa',
  requireRole(['admin', 'tecnico']),
  async (req, res, next) => {
    try {
      const vehiculo = await unidadService.buscarVehiculoPorPlaca(req.params.placa);
      res.json({ success: true, data: vehiculo });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
