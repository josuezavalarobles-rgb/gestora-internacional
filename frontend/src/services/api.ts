import axios from 'axios';
import type {
  Caso,
  KPIStats,
  HunterEmailResult,
  HunterDomainSearch,
  HunterVerification,
  ApolloContact,
  ApolloOrganization,
  LinkedInProfile,
  PhantomJob,
  SmartEnrichResult,
  ProspectingStatus,
  FindEmailData,
  SearchPeopleData,
  SearchOrganizationsData,
  LinkedInSearchData,
  SmartEnrichData,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de API
export const casosApi = {
  getAll: async (): Promise<Caso[]> => {
    const response = await api.get('/casos');
    return response.data;
  },

  getById: async (id: string): Promise<Caso> => {
    const response = await api.get(`/casos/${id}`);
    return response.data;
  },

  create: async (data: Partial<Caso>): Promise<Caso> => {
    const response = await api.post('/casos', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Caso>): Promise<Caso> => {
    const response = await api.put(`/casos/${id}`, data);
    return response.data;
  },

  asignarTecnico: async (casoId: string, tecnicoId: string): Promise<Caso> => {
    const response = await api.put(`/casos/${casoId}/asignar`, { tecnicoId });
    return response.data;
  },

  actualizarEstado: async (casoId: string, estado: string, notas?: string): Promise<Caso> => {
    const response = await api.put(`/casos/${casoId}/estado`, { estado, notas });
    return response.data;
  },
};

export const kpisApi = {
  getDashboard: async (): Promise<KPIStats> => {
    const response = await api.get('/kpis/dashboard');
    return response.data;
  },
};

export const usuariosApi = {
  obtenerTecnicos: async (): Promise<{ id: string; nombreCompleto: string; telefono: string; email?: string }[]> => {
    const response = await api.get('/usuarios/tecnicos');
    return response.data;
  },

  getAll: async (): Promise<any[]> => {
    const response = await api.get('/usuarios');
    return response.data;
  },

  create: async (data: any): Promise<any> => {
    const response = await api.post('/usuarios', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/usuarios/${id}`);
  },

  getPropietarios: async (): Promise<any[]> => {
    const response = await api.get('/usuarios?tipoUsuario=propietario');
    return response.data;
  },
};

export const condominiosApi = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get('/condominios');
    return response.data;
  },
};

export const citasApi = {
  obtenerDisponibilidad: async (fecha: string): Promise<any> => {
    const response = await api.get(`/citas/disponibilidad/${fecha}`);
    return response.data;
  },

  programar: async (data: any): Promise<any> => {
    const response = await api.post('/citas', data);
    return response.data;
  },

  confirmarPropietario: async (citaId: string): Promise<any> => {
    const response = await api.put(`/citas/${citaId}/confirmar-propietario`);
    return response.data;
  },

  confirmarIngenieria: async (citaId: string, tecnicoId: string): Promise<any> => {
    const response = await api.put(`/citas/${citaId}/confirmar-ingenieria`, { tecnicoId });
    return response.data;
  },

  reprogramar: async (citaId: string, data: any): Promise<any> => {
    const response = await api.put(`/citas/${citaId}/reprogramar`, data);
    return response.data;
  },

  cancelar: async (citaId: string, motivo: string): Promise<any> => {
    const response = await api.put(`/citas/${citaId}/cancelar`, { motivo });
    return response.data;
  },

  completar: async (citaId: string, data: any): Promise<any> => {
    const response = await api.put(`/citas/${citaId}/completar`, data);
    return response.data;
  },

  obtenerDelDia: async (fecha: string): Promise<any> => {
    const response = await api.get(`/citas/dia/${fecha}`);
    return response.data;
  },

  obtenerPorTecnico: async (tecnicoId: string, params?: any): Promise<any> => {
    const response = await api.get(`/citas/tecnico/${tecnicoId}`, { params });
    return response.data;
  },

  obtenerPendientes: async (): Promise<any> => {
    const response = await api.get('/citas/pendientes');
    return response.data;
  },
};

export const aprobacionesApi = {
  solicitar: async (data: any): Promise<any> => {
    const response = await api.post('/aprobaciones', data);
    return response.data;
  },

  obtenerPendientes: async (): Promise<any> => {
    const response = await api.get('/aprobaciones/pendientes');
    return response.data;
  },

  obtenerTodas: async (params?: any): Promise<any> => {
    const response = await api.get('/aprobaciones', { params });
    return response.data;
  },

  obtenerPorId: async (aprobacionId: string): Promise<any> => {
    const response = await api.get(`/aprobaciones/${aprobacionId}`);
    return response.data;
  },

  aprobar: async (aprobacionId: string, data: any): Promise<any> => {
    const response = await api.put(`/aprobaciones/${aprobacionId}/aprobar`, data);
    return response.data;
  },

  rechazar: async (aprobacionId: string, data: any): Promise<any> => {
    const response = await api.put(`/aprobaciones/${aprobacionId}/rechazar`, data);
    return response.data;
  },

  solicitarInfo: async (aprobacionId: string, data: any): Promise<any> => {
    const response = await api.put(`/aprobaciones/${aprobacionId}/solicitar-info`, data);
    return response.data;
  },
};

export const solicitudesApi = {
  getAll: async (params?: any): Promise<any> => {
    const response = await api.get('/solicitudes', { params });
    return response.data;
  },

  getEstadisticas: async (): Promise<any> => {
    const response = await api.get('/solicitudes/estadisticas');
    return response.data;
  },

  getByCodigo: async (codigo: string): Promise<any> => {
    const response = await api.get(`/solicitudes/codigo/${codigo}`);
    return response.data;
  },

  actualizarEstado: async (id: string, estado: string, asignadoA?: string, comentario?: string): Promise<any> => {
    const response = await api.patch(`/solicitudes/${id}/estado`, { estado, asignadoA, comentario });
    return response.data;
  },

  calificar: async (id: string, calificacion: number, comentario?: string): Promise<any> => {
    const response = await api.post(`/solicitudes/${id}/calificar`, { calificacion, comentario });
    return response.data;
  },
};

export const reportesApi = {
  getPorFecha: async (fechaInicio: string, fechaFin: string): Promise<any> => {
    const response = await api.get('/reportes/estadisticas', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  getEstadisticas: async (): Promise<any> => {
    const response = await api.get('/reportes/estadisticas');
    return response.data;
  },
};

export const visitasApi = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get('/visitas');
    return response.data;
  },

  getPorFecha: async (fecha: string): Promise<any[]> => {
    const response = await api.get('/visitas', {
      params: { fecha }
    });
    return response.data;
  },

  create: async (data: any): Promise<any> => {
    const response = await api.post('/visitas', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/visitas/${id}`, data);
    return response.data;
  },
};

// ============ PROSPECTING API ============

export const prospectingApi = {
  // ============ STATUS & CONFIGURATION ============

  getStatus: async (): Promise<ProspectingStatus> => {
    const response = await api.get('/prospecting/status');
    return response.data;
  },

  configure: async (provider: 'HUNTER' | 'APOLLO' | 'PHANTOMBUSTER', apiKey: string, isActive?: boolean): Promise<any> => {
    const response = await api.post('/prospecting/configure', { provider, apiKey, isActive });
    return response.data;
  },

  // ============ HUNTER.IO ENDPOINTS ============

  hunterFindEmail: async (data: FindEmailData): Promise<HunterEmailResult> => {
    const response = await api.post('/prospecting/hunter/find-email', data);
    return response.data;
  },

  hunterSearchDomain: async (domain: string, type?: 'personal' | 'generic', limit?: number): Promise<HunterDomainSearch> => {
    const response = await api.post('/prospecting/hunter/search-domain', {
      domain,
      type,
      limit,
    });
    return response.data;
  },

  hunterVerifyEmail: async (email: string): Promise<HunterVerification> => {
    const response = await api.post('/prospecting/hunter/verify-email', { email });
    return response.data;
  },

  hunterVerifyBatch: async (emails: string[]): Promise<HunterVerification[]> => {
    const response = await api.post('/prospecting/hunter/verify-batch', { emails });
    return response.data;
  },

  hunterEnrichLead: async (companyDomain: string, firstName?: string, lastName?: string): Promise<any> => {
    const response = await api.post('/prospecting/hunter/enrich-lead', {
      companyDomain,
      firstName,
      lastName,
    });
    return response.data;
  },

  hunterGetAccount: async (): Promise<any> => {
    const response = await api.get('/prospecting/hunter/account');
    return response.data;
  },

  // ============ APOLLO.IO ENDPOINTS ============

  apolloSearchPeople: async (data: SearchPeopleData): Promise<{ contacts: ApolloContact[]; total: number }> => {
    const response = await api.post('/prospecting/apollo/search-people', data);
    return response.data;
  },

  apolloSearchOrganizations: async (data: SearchOrganizationsData): Promise<{ organizations: ApolloOrganization[]; total: number }> => {
    const response = await api.post('/prospecting/apollo/search-organizations', data);
    return response.data;
  },

  apolloEnrichPerson: async (firstName?: string, lastName?: string, organizationDomain?: string, email?: string, linkedinUrl?: string): Promise<ApolloContact> => {
    const response = await api.post('/prospecting/apollo/enrich-person', {
      firstName,
      lastName,
      organizationDomain,
      email,
      linkedinUrl,
    });
    return response.data;
  },

  apolloEnrichOrganization: async (domain: string): Promise<ApolloOrganization> => {
    const response = await api.post('/prospecting/apollo/enrich-organization', { domain });
    return response.data;
  },

  apolloGetCompanyContacts: async (companyDomain: string, titles?: string[], limit?: number): Promise<ApolloContact[]> => {
    const response = await api.post('/prospecting/apollo/company-contacts', {
      companyDomain,
      titles,
      limit,
    });
    return response.data;
  },

  apolloFindDecisionMakers: async (industry: string, location?: string, companySize?: string, titles?: string[], limit?: number): Promise<ApolloContact[]> => {
    const response = await api.post('/prospecting/apollo/find-decision-makers', {
      industry,
      location,
      companySize,
      titles,
      limit,
    });
    return response.data;
  },

  apolloGetAccount: async (): Promise<any> => {
    const response = await api.get('/prospecting/apollo/account');
    return response.data;
  },

  // ============ PHANTOMBUSTER ENDPOINTS ============

  phantomBusterListAgents: async (): Promise<any[]> => {
    const response = await api.get('/prospecting/phantombuster/agents');
    return response.data;
  },

  phantomBusterLaunchAgent: async (agentId: string, argument?: any, saveToCloud?: boolean): Promise<PhantomJob> => {
    const response = await api.post('/prospecting/phantombuster/launch', {
      agentId,
      argument,
      saveToCloud,
    });
    return response.data;
  },

  phantomBusterGetContainerStatus: async (containerId: string): Promise<any> => {
    const response = await api.get(`/prospecting/phantombuster/container/${containerId}`);
    return response.data;
  },

  phantomBusterExtractLinkedInProfiles: async (searchUrl: string, numberOfPages?: number, emailDiscovery?: boolean): Promise<PhantomJob> => {
    const response = await api.post('/prospecting/phantombuster/linkedin/extract-profiles', {
      searchUrl,
      numberOfPages,
      emailDiscovery,
    });
    return response.data;
  },

  phantomBusterSearchLinkedIn: async (data: LinkedInSearchData): Promise<PhantomJob> => {
    const response = await api.post('/prospecting/phantombuster/linkedin/search', data);
    return response.data;
  },

  phantomBusterExtractLinkedInCompany: async (companyUrl: string, extractEmployees?: boolean): Promise<PhantomJob> => {
    const response = await api.post('/prospecting/phantombuster/linkedin/extract-company', {
      companyUrl,
      extractEmployees,
    });
    return response.data;
  },

  phantomBusterSendLinkedInMessages: async (profileUrls: string[], message: string, useProfileTag?: boolean): Promise<PhantomJob> => {
    const response = await api.post('/prospecting/phantombuster/linkedin/send-messages', {
      profileUrls,
      message,
      useProfileTag,
    });
    return response.data;
  },

  phantomBusterSendConnectionRequests: async (profileUrls: string[], personalizedMessage?: string, maxRequestsPerDay?: number): Promise<PhantomJob> => {
    const response = await api.post('/prospecting/phantombuster/linkedin/send-connections', {
      profileUrls,
      personalizedMessage,
      maxRequestsPerDay,
    });
    return response.data;
  },

  phantomBusterExtractInstagramFollowers: async (username: string, maxFollowers?: number): Promise<PhantomJob> => {
    const response = await api.post('/prospecting/phantombuster/instagram/extract-followers', {
      username,
      maxFollowers,
    });
    return response.data;
  },

  phantomBusterExtractFacebookPosts: async (pageUrl: string, maxPosts?: number): Promise<PhantomJob> => {
    const response = await api.post('/prospecting/phantombuster/facebook/extract-posts', {
      pageUrl,
      maxPosts,
    });
    return response.data;
  },

  phantomBusterScrapeWebsite: async (url: string, selectors?: { [key: string]: string }, waitTime?: number): Promise<PhantomJob> => {
    const response = await api.post('/prospecting/phantombuster/web-scrape', {
      url,
      selectors,
      waitTime,
    });
    return response.data;
  },

  phantomBusterGetAccount: async (): Promise<any> => {
    const response = await api.get('/prospecting/phantombuster/account');
    return response.data;
  },

  // ============ COMBINED/SMART ENDPOINTS ============

  smartEnrich: async (data: SmartEnrichData): Promise<SmartEnrichResult> => {
    const response = await api.post('/prospecting/smart-enrich', data);
    return response.data;
  },
};

export default api;
