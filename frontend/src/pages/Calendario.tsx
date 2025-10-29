import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, MapPin } from 'lucide-react';
import { casosApi } from '../services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Caso } from '../types';

export default function Calendario() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    cargarCasos();
  }, []);

  const cargarCasos = async () => {
    try {
      setLoading(true);
      const casosData = await casosApi.getAll();
      // Filtrar solo casos con visitas programadas
      const casosConVisita = casosData.filter(caso => caso.fechaVisita);
      setCasos(casosConVisita);
    } catch (error) {
      console.error('Error al cargar casos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarMes = (direccion: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direccion === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const obtenerVisitasDelDia = (fecha: Date) => {
    return casos.filter(caso => {
      if (!caso.fechaVisita) return false;
      return isSameDay(new Date(caso.fechaVisita), fecha);
    });
  };

  const visitasDelDiaSeleccionado = selectedDate ? obtenerVisitasDelDia(selectedDate) : [];

  // Generar dias del mes
  const primerDiaDelMes = startOfMonth(currentDate);
  const ultimoDiaDelMes = endOfMonth(currentDate);
  const diasDelMes = eachDayOfInterval({ start: primerDiaDelMes, end: ultimoDiaDelMes });

  // Obtener el dia de la semana del primer dia (0 = domingo)
  const primerDiaSemana = primerDiaDelMes.getDay();

  // Crear array con dias vacios para completar la primera semana
  const diasVacios = Array(primerDiaSemana).fill(null);

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
            <CalendarIcon className="text-blue-600" />
            Calendario de Visitas
          </h1>
          <p className="text-gray-600 mt-1">
            Visualiza y gestiona las visitas programadas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Visitas Programadas</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{casos.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Visitas Hoy</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {casos.filter(c => c.fechaVisita && isSameDay(new Date(c.fechaVisita), new Date())).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Visitas Este Mes</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {casos.filter(c => {
                  if (!c.fechaVisita) return false;
                  const fechaVisita = new Date(c.fechaVisita);
                  return fechaVisita.getMonth() === currentDate.getMonth() &&
                         fechaVisita.getFullYear() === currentDate.getFullYear();
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Header del Calendario */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => cambiarMes('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={() => cambiarMes('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Dias de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(dia => (
              <div key={dia} className="text-center text-sm font-medium text-gray-600 py-2">
                {dia}
              </div>
            ))}
          </div>

          {/* Dias del mes */}
          <div className="grid grid-cols-7 gap-2">
            {diasVacios.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            {diasDelMes.map((dia) => {
              const visitasDelDia = obtenerVisitasDelDia(dia);
              const esHoy = isToday(dia);
              const esDiaSeleccionado = selectedDate && isSameDay(dia, selectedDate);

              return (
                <button
                  key={dia.toISOString()}
                  onClick={() => setSelectedDate(dia)}
                  className={`aspect-square p-2 rounded-lg border transition-all ${
                    esHoy
                      ? 'border-blue-500 bg-blue-50 font-bold'
                      : esDiaSeleccionado
                      ? 'border-blue-500 bg-blue-100'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={`text-sm ${esHoy ? 'text-blue-700' : 'text-gray-900'}`}>
                      {format(dia, 'd')}
                    </span>
                    {visitasDelDia.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        {visitasDelDia.length > 1 && (
                          <span className="text-xs text-blue-600 font-medium">
                            +{visitasDelDia.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Visitas del Dia */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedDate
              ? format(selectedDate, "d 'de' MMMM", { locale: es })
              : 'Selecciona un dia'}
          </h3>

          {!selectedDate ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Haz clic en un dia del calendario para ver las visitas programadas
            </p>
          ) : visitasDelDiaSeleccionado.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No hay visitas programadas para este dia
            </p>
          ) : (
            <div className="space-y-3">
              {visitasDelDiaSeleccionado.map((caso) => (
                <div
                  key={caso.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {caso.numeroCaso}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      caso.prioridad === 'urgente'
                        ? 'bg-red-100 text-red-700'
                        : caso.prioridad === 'alta'
                        ? 'bg-orange-100 text-orange-700'
                        : caso.prioridad === 'media'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {caso.prioridad}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-900 mb-2">
                    {caso.categoria}
                  </p>

                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{caso.condominio.nombre} - {caso.unidad}</span>
                    </div>
                    {caso.tecnicoAsignado && (
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        <span>{caso.tecnicoAsignado.nombreCompleto}</span>
                      </div>
                    )}
                    {caso.fechaVisita && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{format(new Date(caso.fechaVisita), 'HH:mm')}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {caso.descripcion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Proximas Visitas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Proximas Visitas (7 dias)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicacion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tecnico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {casos
                .filter(caso => {
                  if (!caso.fechaVisita) return false;
                  const fechaVisita = new Date(caso.fechaVisita);
                  const hoy = new Date();
                  const diasDiferencia = Math.ceil((fechaVisita.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                  return diasDiferencia >= 0 && diasDiferencia <= 7;
                })
                .sort((a, b) => new Date(a.fechaVisita!).getTime() - new Date(b.fechaVisita!).getTime())
                .slice(0, 10)
                .map((caso) => (
                  <tr key={caso.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-blue-600">{caso.numeroCaso}</p>
                        <p className="text-xs text-gray-500">{caso.categoria}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(new Date(caso.fechaVisita!), "dd 'de' MMM", { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(new Date(caso.fechaVisita!), 'HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{caso.condominio.nombre}</p>
                        <p className="text-gray-500">Unidad {caso.unidad}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {caso.tecnicoAsignado?.nombreCompleto || 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        caso.estado === 'en_visita'
                          ? 'bg-blue-100 text-blue-800'
                          : caso.estado === 'asignado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {caso.estado}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
