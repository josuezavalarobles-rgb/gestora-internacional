/**
 * ========================================
 * CONFIGURACIÓN DE REDIS (Standalone)
 * ========================================
 * Configuración alternativa para importar Redis directamente
 * sin usar la carpeta database/
 */

import {
  getRedisClient as getRedis,
  connectRedis as connect,
  disconnectRedis as disconnect,
  cacheService as cache,
  redisClient as client
} from './database/redis';

export const getRedisClient = getRedis;
export const connectRedis = connect;
export const disconnectRedis = disconnect;
export const cacheService = cache;
export const redisClient = client;

export default getRedisClient;
