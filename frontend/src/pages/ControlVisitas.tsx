import { useState } from 'react';
import { UserCheck, Search, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

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

  // Datos mock de visitas
  const [visitas] = useState<Visita[]>([
    {
      id: '1',
      visitante: 'Carlos Rodríguez',
      cedula: '001-1234567-8',
      unidad: 'Apto 101',
      tipo: 'Invitado',
      horaLlegada: '10:30 AM',
      estado: 'En Espera',
      motivo: 'Visita familiar'
    },
    {
      id: '2',
      visitante: 'María González',
      cedula: '001-9876543-2',
      unidad: 'Apto 202',
      tipo: 'Invitado',
      horaLlegada: '11:15 AM',
      estado: 'En Espera',
      motivo: 'Reunión social'
    },
    {
      id: '3',
      visitante: 'Plomería Express',
      cedula: '131-55667-7',
      unidad: 'Apto 305',
      tipo: 'Proveedor',
      horaLlegada: '09:00 AM',
      estado: 'Dentro',
      motivo: 'Reparación de tubería'
    },
    {
      id: '4',
      visitante: 'Juan Delivery',
      cedula: '001-4567890-1',
      unidad: 'Apto 101',
      tipo: 'Delivery',
      horaLlegada: '12:45 PM',
      horaSalida: '12:55 PM',
      estado: 'Salió',
      motivo: 'Entrega de paquete'
    },
    {
      id: '5',
      visitante: 'Ana Martínez',
      cedula: '001-2345678-9',
      unidad: 'Apto 405',
      tipo: 'Invitado',
      horaLlegada: '08:30 AM',
      horaSalida: '10:00 AM',
      estado: 'Salió',
      motivo: 'Visita de cortesía'
    },
    {
      id: '6',
      visitante: 'Pedro López',
      cedula: '001-5678901-2',
      unidad: 'Apto 201',
      tipo: 'Invitado',
      horaLlegada: '02:00 PM',
      estado: 'Rechazada',
      motivo: 'No autorizado'
    }
  ]);

  // Calcular estadísticas
  const visitasHoy = visitas.length;
  const enEspera = visitas.filter((v: Visita) => v.estado === 'En Espera').length;
  const autorizadas = visitas.filter((v: Visita) => v.estado === 'Autorizada' || v.estado === 'Dentro').length;
  const rechazadas = visitas.filter((v: Visita) => v.estado === 'Rechazada').length;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <UserCheck className="text-blue-600" size={36} />
          Control de Visitas
        </h1>
        <p className="text-gray-600">
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
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Visitante
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por cédula, nombre o unidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <AlertTriangle className="text-yellow-600" size={28} />
              Visitas Pendientes de Autorización
              <span className="bg-yellow-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
                {enEspera}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitas.filter((v: Visita) => v.estado === 'En Espera').map((visita: Visita) => (
              <div key={visita.id} className="bg-white rounded-lg p-4 border border-yellow-400 shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-gray-900 font-bold">{visita.visitante}</h3>
                    <p className="text-sm text-gray-600 font-mono">{visita.cedula}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getTipoBadgeColor(visita.tipo)}`}>
                    {visita.tipo}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700 mb-3">
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
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Registro de Visitas ({visitasFiltradas.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Visitante
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Unidad
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Hora Llegada
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visitasFiltradas.map((visita: Visita) => (
                <tr key={visita.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{visita.visitante}</div>
                      <div className="text-xs text-gray-600 font-mono">{visita.cedula}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{visita.unidad}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow ${getTipoBadgeColor(visita.tipo)}`}>
                      {visita.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      <div>Llegada: {visita.horaLlegada}</div>
                      {visita.horaSalida && (
                        <div className="text-xs">Salida: {visita.horaSalida}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{visita.motivo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow ${getEstadoBadgeColor(visita.estado)}`}>
                      {visita.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {visita.estado === 'En Espera' && (
                        <>
                          <button className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-all text-sm font-medium">
                            Autorizar
                          </button>
                          <button className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-all text-sm font-medium">
                            Rechazar
                          </button>
                        </>
                      )}
                      {visita.estado === 'Dentro' && (
                        <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-all text-sm font-medium">
                          Registrar Salida
                        </button>
                      )}
                      {(visita.estado === 'Salió' || visita.estado === 'Rechazada') && (
                        <button className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-all text-sm font-medium">
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
            <UserCheck size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No se encontraron visitas</p>
            <p className="text-gray-500 text-sm">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
