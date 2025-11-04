import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Clock,
  Star,
  TrendingUp,
  Search,
  Filter,
  X,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Circle,
  Calendar,
} from 'lucide-react';
import { solicitudesApi } from '../services/api';

interface Solicitud {
  id: string;
  codigoUnico: string;
  nombreUsuario?: string;
  telefono: string;
  tipoSolicitud: string;
  categoria?: string;
  urgencia: string;
  estado: string;
  mensajesWhatsApp: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  fechaCreacion: string;
  tiempoResolucion?: number;
  calificacion?: number;
  descripcion?: string;
}

interface Estadisticas {
  totalSolicitudes: number;
  solicitudesHoy: number;
  tiempoPromedioResolucion: string;
  satisfaccionPromedio: number;
}

export default function SolicitudesIA() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalSolicitudes: 0,
    solicitudesHoy: 0,
    tiempoPromedioResolucion: '0h',
    satisfaccionPromedio: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroUrgencia, setFiltroUrgencia] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [responseSolicitudes, responseEstadisticas] = await Promise.all([
        solicitudesApi.getAll(),
        solicitudesApi.getEstadisticas(),
      ]);

      // Extraer datos de la respuesta
      const dataSolicitudes = responseSolicitudes.data || [];
      const dataEstadisticas = responseEstadisticas.estadisticas || {};

      setSolicitudes(dataSolicitudes);

      // Calcular solicitudes de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const solicitudesHoy = dataSolicitudes.filter((s: Solicitud) =>
        s.fechaCreacion.startsWith(hoy)
      ).length;

      setEstadisticas({
        totalSolicitudes: dataEstadisticas.totalSolicitudes || 0,
        solicitudesHoy: solicitudesHoy,
        tiempoPromedioResolucion: dataEstadisticas.tiempoPromedioResolucionHoras
          ? `${Math.round(dataEstadisticas.tiempoPromedioResolucionHoras)}h`
          : '0h',
        satisfaccionPromedio: dataEstadisticas.satisfaccionPromedio || 0,
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgenciaBadge = (urgencia: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      critica: { bg: 'bg-red-100', text: 'text-red-800', label: 'CRÍTICA' },
      alta: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'ALTA' },
      media: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'MEDIA' },
      baja: { bg: 'bg-green-100', text: 'text-green-800', label: 'BAJA' },
    };
    const badge = badges[urgencia.toLowerCase()] || badges.media;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      nueva: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Circle, label: 'NUEVA' },
      'en proceso': { bg: 'bg-purple-100', text: 'text-purple-800', icon: Clock, label: 'EN PROCESO' },
      resuelta: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2, label: 'RESUELTA' },
      pendiente: { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, label: 'PENDIENTE' },
    };
    const badge = badges[estado.toLowerCase()] || badges.pendiente;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  const abrirChat = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setShowChatModal(true);
  };

  const solicitudesFiltradas = solicitudes.filter((solicitud) => {
    // Filtro por estado
    if (filtroEstado !== 'todos' && solicitud.estado.toLowerCase() !== filtroEstado) {
      return false;
    }

    // Filtro por urgencia
    if (filtroUrgencia !== 'todos' && solicitud.urgencia.toLowerCase() !== filtroUrgencia) {
      return false;
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos' && solicitud.tipoSolicitud.toLowerCase() !== filtroTipo) {
      return false;
    }

    // Búsqueda por código o teléfono
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      return (
        solicitud.codigoUnico.toLowerCase().includes(busquedaLower) ||
        solicitud.telefono.includes(busqueda)
      );
    }

    return true;
  });

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearHora = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Solicitudes IA - WhatsApp</h1>
        </div>
        <p className="text-gray-600">
          Gestión de solicitudes creadas automáticamente desde WhatsApp
        </p>
      </div>

      {/* Cards de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Solicitudes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-blue-600" size={24} />
            </div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {estadisticas.totalSolicitudes}
          </h3>
          <p className="text-sm text-gray-600">Total Solicitudes</p>
        </div>

        {/* Solicitudes Hoy */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-green-600" size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
              HOY
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {estadisticas.solicitudesHoy}
          </h3>
          <p className="text-sm text-gray-600">Solicitudes Hoy</p>
        </div>

        {/* Tiempo Promedio */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="text-purple-600" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {estadisticas.tiempoPromedioResolucion}
          </h3>
          <p className="text-sm text-gray-600">Tiempo Promedio Resolución</p>
        </div>

        {/* Satisfacción */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="text-yellow-600" size={24} />
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={`${
                    i < Math.round(estadisticas.satisfaccionPromedio)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {estadisticas.satisfaccionPromedio.toFixed(1)}
          </h3>
          <p className="text-sm text-gray-600">Satisfacción Promedio</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por código o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro Estado */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="todos">Todos los estados</option>
              <option value="nueva">Nueva</option>
              <option value="en proceso">En Proceso</option>
              <option value="resuelta">Resuelta</option>
            </select>
          </div>

          {/* Filtro Urgencia */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filtroUrgencia}
              onChange={(e) => setFiltroUrgencia(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="todos">Todas las urgencias</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          {/* Filtro Tipo */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="todos">Todos los tipos</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="pago">Pago</option>
              <option value="reserva">Reserva</option>
              <option value="consulta">Consulta</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Solicitudes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Código Único
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Urgencia
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {solicitudesFiltradas.map((solicitud) => (
                <tr key={solicitud.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-lg text-blue-600">
                      {solicitud.codigoUnico}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <User size={14} className="text-gray-400" />
                        {solicitud.nombreUsuario || 'Sin nombre'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Phone size={12} className="text-gray-400" />
                        {solicitud.telefono}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {solicitud.tipoSolicitud}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 capitalize">
                      {solicitud.categoria || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getUrgenciaBadge(solicitud.urgencia)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getEstadoBadge(solicitud.estado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatearFecha(solicitud.fechaCreacion)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => abrirChat(solicitud)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare size={16} />
                      Ver Chat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {solicitudesFiltradas.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">No se encontraron solicitudes</p>
              <p className="text-gray-500 text-sm mt-1">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Chat */}
      {showChatModal && selectedSolicitud && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Chat Completo - WhatsApp</h2>
                <p className="text-sm opacity-90">
                  Código: <span className="font-mono font-bold">{selectedSolicitud.codigoUnico}</span>
                </p>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Info de Usuario */}
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <User className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedSolicitud.nombreUsuario || 'Usuario'}
                    </p>
                    <p className="text-sm text-gray-600">{selectedSolicitud.telefono}</p>
                  </div>
                </div>
                <div className="text-right">
                  {getUrgenciaBadge(selectedSolicitud.urgencia)}
                </div>
              </div>
            </div>

            {/* Mensajes del Chat */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100">
              {selectedSolicitud.mensajesWhatsApp.map((mensaje, index) => (
                <div
                  key={index}
                  className={`flex ${mensaje.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${mensaje.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg p-4 shadow-sm ${
                        mensaje.role === 'user'
                          ? 'bg-green-500 text-white rounded-br-none'
                          : 'bg-white text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{mensaje.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer del Modal */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MessageSquare size={16} />
                  {selectedSolicitud.mensajesWhatsApp.length} mensajes
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {formatearFecha(selectedSolicitud.fechaCreacion)}
                </span>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
