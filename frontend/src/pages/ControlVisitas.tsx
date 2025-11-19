import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Search, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { visitasAPI } from '../services/api';

interface Visita {
  id: string;
  visitante: string;
  cedula: string;
  unidad: string;
  tipo: 'Residente' | 'Invitado' | 'Proveedor' | 'Delivery';
  horaLlegada: string;
  horaSalida?: string;
  estado: 'En Espera' | 'Autorizada' | 'Dentro' | 'Rechazada' | 'Salió';
  motivo: string;
}

export default function ControlVisitas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const queryClient = useQueryClient();

  // Cargar visitas desde el API
  const { data: visitas = [], isLoading, error } = useQuery({
    queryKey: ['visitas'],
    queryFn: () => visitasAPI.obtenerTodas(),
  });

  // Cargar estadísticas
  const { data: estadisticas } = useQuery({
    queryKey: ['visitas-estadisticas'],
    queryFn: () => visitasAPI.obtenerEstadisticas(),
  });

  // Mutación para autorizar visita
  const autorizarMutation = useMutation({
    mutationFn: (id: string) => visitasAPI.autorizar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitas'] });
      queryClient.invalidateQueries({ queryKey: ['visitas-estadisticas'] });
    },
  });

  // Mutación para rechazar visita
  const rechazarMutation = useMutation({
    mutationFn: (id: string) => visitasAPI.rechazar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitas'] });
      queryClient.invalidateQueries({ queryKey: ['visitas-estadisticas'] });
    },
  });

  // Mutación para registrar salida
  const registrarSalidaMutation = useMutation({
    mutationFn: (id: string) => visitasAPI.registrarSalida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitas'] });
      queryClient.invalidateQueries({ queryKey: ['visitas-estadisticas'] });
    },
  });

  // Calcular estadísticas
  const visitasHoy = estadisticas?.visitasHoy || visitas.length;
  const enEspera = estadisticas?.enEspera || visitas.filter((v: Visita) => v.estado === 'En Espera').length;
  const autorizadas = estadisticas?.autorizadas || visitas.filter((v: Visita) => v.estado === 'Autorizada' || v.estado === 'Dentro').length;
  const rechazadas = estadisticas?.rechazadas || visitas.filter((v: Visita) => v.estado === 'Rechazada').length;

  // Filtrar visitas
  const visitasFiltradas = visitas.filter((visita: Visita) => {
    const matchSearch =
      visita.visitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visita.cedula.includes(searchTerm) ||
      visita.unidad.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = filtroEstado === 'todos' || visita.estado === filtroEstado;

    return matchSearch && matchEstado;
  });

  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      'En Espera': 'bg-yellow-600 text-white',
      'Autorizada': 'bg-green-600 text-white',
      'Dentro': 'bg-blue-600 text-white',
      'Rechazada': 'bg-red-600 text-white',
      'Salió': 'bg-gray-600 text-white'
    };
    return colors[estado] || 'bg-gray-600 text-white';
  };

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'Residente': 'bg-purple-600 text-white',
      'Invitado': 'bg-blue-600 text-white',
      'Proveedor': 'bg-orange-600 text-white',
      'Delivery': 'bg-cyan-600 text-white'
    };
    return colors[tipo] || 'bg-gray-600 text-white';
  };

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Cargando visitas...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <UserCheck size={64} className="mx-auto text-red-500 mb-4" />
          <p className="text-red-400 text-lg mb-2">Error al cargar visitas</p>
          <p className="text-gray-500 text-sm">{error instanceof Error ? error.message : 'Error desconocido'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <UserCheck className="text-cyan-400" size={40} />
          Control de Visitas
        </h1>
        <p className="text-gray-400 text-lg">
          Sistema de registro y autorización de visitantes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6 glow-blue">
          <div className="flex items-center justify-between mb-3">
            <div className="text-blue-200 text-sm font-bold uppercase">Visitas Hoy</div>
            <UserCheck className="text-blue-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{visitasHoy}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl shadow-2xl p-6 glow-yellow">
          <div className="flex items-center justify-between mb-3">
            <div className="text-yellow-200 text-sm font-bold uppercase">En Espera</div>
            <Clock className="text-yellow-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{enEspera}</div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-2xl p-6 glow-green">
          <div className="flex items-center justify-between mb-3">
            <div className="text-green-200 text-sm font-bold uppercase">Autorizadas</div>
            <CheckCircle className="text-green-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{autorizadas}</div>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl shadow-2xl p-6 glow-red">
          <div className="flex items-center justify-between mb-3">
            <div className="text-red-200 text-sm font-bold uppercase">Rechazadas</div>
            <XCircle className="text-red-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{rechazadas}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
              Buscar Visitante
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por cédula, nombre o unidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-slate-700 border border-slate-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
              Filtrar por Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="todos">Todos los Estados</option>
              <option value="En Espera">En Espera</option>
              <option value="Autorizada">Autorizada</option>
              <option value="Dentro">Dentro</option>
              <option value="Rechazada">Rechazada</option>
              <option value="Salió">Salió</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visitas en Espera - Destacadas */}
      {enEspera > 0 && (
        <div className="bg-gradient-to-br from-yellow-900 to-yellow-950 border-2 border-yellow-600 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <AlertTriangle className="text-yellow-400" size={28} />
              Visitas Pendientes de Autorización
              <span className="bg-yellow-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                {enEspera}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitas.filter((v: Visita) => v.estado === 'En Espera').map((visita: Visita) => (
              <div key={visita.id} className="bg-slate-800 rounded-lg p-4 border border-yellow-600">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-bold">{visita.visitante}</h3>
                    <p className="text-sm text-gray-400 font-mono">{visita.cedula}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getTipoBadgeColor(visita.tipo)}`}>
                    {visita.tipo}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-300 mb-3">
                  <p><strong>Unidad:</strong> {visita.unidad}</p>
                  <p><strong>Llegada:</strong> {visita.horaLlegada}</p>
                  <p><strong>Motivo:</strong> {visita.motivo}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium text-sm">
                    <CheckCircle size={16} />
                    Autorizar
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium text-sm">
                    <XCircle size={16} />
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de Todas las Visitas */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            Registro de Visitas ({visitasFiltradas.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800 bg-opacity-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Visitante
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Unidad
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Hora Llegada
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {visitasFiltradas.map((visita: Visita) => (
                <tr key={visita.id} className="hover:bg-slate-700 hover:bg-opacity-30 transition-all">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-bold text-white">{visita.visitante}</div>
                      <div className="text-xs text-gray-400 font-mono">{visita.cedula}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300">{visita.unidad}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getTipoBadgeColor(visita.tipo)}`}>
                      {visita.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      <div>Llegada: {visita.horaLlegada}</div>
                      {visita.horaSalida && (
                        <div className="text-xs">Salida: {visita.horaSalida}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300">{visita.motivo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getEstadoBadgeColor(visita.estado)}`}>
                      {visita.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {visita.estado === 'En Espera' && (
                        <>
                          <button className="px-3 py-1.5 bg-green-600 bg-opacity-20 hover:bg-opacity-30 text-green-400 rounded-lg transition-all text-sm font-medium">
                            Autorizar
                          </button>
                          <button className="px-3 py-1.5 bg-red-600 bg-opacity-20 hover:bg-opacity-30 text-red-400 rounded-lg transition-all text-sm font-medium">
                            Rechazar
                          </button>
                        </>
                      )}
                      {visita.estado === 'Dentro' && (
                        <button className="px-3 py-1.5 bg-blue-600 bg-opacity-20 hover:bg-opacity-30 text-blue-400 rounded-lg transition-all text-sm font-medium">
                          Registrar Salida
                        </button>
                      )}
                      {(visita.estado === 'Salió' || visita.estado === 'Rechazada') && (
                        <button className="px-3 py-1.5 bg-purple-600 bg-opacity-20 hover:bg-opacity-30 text-purple-400 rounded-lg transition-all text-sm font-medium">
                          Ver Detalles
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visitasFiltradas.length === 0 && (
          <div className="p-12 text-center">
            <UserCheck size={64} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">No se encontraron visitas</p>
            <p className="text-gray-500 text-sm">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
