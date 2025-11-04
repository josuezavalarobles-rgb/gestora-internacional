/**
 * Webhook para crear casos desde WhatsApp
 * Sin validaciones estrictas para permitir creación rápida
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';

const prisma = getPrismaClient();

export const crearCasoDesdeWhatsApp = asyncHandler(async (req: Request, res: Response) => {
  const { telefono, descripcion, tipo, categoria, urgente } = req.body;

  try {
    // 1. Buscar o crear usuario
    let usuario = await prisma.usuario.findUnique({
      where: { telefono }
    });

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          nombreCompleto: `Usuario WhatsApp ${telefono}`,
          telefono,
          tipoUsuario: 'propietario',
          estado: 'pendiente'
        }
      });
    }

    // 2. Buscar o crear condominio por defecto
    let condominio = await prisma.condominio.findFirst({
      where: { estado: 'activo' }
    });

    if (!condominio) {
      // Crear condominio por defecto si no existe
      condominio = await prisma.condominio.create({
        data: {
          nombre: 'Condominio General',
          direccion: 'Por definir',
          ciudad: 'Santo Domingo',
          provincia: 'DN',
          estado: 'activo',
          totalUnidades: 999,
          slaGarantia: 24,
          slaCondominio: 72
        }
      });
    }

    // 3. Actualizar usuario con condominio si no lo tiene
    if (!usuario.condominioId) {
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          condominioId: condominio.id,
          unidad: 'Por asignar - WhatsApp'
        }
      });
    }

    // 4. Generar número de caso
    const count = await prisma.caso.count();
    const numeroCaso = `AMC-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    // 5. Mapear categoría
    const categorias: any = {
      'filtracion': 'filtraciones_humedad',
      'filtración': 'filtraciones_humedad',
      'humedad': 'filtraciones_humedad',
      'electrico': 'problemas_electricos',
      'eléctrico': 'problemas_electricos',
      'luz': 'problemas_electricos',
      'plomeria': 'plomeria',
      'plomería': 'plomeria',
      'agua': 'plomeria',
      'puertas': 'puertas_ventanas',
      'ventanas': 'puertas_ventanas',
      'aire': 'aires_acondicionados',
      'aires': 'aires_acondicionados'
    };

    let categoriaFinal = 'otro';
    const categoriaLower = (categoria || '').toLowerCase();

    for (const [key, value] of Object.entries(categorias)) {
      if (categoriaLower.includes(key)) {
        categoriaFinal = value as string;
        break;
      }
    }

    // 6. Crear caso
    const caso = await prisma.caso.create({
      data: {
        numeroCaso,
        usuarioId: usuario.id,
        condominioId: condominio.id,
        unidad: usuario.unidad || 'Por asignar',
        tipo: tipo === 'garantia' ? 'garantia' : 'condominio',
        categoria: categoriaFinal as any,
        descripcion: descripcion || 'Sin descripción',
        estado: 'nuevo',
        prioridad: urgente ? 'urgente' : 'media'
      },
      include: {
        usuario: true,
        condominio: true
      }
    });

    // 7. Crear evento en timeline
    await prisma.timelineEvento.create({
      data: {
        casoId: caso.id,
        tipoEvento: 'creado',
        titulo: 'Caso Creado',
        descripcion: 'Caso creado desde WhatsApp',
        usuarioNombre: 'Bot WhatsApp'
      }
    });

    res.status(201).json({
      success: true,
      caso: {
        id: caso.id,
        numeroCaso: caso.numeroCaso,
        descripcion: caso.descripcion,
        tipo: caso.tipo,
        prioridad: caso.prioridad
      }
    });

  } catch (error: any) {
    console.error('Error creando caso:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al crear caso'
    });
  }
});
