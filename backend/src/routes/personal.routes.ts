/**
 * ========================================
 * PERSONAL Y NÓMINA ROUTES - TEMPORARILY DISABLED
 * ========================================
 * Most endpoints return 501 Not Implemented as the service is stubbed
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole';
import { NominaService } from '../services/rrhh/NominaService';

const router = Router();
const nominaService = NominaService.getInstance();

// Todas las rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(requireRole(['admin']));

// Helper function for 501 responses
const notImplemented = (req: any, res: any) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented - NominaService is currently stubbed',
  });
};

// ========================================
// PERSONAL
// ========================================

router.get('/', notImplemented);
router.get('/:id', notImplemented);
router.post('/', notImplemented);
router.put('/:id', notImplemented);
router.put('/:id/desactivar', notImplemented);

// ========================================
// NÓMINA
// ========================================

router.get('/nominas/listado', async (req, res, next) => {
  try {
    const nominas = await nominaService.listarNominas(req.query);
    res.json({ success: true, data: nominas });
  } catch (error) {
    next(error);
  }
});

router.get('/:personalId/nominas', notImplemented);
router.post('/nominas/generar', notImplemented);
router.post('/:personalId/nominas', notImplemented);

router.put('/nominas/:nominaId/marcar-pagada', async (req, res, next) => {
  try {
    const nomina = await nominaService.marcarComoPagada(req.params.nominaId);
    res.json({ success: true, data: nomina });
  } catch (error) {
    next(error);
  }
});

router.get('/reportes/costos-laborales', async (req, res, next) => {
  try {
    const { periodo, condominioId } = req.query;
    const reporte = await nominaService.obtenerReporte(
      periodo as string,
      condominioId as string
    );
    res.json({ success: true, data: reporte });
  } catch (error) {
    next(error);
  }
});

router.get('/:personalId/comprobante-pago/:nominaId', notImplemented);

export default router;
