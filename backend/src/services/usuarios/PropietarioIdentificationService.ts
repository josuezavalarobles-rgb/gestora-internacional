/**
 * ========================================
 * SERVICIO DE IDENTIFICACIÓN DE PROPIETARIOS
 * ========================================
 * Reconoce automáticamente propietarios cuando escriben por WhatsApp
 */

import { getPrismaClient } from '../../config/database/postgres';
import { logger } from '../../utils/logger';

const prisma = getPrismaClient();

export interface PropietarioInfo {
  existe: boolean;
  usuario?: {
    id: string;
    nombreCompleto: string;
    telefono: string;
    unidad: string | null;
    tipoUsuario: string;
    estado: string;
    condominioId: string | null;
    condominio?: {
      id: string;
      nombre: string;
      direccion: string;
      ciudad: string;
    };
  };
  esNuevo: boolean;
  mensaje: string;
}

export class PropietarioIdentificationService {
  private static instance: PropietarioIdentificationService;

  private constructor() {}

  public static getInstance(): PropietarioIdentificationService {
    if (!PropietarioIdentificationService.instance) {
      PropietarioIdentificationService.instance = new PropietarioIdentificationService();
    }
    return PropietarioIdentificationService.instance;
  }

  /**
   * Identificar propietario por número de teléfono
   */
  public async identificarPropietario(telefono: string): Promise<PropietarioInfo> {
    try {
      // Limpiar teléfono (remover espacios, guiones, paréntesis)
      const telefonoLimpio = this.limpiarTelefono(telefono);

      logger.info(`🔍 Buscando propietario con teléfono: ${telefonoLimpio}`);

      // Buscar usuario por teléfono
      const usuario = await prisma.usuario.findUnique({
        where: { telefono: telefonoLimpio },
        include: {
          condominio: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              ciudad: true,
            },
          },
        },
      });

      if (usuario) {
        // Usuario encontrado
        logger.info(`✅ Propietario identificado: ${usuario.nombreCompleto} - Unidad: ${usuario.unidad}`);

        return {
          existe: true,
          usuario: {
            id: usuario.id,
            nombreCompleto: usuario.nombreCompleto,
            telefono: usuario.telefono,
            unidad: usuario.unidad,
            tipoUsuario: usuario.tipoUsuario,
            estado: usuario.estado,
            condominioId: usuario.condominioId,
            condominio: usuario.condominio || undefined,
          },
          esNuevo: false,
          mensaje: this.generarMensajeBienvenida(usuario),
        };
      } else {
        // Usuario NO encontrado
        logger.info(`⚠️  Número no registrado: ${telefonoLimpio}`);

        return {
          existe: false,
          esNuevo: true,
          mensaje: this.generarMensajeNoRegistrado(),
        };
      }
    } catch (error) {
      logger.error('❌ Error al identificar propietario:', error);
      throw error;
    }
  }

  /**
   * Crear propietario nuevo desde WhatsApp
   */
  public async crearPropietarioNuevo(
    telefono: string,
    nombreCompleto?: string,
    unidad?: string
  ): Promise<PropietarioInfo> {
    try {
      const telefonoLimpio = this.limpiarTelefono(telefono);

      // Verificar si ya existe
      const existente = await prisma.usuario.findUnique({
        where: { telefono: telefonoLimpio },
      });

      if (existente) {
        return this.identificarPropietario(telefonoLimpio);
      }

      // Buscar condominio por defecto
      let condominio = await prisma.condominio.findFirst({
        where: { estado: 'activo' },
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
            slaCondominio: 72,
          },
        });
      }

      // Crear usuario
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          nombreCompleto: nombreCompleto || `Propietario ${telefonoLimpio}`,
          telefono: telefonoLimpio,
          tipoUsuario: 'propietario',
          estado: 'pendiente',
          condominioId: condominio.id,
          unidad: unidad || 'Por asignar - WhatsApp',
        },
        include: {
          condominio: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              ciudad: true,
            },
          },
        },
      });

      logger.info(`✅ Nuevo propietario creado: ${nuevoUsuario.nombreCompleto}`);

      return {
        existe: true,
        usuario: {
          id: nuevoUsuario.id,
          nombreCompleto: nuevoUsuario.nombreCompleto,
          telefono: nuevoUsuario.telefono,
          unidad: nuevoUsuario.unidad,
          tipoUsuario: nuevoUsuario.tipoUsuario,
          estado: nuevoUsuario.estado,
          condominioId: nuevoUsuario.condominioId,
          condominio: nuevoUsuario.condominio || undefined,
        },
        esNuevo: true,
        mensaje: this.generarMensajeBienvenidaNuevo(nuevoUsuario),
      };
    } catch (error) {
      logger.error('❌ Error al crear propietario nuevo:', error);
      throw error;
    }
  }

  /**
   * Actualizar información del propietario
   */
  public async actualizarPropietario(
    telefono: string,
    datos: {
      nombreCompleto?: string;
      unidad?: string;
      condominioId?: string;
    }
  ): Promise<PropietarioInfo> {
    try {
      const telefonoLimpio = this.limpiarTelefono(telefono);

      const usuario = await prisma.usuario.update({
        where: { telefono: telefonoLimpio },
        data: datos,
        include: {
          condominio: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              ciudad: true,
            },
          },
        },
      });

      logger.info(`✅ Propietario actualizado: ${usuario.nombreCompleto}`);

      return {
        existe: true,
        usuario: {
          id: usuario.id,
          nombreCompleto: usuario.nombreCompleto,
          telefono: usuario.telefono,
          unidad: usuario.unidad,
          tipoUsuario: usuario.tipoUsuario,
          estado: usuario.estado,
          condominioId: usuario.condominioId,
          condominio: usuario.condominio || undefined,
        },
        esNuevo: false,
        mensaje: '✅ Tus datos han sido actualizados correctamente.',
      };
    } catch (error) {
      logger.error('❌ Error al actualizar propietario:', error);
      throw error;
    }
  }

  /**
   * Obtener casos activos del propietario
   */
  public async obtenerCasosActivos(telefono: string) {
    try {
      const telefonoLimpio = this.limpiarTelefono(telefono);

      const usuario = await prisma.usuario.findUnique({
        where: { telefono: telefonoLimpio },
      });

      if (!usuario) {
        return [];
      }

      const casos = await prisma.caso.findMany({
        where: {
          usuarioId: usuario.id,
          estado: {
            in: ['nuevo', 'asignado', 'en_proceso', 'en_visita', 'esperando_repuestos'],
          },
        },
        orderBy: {
          fechaCreacion: 'desc',
        },
        take: 5,
      });

      return casos;
    } catch (error) {
      logger.error('❌ Error al obtener casos activos:', error);
      return [];
    }
  }

  /**
   * Limpiar número de teléfono
   */
  private limpiarTelefono(telefono: string): string {
    // Remover espacios, guiones, paréntesis, signos +
    return telefono.replace(/[\s\-\(\)\+]/g, '');
  }

  /**
   * Generar mensaje de bienvenida para propietario existente
   */
  private generarMensajeBienvenida(usuario: any): string {
    const nombreCorto = usuario.nombreCompleto.split(' ')[0];
    const unidadTexto = usuario.unidad ? `Unidad ${usuario.unidad}` : 'tu unidad';

    return `¡Hola ${nombreCorto}! 👋

Te identificamos automáticamente:
🏠 *${unidadTexto}*
🏢 *${usuario.condominio?.nombre || 'Condominio General'}*

¿En qué puedo ayudarte hoy?

Puedes:
1️⃣ Reportar un problema
2️⃣ Ver el estado de tus casos
3️⃣ Solicitar información
4️⃣ Hablar con un agente

Simplemente escribe lo que necesitas y te ayudaré. 😊`;
  }

  /**
   * Generar mensaje de bienvenida para propietario nuevo
   */
  private generarMensajeBienvenidaNuevo(usuario: any): string {
    return `¡Bienvenido al sistema Amico Management! 👋

Te hemos registrado exitosamente:
📱 *${usuario.telefono}*
🏢 *${usuario.condominio?.nombre || 'Condominio General'}*

Para brindarte un mejor servicio, por favor indícame:
1️⃣ Tu nombre completo
2️⃣ Tu número de unidad/apartamento

Ejemplo: "Mi nombre es Juan Pérez y mi unidad es 301"

Una vez que tengas tus datos completos, podrás reportar casos y recibir asistencia. 😊`;
  }

  /**
   * Obtener usuario por teléfono (método público para otros servicios)
   */
  public async obtenerPorTelefono(telefono: string): Promise<any> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { telefono },
        include: {
          condominio: true,
          casosCreados: {
            orderBy: { fechaCreacion: 'desc' },
            take: 5,
          },
        },
      });

      return usuario;
    } catch (error) {
      logger.error('❌ Error obteniendo usuario por teléfono:', error);
      throw error;
    }
  }

  /**
   * Generar mensaje para número no registrado
   */
  private generarMensajeNoRegistrado(): string {
    return `¡Hola! 👋 Bienvenido al sistema de gestión de condominios *Amico Management*.

No encontramos tu número registrado en nuestra base de datos.

Para poder ayudarte, necesitamos que nos proporciones:
1️⃣ Tu nombre completo
2️⃣ Tu número de unidad/apartamento
3️⃣ El nombre de tu condominio (si aplica)

Ejemplo: "Mi nombre es Juan Pérez, unidad 301, Condominio Las Palmas"

Una vez registrado, podrás reportar casos y recibir asistencia inmediata. 😊

¿Me puedes proporcionar esta información?`;
  }
}
