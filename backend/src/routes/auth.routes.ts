import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * ========================================
 * RUTAS DE AUTENTICACIÓN
 * ========================================
 */

// Registro de usuarios
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Logout
router.post('/logout', authenticate, authController.logout);

// Obtener perfil del usuario actual
router.get('/profile', authenticate, authController.getProfile);

// Refrescar token
router.post('/refresh', authController.refreshToken);

// Cambiar password
router.post('/change-password', authenticate, authController.changePassword);

export default router;
