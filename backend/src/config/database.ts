/**
 * ========================================
 * CONFIGURACIÓN DE BASES DE DATOS
 * ========================================
 * Exporta conexiones para PostgreSQL, MongoDB y Redis
 */

import { getPrismaClient, connectPostgreSQL, disconnectPostgreSQL } from './database/postgres';
import { connectMongoDB, disconnectMongoDB, mongoose } from './database/mongodb';
import { connectRedis, disconnectRedis, getRedisClient, cacheService } from './database/redis';
import { logger } from '../utils/logger';

/**
 * Conectar todas las bases de datos
 */
export const connectAllDatabases = async (): Promise<void> => {
  try {
    logger.info('🔌 Conectando bases de datos...');

    // Conectar PostgreSQL (Prisma)
    await connectPostgreSQL();

    // Conectar MongoDB
    await connectMongoDB();

    // Conectar Redis
    await connectRedis();

    logger.info('✅ Todas las bases de datos conectadas exitosamente');
  } catch (error) {
    logger.error('❌ Error al conectar bases de datos:', error);
    throw error;
  }
};

/**
 * Desconectar todas las bases de datos
 */
export const disconnectAllDatabases = async (): Promise<void> => {
  try {
    logger.info('🔌 Desconectando bases de datos...');

    await disconnectPostgreSQL();
    await disconnectMongoDB();
    await disconnectRedis();

    logger.info('✅ Todas las bases de datos desconectadas');
  } catch (error) {
    logger.error('❌ Error al desconectar bases de datos:', error);
  }
};

/**
 * Verificar salud de todas las bases de datos
 */
export const checkDatabasesHealth = async (): Promise<{
  postgres: boolean;
  mongodb: boolean;
  redis: boolean;
}> => {
  const health = {
    postgres: false,
    mongodb: false,
    redis: false,
  };

  try {
    // PostgreSQL
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    health.postgres = true;
  } catch (error) {
    logger.error('❌ PostgreSQL health check failed:', error);
  }

  try {
    // MongoDB
    if (mongoose.connection.readyState === 1) {
      health.mongodb = true;
    }
  } catch (error) {
    logger.error('❌ MongoDB health check failed:', error);
  }

  try {
    // Redis
    const redis = getRedisClient();
    await redis.ping();
    health.redis = true;
  } catch (error) {
    logger.error('❌ Redis health check failed:', error);
  }

  return health;
};

// Exportar clientes y servicios individuales
export {
  // PostgreSQL / Prisma
  getPrismaClient,
  connectPostgreSQL,
  disconnectPostgreSQL,

  // MongoDB
  connectMongoDB,
  disconnectMongoDB,
  mongoose,

  // Redis
  connectRedis,
  disconnectRedis,
  getRedisClient,
  cacheService,
};

export default {
  connectAllDatabases,
  disconnectAllDatabases,
  checkDatabasesHealth,
  getPrismaClient,
  getRedisClient,
  mongoose,
  cacheService,
};
