/**
 * ========================================
 * CONEXIÓN REDIS
 * ========================================
 */

import Redis from 'ioredis';
import { config } from '../index';
import { logger } from '../../utils/logger';

let redisClient: Redis;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(config.redis.url, {
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis conectado correctamente');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('⚠️  Redis desconectado');
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Redis reconectando...');
    });
  }

  return redisClient;
};

export const connectRedis = async (): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.ping();
    logger.info('✅ Redis ping exitoso');
  } catch (error) {
    logger.error('❌ Error al conectar Redis:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.quit();
    logger.info('✅ Redis desconectado');
  } catch (error) {
    logger.error('❌ Error al desconectar Redis:', error);
  }
};

// Utilidades de cache
export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const client = getRedisClient();
    const serialized = JSON.stringify(value);

    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    const client = getRedisClient();
    await client.del(key);
  },

  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  },

  async expire(key: string, seconds: number): Promise<void> {
    const client = getRedisClient();
    await client.expire(key, seconds);
  },
};

export { redisClient };
export default getRedisClient;
