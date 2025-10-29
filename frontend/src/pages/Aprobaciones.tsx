import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Clock,
  User,
  FileText,
  MessageSquare,
  Filter,
} from 'lucide-react';
import { aprobacionesApi } from '../services/api';

interface Aprobacion {
  id: string;
  tipoAprobacion: string;
  descripcion: string;
  costoEstimado: number | null;
  justificacion: string | null;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'solicitar_info';
  fechaSolicitud: string;
  fechaRespuesta: string | null;
  comentarios: string | null;
  caso: {
    numeroCaso: string;
    unidad: string;
    categoria: string;
    usuario: {
      nombreCompleto: string;
    };
    condominio: {
      nombre: string;
    };
    tecnicoAsignado: {
      nombreCompleto: string;
    } | null;
  };
}

export default function Aprobaciones() {
  const [aprobaciones, setAprobaciones] = useState<Aprobacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('pendiente');
  const [aprobacionSeleccionada, setAprobacionSeleccionada] = useState<Aprobacion | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accion, setAccion] = useState<'aprobar' | 'rechazar' | 'solicitar_info'>('aprobar');
  const [comentarios, setComentarios] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarAprobaciones();
  }, [filtroEstado]);

  const cargarAprobaciones = async () => {
    try {
      setLoading(true);
      // const response = await aprobacionesApi.obtenerTodas({ estado: filtroEstado });
      // setAprobaciones(response.data);
      setAprobaciones([]);
    } catch (error) {
      console.error('Error al cargar aprobaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccion = async () => {
    if (!aprobacionSeleccionada) return;

    try {
      setProcesando(true);

      switch (accion) {
        case 'aprobar':
          // await aprobacionesApi.aprobar(aprobacionSeleccionada.id, { comentarios });
          break;
        case 'rechazar':
          // await aprobacionesApi.rechazar(aprobacionSeleccionada.id, { motivo: comentarios });
          break;
        case 'solicitar_info':
          // await aprobacionesApi.solicitarInfo(aprobacionSeleccionada.id, { comentarios });
          break;
      }

      setModalAbierto(false);
      setComentarios('');
      setAprobacionSeleccionada(null);
      cargarAprobaciones();
    } catch (error) {
      console.error('Error al procesar acción:', error);
    } finally {
      setProcesando(false);
    }
  };

  const abrirModal = (aprobacion: Aprobacion, tipo: 'aprobar' | 'rechazar' | 'solicitar_info') => {
    setAprobacionSeleccionada(aprobacion);
    setAccion(tipo);
    setModalAbierto(true);
  };

  const obtenerColorEstado = (estado: string) => {
    const colores = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      aprobado: 'bg-green-100 text-green-800 border-green-300',
      rechazado: 'bg-red-100 text-red-800 border-red-300',
      solicitar_info: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colores[estado as keyof typeof colores] || colores.pendiente;
  };

  const obtenerTipoAprobacionLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      nueva_visita: 'Nueva Visita',
      materiales: 'Compra de Materiales',
      costo_extra: 'Costo Adicional',
      otro: 'Otro',
    };
    return labels[tipo] || tipo;
  };

  // Estadísticas
  const totalAprobaciones = aprobaciones.length;
  const pendientes = aprobaciones.filter((a) => a.estado === 'pendiente').length;
  const aprobadas = aprobaciones.filter((a) => a.estado === 'aprobado').length;
  const rechazadas = aprobaciones.filter((a) => a.estado === 'rechazado').length;
  const costoTotalEstimado = aprobaciones
    .filter((a) => a.estado === 'pendiente')
    .reduce((sum, a) => sum + (a.costoEstimado || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="text-blue-600" />
            Aprobaciones
          </h1>
          <p className="text-gray-600 mt-1">Gestión de solicitudes de aprobación</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalAprobaciones}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="text-gray-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pendientes}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aprobadas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{aprobadas}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rechazadas</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{rechazadas}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Costo Estimado</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                ${costoTotalEstimado.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-600" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobadas</option>
            <option value="rechazado">Rechazadas</option>
            <option value="solicitar_info">Requieren Info</option>
          </select>
        </div>
      </div>

      {/* Lista de aprobaciones */}
      <div className="space-y-4">
        {aprobaciones.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No hay aprobaciones para mostrar</p>
          </div>
        ) : (
          aprobaciones.map((aprobacion) => (
            <div key={aprobacion.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {obtenerTipoAprobacionLabel(aprobacion.tipoAprobacion)}
                    </h3>
                    <span className={`text-xs px-3 py-1 rounded-full border ${obtenerColorEstado(aprobacion.estado)}`}>
                      {aprobacion.estado}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    Caso: <span className="font-medium">{aprobacion.caso.numeroCaso}</span> -{' '}
                    {aprobacion.caso.condominio.nombre} - {aprobacion.caso.unidad}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Solicitado por:</p>
                      <p className="text-sm font-medium">
                        {aprobacion.caso.tecnicoAsignado?.nombreCompleto || 'N/A'}
                      </p>
                    </div>

                    {aprobacion.costoEstimado && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Costo Estimado:</p>
                        <p className="text-sm font-medium text-green-600">
                          ${aprobacion.costoEstimado.toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Descripción:</p>
                      <p className="text-sm text-gray-700">{aprobacion.descripcion}</p>
                    </div>

                    {aprobacion.justificacion && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Justificación:</p>
                        <p className="text-sm text-gray-700">{aprobacion.justificacion}</p>
                      </div>
                    )}

                    {aprobacion.comentarios && (
                      <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Comentarios:</p>
                        <p className="text-sm text-gray-700">{aprobacion.comentarios}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              {aprobacion.estado === 'pendiente' && (
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => abrirModal(aprobacion, 'aprobar')}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Aprobar
                  </button>
                  <button
                    onClick={() => abrirModal(aprobacion, 'rechazar')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Rechazar
                  </button>
                  <button
                    onClick={() => abrirModal(aprobacion, 'solicitar_info')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={18} />
                    Solicitar Info
                  </button>
                </div>
              )}

              {aprobacion.fechaRespuesta && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  Fecha de respuesta:{' '}
                  {new Date(aprobacion.fechaRespuesta).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalAbierto && aprobacionSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {accion === 'aprobar' && 'Aprobar Solicitud'}
              {accion === 'rechazar' && 'Rechazar Solicitud'}
              {accion === 'solicitar_info' && 'Solicitar Más Información'}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {accion === 'rechazar' ? 'Motivo del rechazo' : 'Comentarios (opcional)'}
              </label>
              <textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                rows={4}
                required={accion === 'rechazar'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  accion === 'rechazar'
                    ? 'Explica el motivo del rechazo...'
                    : 'Agrega comentarios adicionales...'
                }
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setModalAbierto(false);
                  setComentarios('');
                }}
                disabled={procesando}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAccion}
                disabled={procesando || (accion === 'rechazar' && !comentarios)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {procesando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
