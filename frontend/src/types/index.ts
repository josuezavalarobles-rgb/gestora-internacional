// Tipos TypeScript para el frontend

export interface Caso {
  id: string;
  numeroCaso: string;
  usuario: Usuario;
  condominio: Condominio;
  unidad: string;
  tipo: 'garantia' | 'condominio';
  categoria: string;
  descripcion: string;
  estado: 'nuevo' | 'asignado' | 'en_proceso' | 'en_visita' | 'resuelto' | 'cerrado';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  tecnicoAsignado?: Usuario;
  fechaCreacion: string;
  fechaVisita?: string;
  fechaResolucion?: string;
  diagnostico?: string;
  solucionAplicada?: string;
  tiempoEstimado?: string;
  satisfaccionCliente?: number;
  timelineEventos?: TimelineEvento[];
  adjuntos?: Adjunto[];
}

export interface Usuario {
  id: string;
  nombreCompleto: string;
  telefono: string;
  email?: string;
  tipoUsuario: 'propietario' | 'inquilino' | 'tecnico' | 'admin';
  estado: 'activo' | 'inactivo' | 'pendiente';
  unidad?: string;
  condominio?: Condominio;
}

export interface Condominio {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  totalUnidades: number;
}

export interface TimelineEvento {
  id: string;
  tipoEvento: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  usuarioNombre?: string;
}

export interface Adjunto {
  id: string;
  tipo: 'imagen' | 'video' | 'documento';
  url: string;
  nombreArchivo: string;
}

export interface KPIStats {
  casosNuevos: number;
  casosEnProceso: number;
  casosResueltos: number;
  satisfaccionPromedio: number;
  tiempoRespuestaPromedio: number;
}
