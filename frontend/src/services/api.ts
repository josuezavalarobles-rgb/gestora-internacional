import axios from 'axios';
import type { Caso, KPIStats } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;
