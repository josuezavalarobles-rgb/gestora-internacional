import { Router } from 'express';
import { obtenerUsuarios, obtenerTecnicos } from '../controllers/usuarios.controller';

const router = Router();

router.get('/', obtenerUsuarios);
router.get('/tecnicos', obtenerTecnicos);

export default router;
