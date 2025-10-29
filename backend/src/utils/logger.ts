/**
 * ========================================
 * LOGGER CON PINO
 * ========================================
 */

import pino from 'pino';
import { config } from '../config';

const isProduction = config.env === 'production';

export const logger = pino({
  level: config.logging.level,
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
