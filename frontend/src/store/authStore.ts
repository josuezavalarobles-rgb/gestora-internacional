import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  nombreCompleto: string;
  email?: string;
  telefono: string;
  tipoUsuario: 'propietario' | 'inquilino' | 'tecnico' | 'admin';
  estado: 'activo' | 'inactivo' | 'pendiente';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (updatedUser) => {
        set((state) => {
          if (!state.user) return state;
          const newUser = { ...state.user, ...updatedUser };
          localStorage.setItem('user', JSON.stringify(newUser));
          return { user: newUser };
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
