import { useState } from 'react';
import { Home, Plus, Calendar as CalendarIcon, DollarSign, CheckCircle, Clock } from 'lucide-react';

interface AreaComun {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  costo: number;
  estado: 'Disponible' | 'Ocupada' | 'Mantenimiento';
}

interface Reserva {
  id: string;
  area: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  unidad: string;
  estado: 'Confirmada' | 'Pendiente' | 'Cancelada';
}

export default function AreasComunes() {
  const [vistaActual, setVistaActual] = useState<'areas' | 'calendario'>('areas');

  // Datos mock de áreas comunes
  const [areasComunes] = useState<AreaComun[]>([
    {
      id: '1',
      nombre: 'Salón de Eventos',
      tipo: 'Eventos',
      capacidad: 100,
      costo: 5000,
      estado: 'Disponible'
    },
    {
      id: '2',
      nombre: 'Piscina Principal',
      tipo: 'Recreación',
      capacidad: 50,
      costo: 0,
      estado: 'Disponible'
    },
    {
      id: '3',
      nombre: 'Gimnasio',
      tipo: 'Deportivo',
      capacidad: 20,
      costo: 0,
      estado: 'Disponible'
    },
    {
      id: '4',
      nombre: 'Cancha de Tenis',
      tipo: 'Deportivo',
      capacidad: 4,
      costo: 500,
      estado: 'Ocupada'
    },
    {
      id: '5',
      nombre: 'Área BBQ',
      tipo: 'Recreación',
      capacidad: 30,
      costo: 2000,
      estado: 'Disponible'
    },
    {
      id: '6',
      nombre: 'Salón Infantil',
      tipo: 'Eventos',
      capacidad: 50,
      costo: 3000,
      estado: 'Mantenimiento'
    }
  ]);

  // Calcular estadísticas
  const totalAreas = areasComunes.length;
  const areasDisponibles = areasComunes.filter((a: AreaComun) => a.estado === 'Disponible').length;
  const reservasDelMes = 0; // Se calculará desde el API
  const ingresosReservas = 0; // Se calculará desde el API

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      'Disponible': 'bg-green-600 text-white',
      'Ocupada': 'bg-yellow-600 text-white',
      'Mantenimiento': 'bg-red-600 text-white',
      'Confirmada': 'bg-green-600 text-white',
      'Pendiente': 'bg-yellow-600 text-white',
      'Cancelada': 'bg-red-600 text-white'
    };
    return colors[estado] || 'bg-gray-600 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Home className="text-blue-600" size={36} />
          Áreas Comunes y Reservas
        </h1>
        <p className="text-gray-600">
          Gestión de espacios compartidos y sistema de reservaciones
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-xl shadow-2xl p-6 glow-cyan">
          <div className="flex items-center justify-between mb-3">
            <div className="text-cyan-200 text-sm font-bold uppercase">Total Áreas</div>
            <Home className="text-cyan-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{totalAreas}</div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-2xl p-6 glow-green">
          <div className="flex items-center justify-between mb-3">
            <div className="text-green-200 text-sm font-bold uppercase">Disponibles</div>
            <CheckCircle className="text-green-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{areasDisponibles}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-2xl p-6 glow-purple">
          <div className="flex items-center justify-between mb-3">
            <div className="text-purple-200 text-sm font-bold uppercase">Reservas del Mes</div>
            <CalendarIcon className="text-purple-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{reservasDelMes}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6 glow-blue">
          <div className="flex items-center justify-between mb-3">
            <div className="text-blue-200 text-sm font-bold uppercase">Ingresos Reservas</div>
            <DollarSign className="text-blue-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(ingresosReservas)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => setVistaActual('areas')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            vistaActual === 'areas'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Áreas Comunes
        </button>
        <button
          onClick={() => setVistaActual('calendario')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            vistaActual === 'calendario'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Calendario de Reservas
        </button>
      </div>

      {/* Vista de Áreas Comunes */}
      {vistaActual === 'areas' && (
        <>
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition-all">
              <Plus size={20} />
              Nueva Área
            </button>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Catálogo de Áreas Comunes ({areasComunes.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Capacidad
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Costo por Reserva
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
                  {areasComunes.map((area: AreaComun) => (
                    <tr key={area.id} className="hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{area.nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow bg-blue-600 text-white">
                          {area.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-700">{area.capacidad} personas</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gray-900 font-mono">
                          {area.costo === 0 ? 'Gratis' : formatCurrency(area.costo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow ${getEstadoBadgeColor(area.estado)}`}>
                          {area.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-all text-sm font-medium">
                            Reservar
                          </button>
                          <button className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-all text-sm font-medium">
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Vista de Calendario de Reservas */}
      {vistaActual === 'calendario' && (
        <>
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition-all">
              <Plus size={20} />
              Nueva Reserva
            </button>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Calendario de Reservas (0)
              </h2>
            </div>

            <div className="p-12 text-center">
              <CalendarIcon size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg mb-2">No hay reservas disponibles</p>
              <p className="text-gray-500 text-sm">
                Las reservas aparecerán aquí una vez estén disponibles desde el backend
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
