// ========================================
// CONTABILIDAD ROUTES
// ========================================

import { Router } from 'express';
import { ContabilidadController } from '../controllers';

const router = Router();

// ========================================
// NCF
// ========================================

router.post('/ncf/secuencia', ContabilidadController.crearSecuenciaNCF.bind(ContabilidadController));
router.get('/ncf/siguiente', ContabilidadController.obtenerSiguienteNCF.bind(ContabilidadController));

// ========================================
// PLAN DE CUENTAS
// ========================================

router.post('/cuentas', ContabilidadController.crearCuentaContable.bind(ContabilidadController));
router.get('/cuentas', ContabilidadController.obtenerPlanCuentas.bind(ContabilidadController));

// ========================================
// GASTOS
// ========================================

router.post('/gastos', ContabilidadController.crearGasto.bind(ContabilidadController));
router.get('/gastos', ContabilidadController.obtenerGastos.bind(ContabilidadController));
router.put('/gastos/:id/pagar', ContabilidadController.marcarGastoPagado.bind(ContabilidadController));

// ========================================
// INGRESOS
// ========================================

router.post('/ingresos', ContabilidadController.crearIngreso.bind(ContabilidadController));
router.get('/ingresos', ContabilidadController.obtenerIngresos.bind(ContabilidadController));

// ========================================
// REPORTES
// ========================================

router.get('/reportes/balance', ContabilidadController.obtenerBalanceSaldos.bind(ContabilidadController));
router.get('/reportes/gastos-categoria', ContabilidadController.obtenerGastosPorCategoria.bind(ContabilidadController));

export default router;
