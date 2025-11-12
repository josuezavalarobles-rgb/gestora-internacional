/**
 * ========================================
 * ERROR MIDDLEWARE - MANEJO CENTRALIZADO
 * ========================================
 * Middleware centralizado para manejo de errores
 * Re-exporta funcionalidad de errorHandler.ts con mejoras
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { AppError } from './errorHandler';
import { config } from '../config';

/**
 * Clase de error personalizada para errores de validación
 */
export class ValidationError extends AppError {
  errors: Array<{ field: string; message: string }>;

  constructor(errors: Array<{ field: string; message: string }>) {
    super('Error de validación', 400);
    this.errors = errors;
  }
}

/**
 * Clase de error para recursos no encontrados
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

/**
 * Clase de error para conflictos (ej: duplicados)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto con recurso existente') {
    super(message, 409);
  }
}

/**
 * Clase de error para operaciones no autorizadas
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

/**
 * Clase de error para acceso denegado
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403);
  }
}

/**
 * Middleware principal de manejo de errores
 */
export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log del error
  logger.error('Error capturado:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // 1. Error de validación con Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Error de validación',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 2. Error de validación personalizado
  if (err instanceof ValidationError) {
    res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: err.message,
      errors: err.errors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 3. Errores de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(err, res);
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Error de validación en base de datos',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 4. AppError personalizado
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 5. Error desconocido
  const isDevelopment = config.env === 'development';

  res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: isDevelopment ? err.message : 'Error interno del servidor',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Manejar errores específicos de Prisma
 */
const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError, res: Response): void => {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      const field = (err.meta?.target as string[])?.join(', ') || 'campo';
      res.status(409).json({
        status: 'error',
        statusCode: 409,
        message: `Ya existe un registro con este ${field}`,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'P2025':
      // Record not found
      res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Registro no encontrado',
        timestamp: new Date().toISOString(),
      });
      break;

    case 'P2003':
      // Foreign key constraint failed
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Referencia inválida a otro registro',
        timestamp: new Date().toISOString(),
      });
      break;

    case 'P2014':
      // Invalid ID
      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'ID inválido',
        timestamp: new Date().toISOString(),
      });
      break;

    default:
      logger.error('Error de Prisma no manejado:', err);
      res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Error en base de datos',
        timestamp: new Date().toISOString(),
      });
  }
};

/**
 * Middleware para rutas no encontradas (404)
 */
export const notFoundMiddleware = (req: Request, res: Response): void => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Wrapper para funciones async (evita try-catch repetitivo)
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validar body del request con Zod schema
 */
export const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validar query params con Zod schema
 */
export const validateQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validar params con Zod schema
 */
export const validateParams = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Re-exportar AppError del errorHandler original
export { AppError } from './errorHandler';

// Exportar todo como default
export default {
  errorMiddleware,
  notFoundMiddleware,
  asyncHandler,
  validateBody,
  validateQuery,
  validateParams,
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
};
