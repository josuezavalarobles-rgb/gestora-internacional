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
      nuevo: 'bg-blue-100 text-blue-800',
      asignado: 'bg-purple-100 text-purple-800',
      en_proceso: 'bg-yellow-100 text-yellow-800',
      en_visita: 'bg-orange-100 text-orange-800',
      resuelto: 'bg-green-100 text-green-800',
      cerrado: 'bg-gray-100 text-gray-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  // Función para obtener el color del badge según la prioridad
  const getPrioridadBadgeColor = (prioridad: string) => {
    const colors: Record<string, string> = {
      baja: 'bg-gray-100 text-gray-800',
      media: 'bg-blue-100 text-blue-800',
      alta: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800',
    };
    return colors[prioridad] || 'bg-gray-100 text-gray-800';
  };

  // Función para formatear el estado
  const formatEstado = (estado: string) => {
    return estado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="text-red-600" size={24} />
          <div>
            <h3 className="text-red-900 font-semibold">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Vista general del sistema de gestion de casos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Casos Nuevos"
          value={stats?.casosNuevos || 0}
          icon={FileText}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <StatsCard
          title="En Proceso"
          value={stats?.casosEnProceso || 0}
          icon={Clock}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-50"
        />
        <StatsCard
          title="Resueltos"
          value={stats?.casosResueltos || 0}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <StatsCard
          title="Satisfaccion"
          value={`${stats?.satisfaccionPromedio.toFixed(1) || '0.0'}/5`}
          icon={ThumbsUp}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
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
              iconColor="text-indigo-600"
              iconBgColor="bg-indigo-50"
            />
            <StatsCard
              title="Tiempo Promedio Resolucion"
              value={`${Math.round(solicitudesStats.tiempoPromedioResolucionHoras || 0)}h`}
              icon={Clock}
              iconColor="text-cyan-600"
              iconBgColor="bg-cyan-50"
            />
            <StatsCard
              title="Satisfaccion IA"
              value={`${solicitudesStats.satisfaccionPromedio?.toFixed(1) || '0.0'}/5`}
              icon={ThumbsUp}
              iconColor="text-pink-600"
              iconBgColor="bg-pink-50"
            />
            <StatsCard
              title="Tasa de Conversion"
              value={`${((solicitudesStats.totalSolicitudes / (casos.length + solicitudesStats.totalSolicitudes)) * 100).toFixed(0)}%`}
              icon={TrendingUp}
              iconColor="text-emerald-600"
              iconBgColor="bg-emerald-50"
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <AlertTriangle className="text-red-600" size={24} />
              <span>Casos Urgentes</span>
              <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {casosUrgentes.length}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {casosUrgentes.map((caso) => (
              <Link
                key={caso.id}
                to={`/casos/${caso.id}`}
                className="bg-white border-2 border-red-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                      {caso.numeroCaso}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadgeColor(caso.estado)}`}>
                      {formatEstado(caso.estado)}
                    </span>
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    URGENTE
                  </span>
                </div>
                <p className="text-gray-700 mb-3 line-clamp-2">{caso.descripcion}</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <User size={16} />
                    <span>{caso.usuario.nombreCompleto}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} />
                    <span>{caso.condominio.nombre} - {caso.unidad}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Filter size={20} />
            <span>Todos los Casos</span>
          </h2>
          <span className="text-sm text-gray-600">
            Mostrando {casosFiltrados.length} de {casos.length} casos
          </span>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Numero de caso o cliente..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicacion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {casosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <AlertTriangle className="mx-auto mb-2" size={48} />
                        <p className="text-lg font-medium">No se encontraron casos</p>
                        <p className="text-sm">Intenta ajustar los filtros de busqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  casosFiltrados.map((caso) => (
                  <tr key={caso.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {caso.numeroCaso}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {caso.categoria}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{caso.usuario.nombreCompleto}</div>
                      <div className="text-sm text-gray-500">{caso.usuario.telefono}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{caso.condominio.nombre}</div>
                      <div className="text-sm text-gray-500">{caso.unidad}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadgeColor(caso.estado)}`}>
                        {formatEstado(caso.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPrioridadBadgeColor(caso.prioridad)}`}>
                        {caso.prioridad.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(caso.fechaCreacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/casos/${caso.id}`}
                        className="text-blue-600 hover:text-blue-900 font-medium flex items-center space-x-1"
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
