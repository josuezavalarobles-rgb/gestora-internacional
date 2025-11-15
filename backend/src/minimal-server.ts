import express from 'express';
import cors from 'cors';

const app = express();

// ============================================
// CONFIGURACIÓN DE CORS
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'https://kbj.ebq.mybluehost.me',
  'https://kbj.eba.mybluehost.me', // Por si acaso
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (curl, Postman, healthchecks)
    if (!origin) {
      return callback(null, true);
    }

    // Permitir origins en la lista
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Rechazar otros origins
    return callback(new Error(`Origin ${origin} no permitido por CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ============================================
// MIDDLEWARE BÁSICO
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'N/A'}`);
  next();
});

// ============================================
// ENDPOINTS
// ============================================

// Health endpoint - CRÍTICO para Railway
app.get('/health', (req, res) => {
  console.log('✅ Health check recibido');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Gestora Internacional API - Servidor Minimalista',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/v1'
    }
  });
});

// API v1 health
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    api_version: 'v1',
    timestamp: new Date().toISOString()
  });
});

// Catch all - 404
app.use('*', (req, res) => {
  console.log(`⚠️ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0'; // CRÍTICO: Escuchar en todas las interfaces

const server = app.listen(PORT, HOST, () => {
  console.log('');
  console.log('========================================');
  console.log('🚀 SERVIDOR MINIMALISTA INICIADO');
  console.log('========================================');
  console.log(`✅ Escuchando en: http://${HOST}:${PORT}`);
  console.log(`✅ Health: http://${HOST}:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('========================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
