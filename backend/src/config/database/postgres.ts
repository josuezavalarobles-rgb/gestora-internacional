/**
 * ========================================
 * CONEXIÓN POSTGRESQL CON PRISMA
 * ========================================
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

// Singleton de Prisma Client
let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    // Log queries en desarrollo
    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query' as never, (e: any) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  return prisma;
};

export const connectPostgreSQL = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    await client.$connect();
    logger.info('✅ PostgreSQL conectado correctamente');
  } catch (error) {
    logger.error('❌ Error al conectar PostgreSQL:', error);
    throw error;
  }
};

export const disconnectPostgreSQL = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    await client.$disconnect();
    logger.info('✅ PostgreSQL desconectado');
  } catch (error) {
    logger.error('❌ Error al desconectar PostgreSQL:', error);
  }
};

export { prisma };
export default getPrismaClient;
