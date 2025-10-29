import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Phone,
  Mail,
  Home,
  Wrench,
  AlertTriangle,
  MessageSquare,
  Edit,
  Trash2,
  UserPlus,
  PlayCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { casosApi, usuariosApi } from '../services/api';
import type { Caso } from '../types';

export default function CasoDetalle() {
  const { id } = useParams<{ id: string }>();
  const [caso, setCaso] = useState<Caso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tecnicos, setTecnicos] = useState<{ id: string; nombreCompleto: string; telefono: string; email?: string }[]>([]);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<string>('');
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadCaso(id);
      loadTecnicos();
    }
  }, [id]);

  const loadCaso = async (casoId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await casosApi.getById(casoId);
      setCaso(data);
    } catch (err) {
      console.error('Error cargando caso:', err);
      setError('Error al cargar el caso. Por favor verifica que el backend este corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const loadTecnicos = async () => {
    try {
      const data = await usuariosApi.obtenerTecnicos();
      setTecnicos(data);
    } catch (err) {
      console.error('Error cargando tecnicos:', err);
    }
  };

  const handleAsignarTecnico = async () => {
    if (!tecnicoSeleccionado || !id) return;

    try {
      setProcesando(true);
      setMensaje(null);
      await casosApi.asignarTecnico(id, tecnicoSeleccionado);
      setMensaje({ tipo: 'success', texto: 'Tecnico asignado exitosamente' });
      await loadCaso(id);
      setTecnicoSeleccionado('');
    } catch (err) {
      console.error('Error asignando tecnico:', err);
      setMensaje({ tipo: 'error', texto: 'Error al asignar el tecnico. Intenta de nuevo.' });
    } finally {
      setProcesando(false);
      setTimeout(() => setMensaje(null), 5000);
    }
  };

  const handleActualizarEstado = async (nuevoEstado: string) => {
    if (!id) return;

    try {
      setProcesando(true);
      setMensaje(null);
      await casosApi.actualizarEstado(id, nuevoEstado);
      setMensaje({ tipo: 'success', texto: `Estado actualizado a ${formatEstado(nuevoEstado)}` });
      await loadCaso(id);
    } catch (err) {
      console.error('Error actualizando estado:', err);
      setMensaje({ tipo: 'error', texto: 'Error al actualizar el estado. Intenta de nuevo.' });
    } finally {
      setProcesando(false);
      setTimeout(() => setMensaje(null), 5000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      nuevo: 'bg-blue-100 text-blue-800 border-blue-200',
      asignado: 'bg-purple-100 text-purple-800 border-purple-200',
      en_proceso: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      en_visita: 'bg-orange-100 text-orange-800 border-orange-200',
      resuelto: 'bg-green-100 text-green-800 border-green-200',
      cerrado: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPrioridadBadgeColor = (prioridad: string) => {
    const colors: Record<string, string> = {
      baja: 'bg-gray-100 text-gray-800 border-gray-200',
      media: 'bg-blue-100 text-blue-800 border-blue-200',
      alta: 'bg-orange-100 text-orange-800 border-orange-200',
      urgente: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[prioridad] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatEstado = (estado: string) => {
    return estado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTimelineIcon = (tipoEvento: string) => {
    const icons: Record<string, any> = {
      creacion: FileText,
      asignacion: User,
      actualizacion: Edit,
      visita: Home,
      resolucion: CheckCircle,
      comentario: MessageSquare,
    };
    return icons[tipoEvento] || AlertCircle;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando caso...</p>
        </div>
      </div>
    );
  }

  if (error || !caso) {
    return (
      <div>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft size={20} />
          <span>Volver al Dashboard</span>
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="text-red-600" size={24} />
            <div>
              <h3 className="text-red-900 font-semibold">Error</h3>
              <p className="text-red-700">{error || 'Caso no encontrado'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con boton de volver */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={20} />
          <span>Volver al Dashboard</span>
        </Link>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Edit size={18} />
            <span>Editar</span>
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
            <Trash2 size={18} />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      {/* Mensajes de exito/error */}
      {mensaje && (
        <div className={`rounded-lg p-4 border ${
          mensaje.tipo === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {mensaje.tipo === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <span className="font-medium">{mensaje.texto}</span>
          </div>
        </div>
      )}

      {/* Seccion de acciones rapidas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rapidas</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asignar Tecnico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asignar Tecnico
            </label>
            <div className="flex space-x-2">
              <select
                value={tecnicoSeleccionado}
                onChange={(e) => setTecnicoSeleccionado(e.target.value)}
                disabled={procesando}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar tecnico...</option>
                {tecnicos.map((tecnico) => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nombreCompleto} - {tecnico.telefono}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAsignarTecnico}
                disabled={!tecnicoSeleccionado || procesando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <UserPlus size={18} />
                <span>{procesando ? 'Asignando...' : 'Asignar'}</span>
              </button>
            </div>
          </div>

          {/* Cambiar Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cambiar Estado
            </label>
            <div className="flex flex-wrap gap-2">
              {(caso?.estado === 'nuevo' || caso?.estado === 'asignado') && (
                <button
                  onClick={() => handleActualizarEstado('en_proceso')}
                  disabled={procesando}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <PlayCircle size={18} />
                  <span>Marcar En Proceso</span>
                </button>
              )}
              {caso?.estado === 'en_proceso' && (
                <button
                  onClick={() => handleActualizarEstado('resuelto')}
                  disabled={procesando}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={18} />
                  <span>Marcar como Resuelto</span>
                </button>
              )}
              {caso?.estado === 'resuelto' && (
                <button
                  onClick={() => handleActualizarEstado('cerrado')}
                  disabled={procesando}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <XCircle size={18} />
                  <span>Cerrar Caso</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Titulo y badges */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {caso.numeroCaso}
            </h1>
            <p className="text-gray-600 text-lg">{caso.categoria}</p>
          </div>
          <div className="flex flex-col space-y-2 items-end">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getEstadoBadgeColor(caso.estado)}`}>
              {formatEstado(caso.estado)}
            </span>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getPrioridadBadgeColor(caso.prioridad)}`}>
              Prioridad: {caso.prioridad.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Descripcion del Problema</h2>
          <p className="text-gray-700 leading-relaxed">{caso.descripcion}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Informacion principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informacion del Cliente */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User size={20} />
              <span>Informacion del Cliente</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <User className="text-gray-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="text-gray-900 font-medium">{caso.usuario.nombreCompleto}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="text-gray-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Telefono</p>
                    <p className="text-gray-900 font-medium">{caso.usuario.telefono}</p>
                  </div>
                </div>
                {caso.usuario.email && (
                  <div className="flex items-start space-x-3">
                    <Mail className="text-gray-400 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900 font-medium">{caso.usuario.email}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="text-gray-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Condominio</p>
                    <p className="text-gray-900 font-medium">{caso.condominio.nombre}</p>
                    <p className="text-sm text-gray-600">{caso.condominio.direccion}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Home className="text-gray-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Unidad</p>
                    <p className="text-gray-900 font-medium">{caso.unidad}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostico y Solucion */}
          {(caso.diagnostico || caso.solucionAplicada) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Wrench size={20} />
                <span>Diagnostico y Solucion</span>
              </h2>
              <div className="space-y-4">
                {caso.diagnostico && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Diagnostico</h3>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{caso.diagnostico}</p>
                  </div>
                )}
                {caso.solucionAplicada && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Solucion Aplicada</h3>
                    <p className="text-gray-900 bg-green-50 p-3 rounded-lg">{caso.solucionAplicada}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline de Eventos */}
          {caso.timelineEventos && caso.timelineEventos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock size={20} />
                <span>Timeline de Eventos</span>
              </h2>
              <div className="space-y-4">
                {caso.timelineEventos.map((evento, index) => {
                  const IconComponent = getTimelineIcon(evento.tipoEvento);
                  const isLast = index === caso.timelineEventos!.length - 1;

                  return (
                    <div key={evento.id} className="flex space-x-3">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <IconComponent className="text-blue-600" size={20} />
                        </div>
                        {!isLast && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900">{evento.titulo}</h3>
                          <span className="text-sm text-gray-500">
                            {formatDate(evento.fecha)}
                          </span>
                        </div>
                        {evento.descripcion && (
                          <p className="text-gray-600 text-sm">{evento.descripcion}</p>
                        )}
                        {evento.usuarioNombre && (
                          <p className="text-gray-500 text-xs mt-1">
                            Por: {evento.usuarioNombre}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha - Informacion adicional */}
        <div className="space-y-6">
          {/* Detalles del Caso */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Caso</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tipo de Caso</p>
                <p className="text-gray-900 font-medium capitalize">{caso.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Fecha de Creacion</p>
                <div className="flex items-center space-x-2 text-gray-900">
                  <Calendar size={16} />
                  <span>{formatDate(caso.fechaCreacion)}</span>
                </div>
              </div>
              {caso.fechaVisita && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Fecha de Visita</p>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Calendar size={16} />
                    <span>{formatDate(caso.fechaVisita)}</span>
                  </div>
                </div>
              )}
              {caso.fechaResolucion && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Fecha de Resolucion</p>
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle size={16} />
                    <span>{formatDate(caso.fechaResolucion)}</span>
                  </div>
                </div>
              )}
              {caso.tiempoEstimado && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tiempo Estimado</p>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Clock size={16} />
                    <span>{caso.tiempoEstimado}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tecnico Asignado */}
          {caso.tecnicoAsignado && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tecnico Asignado</h2>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {caso.tecnicoAsignado.nombreCompleto.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{caso.tecnicoAsignado.nombreCompleto}</p>
                  <p className="text-sm text-gray-500">{caso.tecnicoAsignado.telefono}</p>
                </div>
              </div>
              {caso.tecnicoAsignado.email && (
                <p className="text-sm text-gray-600">{caso.tecnicoAsignado.email}</p>
              )}
            </div>
          )}

          {/* Satisfaccion del Cliente */}
          {caso.satisfaccionCliente && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Satisfaccion del Cliente</h2>
              <div className="flex items-center space-x-3">
                <div className="text-4xl font-bold text-blue-600">
                  {caso.satisfaccionCliente.toFixed(1)}
                </div>
                <div className="flex-1">
                  <div className="flex space-x-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-2xl ${
                          star <= caso.satisfaccionCliente!
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">de 5 estrellas</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
