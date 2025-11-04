import { Router } from 'express';
import { crearCasoDesdeWhatsApp } from '../controllers/webhooks.controller';

const router = Router();

router.post('/whatsapp/caso', crearCasoDesdeWhatsApp);

export default router;
