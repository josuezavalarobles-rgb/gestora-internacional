/**
 * ========================================
 * MIDDLEWARE DE AUTENTICACIÓN JWT
 * ========================================
 * Maneja autenticación y autorización con JWT
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getPrismaClient } from '../config/database/postgres';
import { logger } from '../utils/logger';
import { AppError } from './errorHandler';

const prisma = getPrismaClient();

/**
 * Interfaz para payload del JWT
 */
export interface JWTPayload {
  id: string;
  telefono: string;
  tipoUsuario: string;
  condominioId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Extender Request para incluir usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
    }
  }
}

/**
 * Middleware principal de autenticación
 * Verifica JWT y adjunta usuario al request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('Token no proporcionado', 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError('Formato de token inválido. Use: Bearer <token>', 401);
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // 2. Verificar token
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expirado', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Token inválido', 401);
      }
      throw new AppError('Error al verificar token', 401);
    }

    // 3. Verificar que el usuario existe y está activo
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nombreCompleto: true,
        telefono: true,
        email: true,
        tipoUsuario: true,
        estado: true,
        condominioId: true,
      },
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 401);
    }

    if (usuario.estado !== 'activo') {
      throw new AppError('Usuario inactivo o suspendido', 403);
    }

    // 4. Adjuntar usuario al request
    req.user = {
      id: usuario.id,
      telefono: usuario.telefono,
      tipoUsuario: usuario.tipoUsuario,
      condominioId: usuario.condominioId || undefined,
    };

    req.userId = usuario.id;

    // 5. Actualizar último acceso (opcional, puede hacerse asíncrono)
    prisma.usuario
      .update({
        where: { id: usuario.id },
        data: { ultimoAcceso: new Date() },
      })
      .catch((err) => logger.error('Error actualizando último acceso:', err));

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para autenticación opcional
 * No falla si no hay token, pero lo procesa si existe
 */
export const authenticateOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          telefono: true,
          tipoUsuario: true,
          estado: true,
          condominioId: true,
        },
      });

      if (usuario && usuario.estado === 'activo') {
        req.user = {
          id: usuario.id,
          telefono: usuario.telefono,
          tipoUsuario: usuario.tipoUsuario,
          condominioId: usuario.condominioId || undefined,
        };
        req.userId = usuario.id;
      }
    } catch (error) {
      // Ignorar errores en autenticación opcional
      logger.debug('Token inválido en autenticación opcional');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar roles específicos
 * Uso: authorize('admin', 'super_admin')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('No autenticado', 401);
      }

      if (!roles.includes(req.user.tipoUsuario)) {
        throw new AppError(
          `Acceso denegado. Requiere rol: ${roles.join(' o ')}`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar que el usuario es técnico
 */
export const isTecnico = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    if (req.user.tipoUsuario !== 'tecnico') {
      throw new AppError('Acceso denegado. Solo técnicos', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar que el usuario es admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    if (req.user.tipoUsuario !== 'admin' && req.user.tipoUsuario !== 'super_admin') {
      throw new AppError('Acceso denegado. Solo administradores', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar que el usuario pertenece al mismo condominio
 */
export const sameCondominio = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    const condominioId = req.params.condominioId || req.body.condominioId;

    if (!condominioId) {
      throw new AppError('Condominio no especificado', 400);
    }

    // Admins pueden acceder a cualquier condominio
    if (req.user.tipoUsuario === 'admin' || req.user.tipoUsuario === 'super_admin') {
      return next();
    }

    // Usuarios regulares solo pueden acceder a su propio condominio
    if (req.user.condominioId !== condominioId) {
      throw new AppError('Acceso denegado. Condominio diferente', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Generar JWT token
 */
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload as object, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Generar refresh token
 */
export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload as object, config.jwt.refreshSecret || config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

/**
 * Verificar refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expirado', 401);
    }
    throw new AppError('Refresh token inválido', 401);
  }
};

/**
 * Extraer token del header (sin validar)
 */
export const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
};

/**
 * Decodificar token sin verificar (útil para debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

// Exportar como default
export default {
  authenticate,
  authenticateOptional,
  authorize,
  isTecnico,
  isAdmin,
  sameCondominio,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  extractToken,
  decodeToken,
};
