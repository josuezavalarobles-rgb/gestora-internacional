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

// Tipos para formularios
export interface CrearTecnicoData {
  nombreCompleto: string;
  telefono: string;
  email?: string;
}

export interface CrearUsuarioData {
  nombreCompleto: string;
  telefono: string;
  email?: string;
  tipoUsuario: 'propietario' | 'inquilino';
  unidad: string;
  condominioId: string;
}

export interface CrearCasoData {
  usuarioId: string;
  condominioId: string;
  unidad: string;
  tipo: 'garantia' | 'condominio';
  categoria: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  tecnicoAsignadoId?: string;
}

// Tipos para reportes
export interface ReporteFiltros {
  fechaInicio: string;
  fechaFin: string;
}

export interface ReporteEstadisticas {
  totalCasos: number;
  casosPorEstado: { estado: string; cantidad: number }[];
  casosPorPrioridad: { prioridad: string; cantidad: number }[];
  casosPorTecnico: { tecnico: string; cantidad: number }[];
  casosPorDia: { fecha: string; cantidad: number }[];
  tiempoPromedioResolucion: number;
  slaCumplido: number;
}

// Tipos para calendario
export interface VisitaProgramada {
  id: string;
  caso: Caso;
  fecha: string;
  hora: string;
  tecnico: Usuario;
  estado: 'programada' | 'en_curso' | 'completada' | 'cancelada';
}

// Lista de categorias
export const CATEGORIAS = [
  'Plomeria',
  'Electricidad',
  'Pintura',
  'Carpinteria',
  'Cerrajeria',
  'Aire Acondicionado',
  'Limpieza',
  'Jardineria',
  'Seguridad',
  'Otros'
] as const;

export type Categoria = typeof CATEGORIAS[number];
