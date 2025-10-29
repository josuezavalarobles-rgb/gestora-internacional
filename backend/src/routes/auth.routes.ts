import { Router } from 'express';

const router = Router();

// TODO: Implementar rutas de autenticación
router.post('/login', (req, res) => {
  res.json({ message: 'Login route - TODO' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Register route - TODO' });
});

export default router;
