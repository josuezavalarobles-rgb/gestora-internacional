import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Users,
} from 'lucide-react';
import { citasApi } from '../services/api';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface Cita {
  id: string;
  fecha: string;
  estado: 'pendiente' | 'confirmada_propietario' | 'confirmada_ingenieria' | 'completada' | 'no_realizada' | 'cancelada';
  propietarioConfirmo: boolean;
  ingenieriaConfirmo: boolean;
  bloqueHorario: {
    horaInicio: string;
    horaFin: string;
    diaSemana: string;
  };
  caso: {
    numeroCaso: string;
    unidad: string;
    categoria: string;
    usuario: {
      nombreCompleto: string;
      telefono: string;
    };
    condominio: {
      nombre: string;
    };
    tecnicoAsignado?: {
      nombreCompleto: string;
    };
  };
  tecnicoId?: string;
  notas?: string;
}

interface BloqueDisponibilidad {
  id: string;
  horaInicio: string;
  horaFin: string;
  disponibles: number;
  ocupados: number;
  capacidad: number;
  disponible: boolean;
}

export default function CalendarioCitas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [disponibilidad, setDisponibilidad] = useState<BloqueDisponibilidad[]>([]);
  const [vistaDetalle, setVistaDetalle] = useState(false);

  useEffect(() => {
    cargarCitasDelMes();
  }, [currentDate]);

  useEffect(() => {
    if (selectedDate) {
      cargarDisponibilidadDelDia(selectedDate);
    }
  }, [selectedDate]);

  const cargarCitasDelMes = async () => {
    try {
      setLoading(true);
      const inicio = startOfMonth(currentDate);
      const fin = endOfMonth(currentDate);

      // Simulación de API - reemplazar con llamada real
      // const response = await citasApi.obtenerCitasPorRango(inicio, fin);
      const response: Cita[] = [];
      setCitas(response);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDisponibilidadDelDia = async (fecha: Date) => {
    try {
      const fechaStr = format(fecha, 'yyyy-MM-dd');
      // const response = await citasApi.obtenerDisponibilidad(fechaStr);
      // setDisponibilidad(response.data || []);
      setDisponibilidad([]);
    } catch (error) {
      console.error('Error al cargar disponibilidad:', error);
    }
  };

  const cambiarMes = (direccion: 'prev' | 'next') => {
    if (direccion === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const obtenerCitasDelDia = (fecha: Date) => {
    return citas.filter((cita) => isSameDay(new Date(cita.fecha), fecha));
  };

  const obtenerColorEstado = (estado: Cita['estado']) => {
    const colores = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmada_propietario: 'bg-blue-100 text-blue-800 border-blue-300',
      confirmada_ingenieria: 'bg-green-100 text-green-800 border-green-300',
      completada: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      no_realizada: 'bg-red-100 text-red-800 border-red-300',
      cancelada: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colores[estado] || colores.pendiente;
  };

  const obtenerIconoEstado = (estado: Cita['estado']) => {
    switch (estado) {
      case 'completada':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelada':
      case 'no_realizada':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const citasDelDiaSeleccionado = selectedDate ? obtenerCitasDelDia(selectedDate) : [];
  const citasFiltradas = citasDelDiaSeleccionado.filter(
    (cita) => filtroEstado === 'todos' || cita.estado === filtroEstado
  );

  // Generar calendario
  const primerDiaDelMes = startOfMonth(currentDate);
  const ultimoDiaDelMes = endOfMonth(currentDate);
  const inicioDeSemana = startOfWeek(primerDiaDelMes, { weekStartsOn: 0 });
  const finDeSemana = endOfWeek(ultimoDiaDelMes, { weekStartsOn: 0 });

  const todasLasFechas = eachDayOfInterval({ start: inicioDeSemana, end: finDeSemana });

  // Estadísticas
  const totalCitas = citas.length;
  const citasPendientes = citas.filter((c) => c.estado === 'pendiente').length;
  const citasConfirmadas = citas.filter(
    (c) => c.estado === 'confirmada_propietario' || c.estado === 'confirmada_ingenieria'
  ).length;
  const citasCompletadas = citas.filter((c) => c.estado === 'completada').length;

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
            Calendario de Citas
          </h1>
          <p className="text-gray-600 mt-1">Gestión de citas y visitas técnicas</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Citas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalCitas}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="text-gray-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{citasPendientes}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmadas</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{citasConfirmadas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{citasCompletadas}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header del calendario */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button
                onClick={() => cambiarMes('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <h2 className="text-lg font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h2>

              <button
                onClick={() => cambiarMes('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => (
                <div key={dia} className="p-2 text-center text-sm font-medium text-gray-600">
                  {dia}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7">
              {todasLasFechas.map((fecha, index) => {
                const citasDelDia = obtenerCitasDelDia(fecha);
                const esDiaActual = isToday(fecha);
                const esMesActual = fecha.getMonth() === currentDate.getMonth();
                const estaSeleccionado = selectedDate && isSameDay(fecha, selectedDate);

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(fecha)}
                    className={`
                      min-h-[100px] p-2 border-b border-r border-gray-200 text-left hover:bg-gray-50 transition-colors relative
                      ${!esMesActual ? 'bg-gray-50 text-gray-400' : ''}
                      ${estaSeleccionado ? 'bg-blue-50 ring-2 ring-blue-500' : ''}
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <span
                        className={`
                        text-sm font-medium
                        ${esDiaActual ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                      `}
                      >
                        {format(fecha, 'd')}
                      </span>

                      {citasDelDia.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {citasDelDia.slice(0, 2).map((cita, i) => (
                            <div
                              key={i}
                              className={`text-xs px-1 py-0.5 rounded truncate ${obtenerColorEstado(
                                cita.estado
                              )}`}
                            >
                              {cita.bloqueHorario.horaInicio} - {cita.caso.unidad}
                            </div>
                          ))}
                          {citasDelDia.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{citasDelDia.length - 2} más
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel lateral - Detalle del día */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : 'Selecciona un día'}
            </h3>

            {selectedDate && (
              <>
                {/* Filtro */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Filtrar por estado</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada_propietario">Confirmada (Propietario)</option>
                    <option value="confirmada_ingenieria">Confirmada (Ingeniería)</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                {/* Lista de citas */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {citasFiltradas.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">
                      No hay citas para este día
                    </p>
                  ) : (
                    citasFiltradas.map((cita) => (
                      <div
                        key={cita.id}
                        className={`border rounded-lg p-3 ${obtenerColorEstado(cita.estado)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {obtenerIconoEstado(cita.estado)}
                            <span className="font-semibold text-sm">{cita.caso.numeroCaso}</span>
                          </div>
                          <span className="text-xs">
                            {cita.bloqueHorario.horaInicio}-{cita.bloqueHorario.horaFin}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span>{cita.caso.usuario.nombreCompleto}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            <span>
                              {cita.caso.condominio.nombre} - {cita.caso.unidad}
                            </span>
                          </div>
                          {cita.caso.tecnicoAsignado && (
                            <div className="flex items-center gap-1">
                              <Users size={12} />
                              <span>{cita.caso.tecnicoAsignado.nombreCompleto}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 pt-2 border-t border-current/20 flex gap-2">
                          <button className="flex-1 text-xs py-1 bg-white/50 hover:bg-white/80 rounded transition-colors">
                            Ver detalle
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Disponibilidad del día */}
                {disponibilidad.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Disponibilidad
                    </h4>
                    <div className="space-y-2">
                      {disponibilidad.map((bloque) => (
                        <div
                          key={bloque.id}
                          className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                        >
                          <span>
                            {bloque.horaInicio} - {bloque.horaFin}
                          </span>
                          <span className={bloque.disponible ? 'text-green-600' : 'text-red-600'}>
                            {bloque.disponibles}/{bloque.capacidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
