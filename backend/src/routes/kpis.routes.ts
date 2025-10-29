import { Router } from 'express';
import { obtenerDashboard } from '../controllers/kpis.controller';

const router = Router();

router.get('/dashboard', obtenerDashboard);

export default router;
