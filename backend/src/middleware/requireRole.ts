/**
 * ========================================
 * MIDDLEWARE DE VERIFICACIÓN DE ROLES
 * ========================================
 * Verifica que el usuario tenga uno de los roles permitidos
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Middleware para requerir roles específicos
 *
 * @param allowedRoles - Array de roles permitidos
 * @returns Middleware function
 *
 * @example
 * router.get('/admin-only', requireRole(['admin']), handler);
 * router.get('/tech-or-admin', requireRole(['admin', 'tecnico']), handler);
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        throw new AppError('No autenticado. Por favor inicie sesión.', 401);
      }

      // Verificar que el usuario tenga uno de los roles permitidos
      if (!allowedRoles.includes(req.user.tipoUsuario)) {
        throw new AppError(
          `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
          403
        );
      }

      // Usuario autorizado, continuar
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para requerir rol de admin
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Middleware para requerir rol de técnico
 */
export const requireTecnico = requireRole(['tecnico', 'admin', 'super_admin']);

/**
 * Middleware para requerir propietario
 */
export const requirePropietario = requireRole(['propietario', 'admin', 'super_admin']);

export default requireRole;
