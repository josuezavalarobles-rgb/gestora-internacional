/**
 * SERVIDOR MINIMALISTA DE EMERGENCIA
 *
 * Este servidor inicia INMEDIATAMENTE sin depender de:
 * - Base de datos
 * - Prisma
 * - Rutas
 * - Middlewares complejos
 * - NADA
 *
 * Si Railway sigue fallando con esto, el problema NO es el código.
 */

import express from 'express';
import cors from 'cors';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';

// CORS para permitir requests desde Bluehost y localhost
const allowedOrigins = [
  'http://localhost:5173',
  'https://kbj.ebq.mybluehost.me'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (curl, Postman, etc)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`⚠️ CORS bloqueado para origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true
}));

// Body parser
app.use(express.json());

// Health endpoint - LO PRIMERO
app.get('/health', (req, res) => {
  console.log('✅ Health check recibido');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    message: 'Servidor minimalista funcionando'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Gestora Internacional API - Servidor de Emergencia',
    status: 'running',
    version: '1.0.0'
  });
});

// Error 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Iniciar servidor INMEDIATAMENTE
const server = app.listen(port, host, () => {
  console.log('');
  console.log('========================================');
  console.log('🚀 SERVIDOR MINIMALISTA INICIADO');
  console.log('========================================');
  console.log(`✅ Escuchando en: http://${host}:${port}`);
  console.log(`✅ Health: http://${host}:${port}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('========================================');
  console.log('');
});

server.on('error', (err) => {
  console.error('❌ Error al iniciar servidor:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

export default app;
