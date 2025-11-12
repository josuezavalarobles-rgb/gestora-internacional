// ========================================
// ROUTES INDEX
// Configuración central de todas las rutas
// ========================================

import { Router } from 'express';
import proveedoresRoutes from './proveedores.routes';
import contabilidadRoutes from './contabilidad.routes';
import estadosCuentaRoutes from './estados-cuenta.routes';
import iaRoutes from './ia.routes';

const router = Router();

// ========================================
// HEALTH CHECK
// ========================================

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Gestora Internacional SRL - Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// ROUTES
// ========================================

// Proveedores
router.use('/proveedores', proveedoresRoutes);

// Contabilidad (NCF, Gastos, Ingresos, Plan de Cuentas)
router.use('/contabilidad', contabilidadRoutes);

// Estados de Cuenta
router.use('/estados-cuenta', estadosCuentaRoutes);

// Inteligencia Artificial (Facturas IA + Predicciones ML)
router.use('/ia', iaRoutes);

// TODO: Agregar rutas adicionales cuando se implementen
// router.use('/nomina', nominaRoutes);
// router.use('/unidades', unidadesRoutes);
// router.use('/areas-comunes', areasComunesRoutes);
// router.use('/visitas', visitasRoutes);
// router.use('/calendario', calendarioRoutes);
// router.use('/documentos', documentosRoutes);

// ========================================
// 404 HANDLER
// ========================================

router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
  });
});

export default router;
