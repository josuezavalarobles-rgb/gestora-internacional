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
};

export default api;
