/**
 * Controlador de Solicitudes con IA
 * Sistema profesional de tracking con códigos únicos
 */

import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database/postgres';
import { asyncHandler } from '../middleware/errorHandler';

const prisma = getPrismaClient();

/**
 * Genera código único formato: AMICO-{TIPO}-{AÑO}-{NUMERO}
 */
async function generarCodigoUnico(tipoSolicitud: string, urgencia: string): Promise<string> {
  // Determinar prefijo según urgencia y tipo
  let prefijo = 'GEN';

  if (urgencia === 'critica') {
    prefijo = 'URG';
  } else {
    switch (tipoSolicitud) {
      case 'mantenimiento':
        prefijo = 'MAN';
        break;
      case 'pago':
        prefijo = 'PAG';
        break;
      case 'reserva':
        prefijo = 'RES';
        break;
      case 'acceso':
        prefijo = 'ACC';
        break;
      case 'emergencia':
        prefijo = 'EMG';
        break;
      default:
        prefijo = 'GEN';
    }
  }

  const año = new Date().getFullYear();

  // Contar solicitudes del año actual para generar número secuencial
  const count = await prisma.solicitud.count({
    where: {
      codigoUnico: {
        startsWith: `AMICO-${prefijo}-${año}-`
      }
    }
  });

  const numero = (count + 1).toString().padStart(4, '0');

  return `AMICO-${prefijo}-${año}-${numero}`;
}

/**
 * Crear solicitud desde WhatsApp
 */
export const crearSolicitudWhatsApp = asyncHandler(async (req: Request, res: Response) => {
  const {
    telefono,
    nombreUsuario,
    tipoSolicitud,
    urgencia,
    categoria,
    descripcion,
    mensajesWhatsApp,
    emocionDetectada
  } = req.body;

  // Validar campos requeridos
  if (!telefono || !tipoSolicitud || !urgencia || !descripcion) {
    return res.status(400).json({
      success: false,
      error: 'Faltan campos requeridos: telefono, tipoSolicitud, urgencia, descripcion'
    });
  }

  // Generar código único
  const codigoUnico = await generarCodigoUnico(tipoSolicitud, urgencia);

  // Buscar usuario existente por teléfono
  let usuarioId = null;
  const usuario = await prisma.usuario.findUnique({
    where: { telefono }
  });

  if (usuario) {
    usuarioId = usuario.id;
  }

  // Crear solicitud
  const solicitud = await prisma.solicitud.create({
    data: {
      codigoUnico,
      tipoSolicitud,
      urgencia,
      categoria: categoria || null,
      telefono,
      nombreUsuario: nombreUsuario || null,
      usuarioId: usuarioId || null,
      descripcion,
      mensajesWhatsApp: mensajesWhatsApp || null,
      emocionDetectada: emocionDetectada || 'neutral',
      estado: 'nueva',
      tiempoRespuesta: 0 // Se calculará cuando se responda
    }
  });

  res.status(201).json({
    success: true,
    solicitud: {
      id: solicitud.id,
      codigoUnico: solicitud.codigoUnico,
      tipoSolicitud: solicitud.tipoSolicitud,
      urgencia: solicitud.urgencia,
      estado: solicitud.estado,
      fechaCreacion: solicitud.fechaCreacion
    }
  });
});

/**
 * Obtener todas las solicitudes con filtros
 */
export const obtenerSolicitudes = asyncHandler(async (req: Request, res: Response) => {
  const {
    estado,
    urgencia,
    tipoSolicitud,
    telefono,
    fechaDesde,
    fechaHasta,
    page = '1',
    limit = '50'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Construir filtros
  const where: any = {};

  if (estado) {
    where.estado = estado;
  }

  if (urgencia) {
    where.urgencia = urgencia;
  }

  if (tipoSolicitud) {
    where.tipoSolicitud = tipoSolicitud;
  }

  if (telefono) {
    where.telefono = telefono;
  }

  if (fechaDesde || fechaHasta) {
    where.fechaCreacion = {};
    if (fechaDesde) {
      where.fechaCreacion.gte = new Date(fechaDesde as string);
    }
    if (fechaHasta) {
      where.fechaCreacion.lte = new Date(fechaHasta as string);
    }
  }

  // Obtener solicitudes
  const [solicitudes, total] = await Promise.all([
    prisma.solicitud.findMany({
      where,
      orderBy: [
        { urgencia: 'desc' },
        { fechaCreacion: 'desc' }
      ],
      skip,
      take: limitNum
    }),
    prisma.solicitud.count({ where })
  ]);

  res.json({
    success: true,
    data: solicitudes,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * Obtener solicitud por código único
 */
export const obtenerSolicitudPorCodigo = asyncHandler(async (req: Request, res: Response) => {
  const { codigo } = req.params;

  const solicitud = await prisma.solicitud.findUnique({
    where: { codigoUnico: codigo }
  });

  if (!solicitud) {
    return res.status(404).json({
      success: false,
      error: 'Solicitud no encontrada'
    });
  }

  res.json({
    success: true,
    data: solicitud
  });
});

/**
 * Actualizar estado de solicitud
 */
export const actualizarEstadoSolicitud = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado, asignadoA, comentario } = req.body;

  const data: any = {};

  if (estado) {
    data.estado = estado;

    // Si se resuelve, calcular tiempo de resolución
    if (estado === 'resuelta' || estado === 'cerrada') {
      const solicitud = await prisma.solicitud.findUnique({
        where: { id },
        select: { fechaCreacion: true }
      });

      if (solicitud) {
        const ahora = new Date();
        const tiempoResolucionHoras = Math.floor(
          (ahora.getTime() - solicitud.fechaCreacion.getTime()) / (1000 * 60 * 60)
        );
        data.tiempoResolucion = tiempoResolucionHoras;
        data.fechaResolucion = ahora;
      }
    }
  }

  if (asignadoA) {
    data.asignadoA = asignadoA;
    data.fechaAsignacion = new Date();
  }

  if (comentario) {
    data.comentario = comentario;
  }

  const solicitud = await prisma.solicitud.update({
    where: { id },
    data
  });

  res.json({
    success: true,
    data: solicitud
  });
});

/**
 * Obtener estadísticas de solicitudes
 */
export const obtenerEstadisticasSolicitudes = asyncHandler(async (req: Request, res: Response) => {
  const { fechaDesde, fechaHasta } = req.query;

  const where: any = {};

  if (fechaDesde || fechaHasta) {
    where.fechaCreacion = {};
    if (fechaDesde) {
      where.fechaCreacion.gte = new Date(fechaDesde as string);
    }
    if (fechaHasta) {
      where.fechaCreacion.lte = new Date(fechaHasta as string);
    }
  }

  // Estadísticas generales
  const [
    totalSolicitudes,
    solicitudesPorTipo,
    solicitudesPorUrgencia,
    solicitudesPorEstado,
    tiempoPromedioResolucion,
    satisfaccionPromedio
  ] = await Promise.all([
    prisma.solicitud.count({ where }),

    prisma.solicitud.groupBy({
      by: ['tipoSolicitud'],
      where,
      _count: true
    }),

    prisma.solicitud.groupBy({
      by: ['urgencia'],
      where,
      _count: true
    }),

    prisma.solicitud.groupBy({
      by: ['estado'],
      where,
      _count: true
    }),

    prisma.solicitud.aggregate({
      where: {
        ...where,
        tiempoResolucion: { not: null }
      },
      _avg: {
        tiempoResolucion: true
      }
    }),

    prisma.solicitud.aggregate({
      where: {
        ...where,
        calificacion: { not: null }
      },
      _avg: {
        calificacion: true
      }
    })
  ]);

  res.json({
    success: true,
    estadisticas: {
      totalSolicitudes,
      solicitudesPorTipo: solicitudesPorTipo.map(item => ({
        tipo: item.tipoSolicitud,
        cantidad: item._count
      })),
      solicitudesPorUrgencia: solicitudesPorUrgencia.map(item => ({
        urgencia: item.urgencia,
        cantidad: item._count
      })),
      solicitudesPorEstado: solicitudesPorEstado.map(item => ({
        estado: item.estado,
        cantidad: item._count
      })),
      tiempoPromedioResolucionHoras: tiempoPromedioResolucion._avg.tiempoResolucion || 0,
      satisfaccionPromedio: satisfaccionPromedio._avg.calificacion || 0
    }
  });
});

/**
 * Calificar solicitud (satisfacción del cliente)
 */
export const calificarSolicitud = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { calificacion, comentario } = req.body;

  if (!calificacion || calificacion < 1 || calificacion > 5) {
    return res.status(400).json({
      success: false,
      error: 'La calificación debe ser un número entre 1 y 5'
    });
  }

  const solicitud = await prisma.solicitud.update({
    where: { id },
    data: {
      calificacion,
      comentario: comentario || null
    }
  });

  res.json({
    success: true,
    data: solicitud
  });
});
