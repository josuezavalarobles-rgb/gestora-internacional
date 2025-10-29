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
