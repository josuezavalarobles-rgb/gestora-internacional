/**
 * ========================================
 * CONEXIÓN MONGODB CON MONGOOSE
 * ========================================
 */

import mongoose from 'mongoose';
import { config } from '../index';
import { logger } from '../../utils/logger';

export const connectMongoDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false);

    await mongoose.connect(config.mongodb.uri, {
      dbName: config.mongodb.dbName,
    });

    logger.info('✅ MongoDB conectado correctamente');

    // Event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconectado');
    });
  } catch (error) {
    logger.error('❌ Error al conectar MongoDB:', error);
    throw error;
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('✅ MongoDB desconectado');
  } catch (error) {
    logger.error('❌ Error al desconectar MongoDB:', error);
  }
};

export { mongoose };
export default mongoose;
