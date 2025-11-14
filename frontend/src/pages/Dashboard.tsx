import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  ThumbsUp,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  ArrowRight,
  Search,
  Filter,
  TrendingUp,
  Activity
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import SolicitudesChart from '../components/SolicitudesChart';
import UrgenciaChart from '../components/UrgenciaChart';
import { casosApi, kpisApi, solicitudesApi } from '../services/api';
import type { Caso, KPIStats } from '../types';

export default function Dashboard() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [solicitudesStats, setSolicitudesStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todas');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar casos, estadísticas y solicitudes en paralelo
      const [casosData, statsData, solicitudesStatsData] = await Promise.all([
        casosApi.getAll(),
        kpisApi.getDashboard(),
        solicitudesApi.getEstadisticas().catch(() => null),
      ]);

      setCasos(casosData);
      setStats(statsData);
      setSolicitudesStats(solicitudesStatsData?.estadisticas || null);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos. Por favor verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const casosFiltrados = casos.filter((caso) => {
    // Filtro por estado
    if (filtroEstado !== 'todos' && caso.estado !== filtroEstado) {
      return false;
    }

    // Filtro por prioridad
    if (filtroPrioridad !== 'todas' && caso.prioridad !== filtroPrioridad) {
      return false;
    }

    // Filtro por busqueda (numero de caso o nombre de cliente)
    if (filtroBusqueda) {
      const busqueda = filtroBusqueda.toLowerCase();
      const coincideNumero = caso.numeroCaso.toLowerCase().includes(busqueda);
      const coincideCliente = caso.usuario.nombreCompleto.toLowerCase().includes(busqueda);
      if (!coincideNumero && !coincideCliente) {
        return false;
      }
    }

    return true;
  });

  // Filtrar casos urgentes
  const casosUrgentes = casos.filter(caso => caso.prioridad === 'urgente');

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      nuevo: 'bg-blue-600 text-white',
      asignado: 'bg-purple-600 text-white',
      en_proceso: 'bg-yellow-600 text-white',
      en_visita: 'bg-orange-600 text-white',
      resuelto: 'bg-green-600 text-white',
      cerrado: 'bg-gray-600 text-white',
    };
    return colors[estado] || 'bg-gray-600 text-white';
  };

  // Función para obtener el color del badge según la prioridad
  const getPrioridadBadgeColor = (prioridad: string) => {
    const colors: Record<string, string> = {
      baja: 'bg-gray-600 text-white',
      media: 'bg-blue-600 text-white',
      alta: 'bg-orange-600 text-white',
      urgente: 'bg-red-600 text-white',
    };
    return colors[prioridad] || 'bg-gray-600 text-white';
  };

  // Función para formatear el estado
  const formatEstado = (estado: string) => {
    return estado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="text-red-400" size={24} />
          <div>
            <h3 className="text-red-200 font-semibold">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400 text-lg">
          Vista general del sistema de gestion de casos
        </p>
      </div>

      {/* Prospecting Quick Access */}
      <Link
        to="/prospecting"
        className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-6 mb-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 glow-blue"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <Search size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Prospección Inteligente
              </h2>
              <p className="text-blue-100">
                Busca y enriquece datos de empresas y contactos con Hunter.io, Apollo.io y PhantomBuster
              </p>
            </div>
          </div>
          <ArrowRight size={32} className="text-white" />
        </div>
      </Link>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Casos Nuevos"
          value={stats?.casosNuevos || 0}
          icon={FileText}
          iconColor="text-blue-200"
          iconBgColor="bg-blue-500 bg-opacity-20"
          gradient="bg-gradient-to-br from-blue-600 to-blue-800"
          glowClass="glow-blue"
        />
        <StatsCard
          title="En Proceso"
          value={stats?.casosEnProceso || 0}
          icon={Clock}
          iconColor="text-purple-200"
          iconBgColor="bg-purple-500 bg-opacity-20"
          gradient="bg-gradient-to-br from-purple-600 to-purple-800"
          glowClass="glow-purple"
        />
        <StatsCard
          title="Resueltos"
          value={stats?.casosResueltos || 0}
          icon={CheckCircle}
          iconColor="text-green-200"
          iconBgColor="bg-green-500 bg-opacity-20"
          gradient="bg-gradient-to-br from-green-600 to-green-800"
          glowClass="glow-green"
        />
        <StatsCard
          title="Satisfaccion"
          value={`${stats?.satisfaccionPromedio.toFixed(1) || '0.0'}/5`}
          icon={ThumbsUp}
          iconColor="text-orange-200"
          iconBgColor="bg-orange-500 bg-opacity-20"
          gradient="bg-gradient-to-br from-orange-600 to-orange-800"
          glowClass="glow-orange"
        />
      </div>

      {/* Estadísticas de Solicitudes IA */}
      {solicitudesStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Solicitudes IA"
              value={solicitudesStats.totalSolicitudes || 0}
              icon={Activity}
              iconColor="text-indigo-200"
              iconBgColor="bg-indigo-500 bg-opacity-20"
              gradient="bg-gradient-to-br from-indigo-600 to-indigo-800"
            />
            <StatsCard
              title="Tiempo Promedio Resolucion"
              value={`${Math.round(solicitudesStats.tiempoPromedioResolucionHoras || 0)}h`}
              icon={Clock}
              iconColor="text-cyan-200"
              iconBgColor="bg-cyan-500 bg-opacity-20"
              gradient="bg-gradient-to-br from-cyan-600 to-cyan-800"
              glowClass="glow-cyan"
            />
            <StatsCard
              title="Satisfaccion IA"
              value={`${solicitudesStats.satisfaccionPromedio?.toFixed(1) || '0.0'}/5`}
              icon={ThumbsUp}
              iconColor="text-pink-200"
              iconBgColor="bg-pink-500 bg-opacity-20"
              gradient="bg-gradient-to-br from-pink-600 to-pink-800"
              glowClass="glow-pink"
            />
            <StatsCard
              title="Tasa de Conversion"
              value={`${((solicitudesStats.totalSolicitudes / (casos.length + solicitudesStats.totalSolicitudes)) * 100).toFixed(0)}%`}
              icon={TrendingUp}
              iconColor="text-emerald-200"
              iconBgColor="bg-emerald-500 bg-opacity-20"
              gradient="bg-gradient-to-br from-emerald-600 to-emerald-800"
              glowClass="glow-green"
            />
          </div>

          {/* Gráficas de Solicitudes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {solicitudesStats.solicitudesPorTipo && solicitudesStats.solicitudesPorTipo.length > 0 && (
              <SolicitudesChart data={solicitudesStats.solicitudesPorTipo} />
            )}
            {solicitudesStats.solicitudesPorUrgencia && solicitudesStats.solicitudesPorUrgencia.length > 0 && (
              <UrgenciaChart data={solicitudesStats.solicitudesPorUrgencia} />
            )}
          </div>
        </>
      )}

      {/* Casos Urgentes */}
      {casosUrgentes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <AlertTriangle className="text-red-400" size={28} />
              <span>Casos Urgentes</span>
              <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                {casosUrgentes.length}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {casosUrgentes.map((caso) => (
              <Link
                key={caso.id}
                to={`/casos/${caso.id}`}
                className="bg-gradient-to-br from-red-900 to-red-950 border-2 border-red-600 rounded-xl p-6 hover:shadow-2xl hover:scale-105 transition-all glow-orange"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-xl mb-2">
                      {caso.numeroCaso}
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-white">
                      {formatEstado(caso.estado)}
                    </span>
                  </div>
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    URGENTE
                  </span>
                </div>
                <p className="text-gray-200 mb-4 line-clamp-2">{caso.descripcion}</p>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-red-400" />
                    <span>{caso.usuario.nombreCompleto}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-red-400" />
                    <span>{caso.condominio.nombre} - {caso.unidad}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-red-400" />
                    <span>{formatDate(caso.fechaCreacion)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Todos los Casos */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
            <Filter size={24} />
            <span>Todos los Casos</span>
          </h2>
          <span className="text-sm text-gray-400 bg-slate-800 px-4 py-2 rounded-lg">
            Mostrando {casosFiltrados.length} de {casos.length} casos
          </span>
        </div>

        {/* Filtros */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Estado */}
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="todos">Todos</option>
                <option value="nuevo">Nuevo</option>
                <option value="asignado">Asignado</option>
                <option value="en_proceso">En Proceso</option>
                <option value="resuelto">Resuelto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>

            {/* Filtro por Prioridad */}
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
                Prioridad
              </label>
              <select
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="todas">Todas</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            {/* Busqueda */}
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
                Buscar
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Numero de caso o cliente..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-slate-700 border border-slate-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-800 bg-opacity-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Caso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Ubicacion
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {casosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <AlertTriangle className="mx-auto mb-2 text-gray-500" size={48} />
                        <p className="text-lg font-medium text-gray-300">No se encontraron casos</p>
                        <p className="text-sm">Intenta ajustar los filtros de busqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  casosFiltrados.map((caso) => (
                  <tr key={caso.id} className="hover:bg-slate-700 hover:bg-opacity-30 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-bold text-white">
                          {caso.numeroCaso}
                        </div>
                        <div className="text-sm text-gray-400 max-w-xs truncate">
                          {caso.categoria}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{caso.usuario.nombreCompleto}</div>
                      <div className="text-sm text-gray-400">{caso.usuario.telefono}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{caso.condominio.nombre}</div>
                      <div className="text-sm text-gray-400">{caso.unidad}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getEstadoBadgeColor(caso.estado)}`}>
                        {formatEstado(caso.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getPrioridadBadgeColor(caso.prioridad)}`}>
                        {caso.prioridad.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(caso.fechaCreacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/casos/${caso.id}`}
                        className="text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1 hover:scale-110 transition-transform"
                      >
                        <span>Ver detalles</span>
                        <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
