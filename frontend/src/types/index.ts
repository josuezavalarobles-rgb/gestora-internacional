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

// ============ PROSPECTING TYPES ============

// Prospecting - Hunter.io
export interface HunterEmailResult {
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  confidence: number;
  verified: boolean;
  sources: Array<{
    domain: string;
    uri: string;
    extracted_on: string;
  }>;
}

export interface HunterDomainSearch {
  domain: string;
  pattern: string;
  organization: string;
  emails: Array<{
    email: string;
    firstName: string;
    lastName: string;
    position: string;
    type: 'personal' | 'generic';
    confidence: number;
    verified: boolean;
  }>;
}

export interface HunterVerification {
  email: string;
  status: 'valid' | 'invalid' | 'accept_all' | 'unknown';
  result: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
  score: number;
  regexp: boolean;
  gibberish: boolean;
  disposable: boolean;
  webmail: boolean;
  mxRecords: boolean;
  smtpServer: boolean;
  smtpCheck: boolean;
  acceptAll: boolean;
  block: boolean;
}

// Prospecting - Apollo.io
export interface ApolloContact {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  title: string;
  email: string;
  emailStatus: 'verified' | 'guessed' | 'unavailable';
  phone: string;
  linkedinUrl: string;
  organization: {
    id: string;
    name: string;
    website: string;
    industry: string;
    employeeCount: number;
    city: string;
    state: string;
    country: string;
  };
}

export interface ApolloOrganization {
  id: string;
  name: string;
  website: string;
  domain: string;
  industry: string;
  employeeCount: number;
  employeeRange: string;
  city: string;
  state: string;
  country: string;
  founded: number;
  revenue: number;
  revenueRange: string;
  technologies: string[];
  phoneNumbers: string[];
  socialMediaUrls: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
}

// Prospecting - PhantomBuster
export interface LinkedInProfile {
  profileUrl: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string;
  location: string;
  connectionsCount: number;
  company: string;
  jobTitle: string;
  email?: string;
  phone?: string;
  skills?: string[];
}

export interface PhantomJob {
  jobId: string;
  status: 'running' | 'queued' | 'finished' | 'failed';
  message: string;
  progress?: number;
}

// Prospecting - Combined/Smart Enrich
export interface SmartEnrichResult {
  company: ApolloOrganization | null;
  contact: {
    email?: string;
    verified?: boolean;
    confidence?: number;
    phone?: string;
    linkedinUrl?: string;
    title?: string;
  } | null;
  emails: Array<{
    email: string;
    position: string;
    verified: boolean;
  }>;
  phones: string[];
  sources: string[];
}

// Prospecting Configuration
export interface ProspectingStatus {
  hunter: {
    configured: boolean;
    account: {
      email: string;
      calls: {
        available: number;
        used: number;
      };
    } | null;
  };
  apollo: {
    configured: boolean;
    account: {
      email: string;
      credits: {
        available: number;
        used: number;
      };
    } | null;
  };
  phantombuster: {
    configured: boolean;
    account: {
      email: string;
      timeLeft: number;
      executionTimeLeft: number;
    } | null;
  };
}

// Prospect Lead (CRM Integration)
export interface Prospect {
  id: string;
  nombreCompleto: string;
  nombres: string;
  apellidos: string;
  email?: string;
  emailVerificado?: boolean;
  telefono?: string;
  empresa?: string;
  sitioWeb?: string;
  puesto?: string;
  linkedinUrl?: string;
  industria?: string;
  tamañoEmpresa?: string;
  ubicacion?: string;
  pais?: string;
  estado: 'nuevo' | 'contactado' | 'calificado' | 'interesado' | 'no_interesado' | 'convertido';
  fuente: 'hunter' | 'apollo' | 'phantombuster' | 'manual' | 'importacion';
  confianza?: number; // 0-100
  ultimoContacto?: string;
  proximoSeguimiento?: string;
  notas?: string;
  tags?: string[];
  companyId: string;
  creadoPor: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  datosEnriquecidos?: {
    hunter?: any;
    apollo?: any;
    phantombuster?: any;
  };
}

// Formularios de prospección
export interface FindEmailData {
  domain: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

export interface SearchPeopleData {
  personTitles?: string[];
  personLocations?: string[];
  organizationIndustries?: string[];
  organizationNumEmployeesRanges?: string[];
  organizationDomains?: string[];
  q_keywords?: string;
  page?: number;
  perPage?: number;
}

export interface SearchOrganizationsData {
  organizationIndustries?: string[];
  organizationLocations?: string[];
  organizationNumEmployeesRanges?: string[];
  q_organization_keyword_tags?: string[];
  page?: number;
  perPage?: number;
}

export interface LinkedInSearchData {
  keywords?: string;
  location?: string;
  currentCompany?: string;
  pastCompany?: string;
  industry?: string;
  title?: string;
  schoolName?: string;
  numberOfPages?: number;
}

export interface SmartEnrichData {
  companyDomain: string;
  contactName?: string;
  firstName?: string;
  lastName?: string;
  useApollo?: boolean;
  useHunter?: boolean;
}

// Prospecting Workflow
export interface ProspectingWorkflow {
  id: string;
  nombre: string;
  descripcion?: string;
  pasos: WorkflowStep[];
  estado: 'activo' | 'pausado' | 'completado';
  companyId: string;
  creadoPor: string;
  fechaCreacion: string;
  ultimaEjecucion?: string;
}

export interface WorkflowStep {
  id: string;
  tipo: 'buscar' | 'enriquecer' | 'verificar' | 'guardar' | 'notificar';
  proveedor?: 'hunter' | 'apollo' | 'phantombuster';
  parametros: any;
  orden: number;
}

// Prospecting Campaign
export interface ProspectingCampaign {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: 'borrador' | 'activa' | 'pausada' | 'completada';
  prospectosObjetivo: number;
  prospectosEncontrados: number;
  prospectosContactados: number;
  prospectosConvertidos: number;
  workflows: ProspectingWorkflow[];
  companyId: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaCreacion: string;
}
