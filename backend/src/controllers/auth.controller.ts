import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * ========================================
 * CONTROLADOR DE AUTENTICACIÓN
 * ========================================
 */

// Generar JWT Token
const generateToken = (userId: string, tipoUsuario: string): string => {
  return (jwt.sign as any)(
    { userId, tipoUsuario },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// Generar Refresh Token
const generateRefreshToken = (userId: string): string => {
  return (jwt.sign as any)(
    { userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
};

/**
 * REGISTRO DE USUARIOS
 */
export const register = async (req: Request, res: Response) => {
  try {
    const {
      nombreCompleto,
      telefono,
      email,
      password,
      tipoUsuario = 'propietario',
      condominioId,
      unidad
    } = req.body;

    // Validaciones
    if (!nombreCompleto || !telefono) {
      return res.status(400).json({
        success: false,
        message: 'Nombre completo y teléfono son requeridos'
      });
    }

    // Admin/técnicos requieren password
    if (['admin', 'super_admin', 'tecnico'].includes(tipoUsuario) && !password) {
      return res.status(400).json({
        success: false,
        message: 'Password es requerido para este tipo de usuario'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [
          { telefono },
          email ? { email } : {}
        ].filter(obj => Object.keys(obj).length > 0)
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El usuario ya existe con ese teléfono o email'
      });
    }

    // Hash password si existe
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Crear usuario
    const newUser = await prisma.usuario.create({
      data: {
        nombreCompleto,
        telefono,
        email,
        password: hashedPassword,
        tipoUsuario,
        condominioId,
        unidad,
        estado: 'activo' // Por defecto activo, ajustar según necesidad
      }
    });

    // Generar tokens
    const token = generateToken(newUser.id, newUser.tipoUsuario);
    const refreshToken = generateRefreshToken(newUser.id);

    // Crear sesión (nota: el modelo Sesion no tiene campos token/refreshToken/activo)
    await prisma.sesion.create({
      data: {
        usuarioId: newUser.id,
        estado: 'online',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });

    logger.info(`Usuario registrado: ${newUser.nombreCompleto} (${newUser.telefono})`);

    // Retornar usuario sin password
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    });

  } catch (error: any) {
    logger.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

/**
 * LOGIN DE USUARIOS
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { telefono, password } = req.body;

    // Validaciones
    if (!telefono) {
      return res.status(400).json({
        success: false,
        message: 'Teléfono es requerido'
      });
    }

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { telefono },
      include: {
        condominio: {
          select: {
            id: true,
            nombre: true,
            direccion: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar estado del usuario
    if (user.estado !== 'activo') {
      return res.status(403).json({
        success: false,
        message: `Usuario ${user.estado}. Contacte al administrador.`
      });
    }

    // Verificar password para admin/técnicos
    if (['admin', 'super_admin', 'tecnico'].includes(user.tipoUsuario)) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password es requerido'
        });
      }

      if (!user.password) {
        return res.status(500).json({
          success: false,
          message: 'Usuario sin password configurado'
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }
    }

    // Generar tokens
    const token = generateToken(user.id, user.tipoUsuario);
    const refreshToken = generateRefreshToken(user.id);

    // Crear sesión (nota: el modelo Sesion no tiene campos token/refreshToken/activo)
    await prisma.sesion.create({
      data: {
        usuarioId: user.id,
        estado: 'online',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });

    // Actualizar último acceso
    await prisma.usuario.update({
      where: { id: user.id },
      data: { ultimoAcceso: new Date() }
    });

    logger.info(`Login exitoso: ${user.nombreCompleto} (${user.telefono})`);

    // Retornar usuario sin password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    });

  } catch (error: any) {
    logger.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * LOGOUT
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (userId) {
      // Cambiar estado de la sesión a offline
      await prisma.sesion.updateMany({
        where: {
          usuarioId: userId,
          estado: 'online'
        },
        data: {
          estado: 'offline',
          fechaLogout: new Date()
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error: any) {
    logger.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
      error: error.message
    });
  }
};

/**
 * OBTENER PERFIL DEL USUARIO ACTUAL
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        condominio: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            ciudad: true,
            provincia: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Retornar sin password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword
    });

  } catch (error: any) {
    logger.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

/**
 * REFRESH TOKEN
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token es requerido'
      });
    }

    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret as string) as any;

    // Buscar usuario por el ID del token decodificado
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.estado !== 'activo') {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o expirada'
      });
    }

    // Generar nuevos tokens
    const newToken = generateToken(user.id, user.tipoUsuario);
    const newRefreshToken = generateRefreshToken(user.id);

    // Actualizar última actividad en sesión
    await prisma.sesion.updateMany({
      where: {
        usuarioId: user.id,
        estado: 'online'
      },
      data: {
        ultimaActividad: new Date()
      }
    });

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error: any) {
    logger.error('Error al refrescar token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message
    });
  }
};

/**
 * CAMBIAR PASSWORD
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password actual y nuevo son requeridos'
      });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId }
    });

    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o sin password'
      });
    }

    // Verificar password actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Password actual incorrecto'
      });
    }

    // Hash nuevo password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar password
    await prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    logger.info(`Password cambiado: ${user.nombreCompleto}`);

    res.status(200).json({
      success: true,
      message: 'Password actualizado exitosamente'
    });

  } catch (error: any) {
    logger.error('Error al cambiar password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar password',
      error: error.message
    });
  }
};
