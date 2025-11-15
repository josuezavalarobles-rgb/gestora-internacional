/**
 * ========================================
 * CONFIGURACIÓN CENTRALIZADA
 * ========================================
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  // Database - PostgreSQL
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/amico_db',
  },

  // Database - MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/amico_logs',
    dbName: process.env.MONGODB_DB_NAME || 'amico_logs',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  },

  // WhatsApp
  whatsapp: {
    sessionName: process.env.WHATSAPP_SESSION_NAME || 'amico-bot-session',
    phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || '',
    businessName: process.env.WHATSAPP_BUSINESS_NAME || 'Amico Management',
    autoRead: process.env.WHATSAPP_AUTO_READ === 'true',
    autoMarkRead: process.env.WHATSAPP_AUTO_MARK_READ === 'true',
    groupJid: process.env.WHATSAPP_GROUP_JID || '', // JID del grupo de administradores e ingenieros
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,video/mp4,video/quicktime,application/pdf').split(','),
    maxFilesPerCase: parseInt(process.env.MAX_FILES_PER_CASE || '10', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173,https://kbj.ebq.mybluehost.me',
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'pretty',
  },

  // Bot Configuration
  bot: {
    enabled: process.env.BOT_ENABLED !== 'false',
    responseDelay: parseInt(process.env.BOT_RESPONSE_DELAY || '1000', 10),
    maxContextMessages: parseInt(process.env.BOT_MAX_CONTEXT_MESSAGES || '10', 10),
    escalateKeywords: (process.env.BOT_ESCALATE_KEYWORDS || 'urgente,emergencia,supervisor,humano').split(','),
  },

  // Notifications
  notifications: {
    enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
    batchSize: parseInt(process.env.NOTIFICATION_BATCH_SIZE || '50', 10),
    retryAttempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS || '3', 10),
  },

  // SLA Times (en horas)
  sla: {
    garantia: parseInt(process.env.SLA_GARANTIA_HORAS || '24', 10),
    condominio: parseInt(process.env.SLA_CONDOMINIO_HORAS || '72', 10),
    urgente: parseInt(process.env.SLA_URGENTE_HORAS || '4', 10),
  },

  // Timezone
  timezone: process.env.TZ || 'America/Santo_Domingo',

  // Email (opcional)
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@amicomanagement.com',
  },

  // Sentry (Error tracking)
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
  },

  // Feature Flags
  features: {
    aiClassification: process.env.FEATURE_AI_CLASSIFICATION !== 'false',
    autoAssignment: process.env.FEATURE_AUTO_ASSIGNMENT !== 'false',
    imageAnalysis: process.env.FEATURE_IMAGE_ANALYSIS === 'true',
    voiceMessages: process.env.FEATURE_VOICE_MESSAGES === 'true',
  },
};

// Validaciones
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

// MongoDB y Redis son opcionales - el sistema puede funcionar solo con PostgreSQL
// OPENAI_API_KEY es opcional - el sistema funciona sin IA
// if (config.env === 'production') {
//   requiredEnvVars.push('OPENAI_API_KEY');
//   requiredEnvVars.push('MONGODB_URI');
//   requiredEnvVars.push('REDIS_URL');
// }

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Faltan variables de entorno requeridas: ${missingEnvVars.join(', ')}`
  );
}

export default config;
