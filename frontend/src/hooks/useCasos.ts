import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casosApi } from '@/services/api';
import type { Caso, CrearCasoData } from '@/types';

// Query key constants
export const CASOS_KEYS = {
  all: ['casos'] as const,
  detail: (id: string) => ['casos', id] as const,
};

// Hook para obtener todos los casos
export function useCasos() {
  return useQuery({
    queryKey: CASOS_KEYS.all,
    queryFn: casosApi.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obtener un caso específico
export function useCaso(id: string) {
  return useQuery({
    queryKey: CASOS_KEYS.detail(id),
    queryFn: () => casosApi.getById(id),
    enabled: !!id,
  });
}

// Hook para crear un caso
export function useCrearCaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CrearCasoData) => casosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASOS_KEYS.all });
    },
  });
}

// Hook para actualizar un caso
export function useActualizarCaso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Caso> }) =>
      casosApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CASOS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CASOS_KEYS.detail(variables.id) });
    },
  });
}

// Hook para asignar técnico
export function useAsignarTecnico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ casoId, tecnicoId }: { casoId: string; tecnicoId: string }) =>
      casosApi.asignarTecnico(casoId, tecnicoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CASOS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CASOS_KEYS.detail(variables.casoId) });
    },
  });
}

// Hook para actualizar estado
export function useActualizarEstado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      casoId,
      estado,
      notas,
    }: {
      casoId: string;
      estado: string;
      notas?: string;
    }) => casosApi.actualizarEstado(casoId, estado, notas),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CASOS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CASOS_KEYS.detail(variables.casoId) });
    },
  });
}
