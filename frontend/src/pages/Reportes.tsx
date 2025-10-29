import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle2, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { casosApi } from '../services/api';
import { format, subDays } from 'date-fns';
import type { Caso } from '../types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [fechaInicio, setFechaInicio] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    cargarReportes();
  }, [fechaInicio, fechaFin]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const casosData = await casosApi.getAll();

      // Filtrar casos por fecha
      const casosFiltrados = casosData.filter(caso => {
        const fechaCaso = new Date(caso.fechaCreacion);
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        return fechaCaso >= inicio && fechaCaso <= fin;
      });

      setCasos(casosFiltrados);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadisticas
  const totalCasos = casos.length;
  const casosResueltos = casos.filter(c => c.estado === 'resuelto' || c.estado === 'cerrado').length;
  const casosEnProceso = casos.filter(c => c.estado === 'en_proceso' || c.estado === 'en_visita').length;
  const tasaResolucion = totalCasos > 0 ? ((casosResueltos / totalCasos) * 100).toFixed(1) : '0';

  // Calcular tiempo promedio de resolucion
  const casosConResolucion = casos.filter(c => c.fechaResolucion);
  const tiempoPromedio = casosConResolucion.length > 0
    ? casosConResolucion.reduce((acc, caso) => {
        const inicio = new Date(caso.fechaCreacion).getTime();
        const fin = new Date(caso.fechaResolucion!).getTime();
        return acc + (fin - inicio) / (1000 * 60 * 60 * 24); // dias
      }, 0) / casosConResolucion.length
    : 0;

  // Casos por estado
  const casosPorEstado = [
    { name: 'Nuevo', value: casos.filter(c => c.estado === 'nuevo').length },
    { name: 'Asignado', value: casos.filter(c => c.estado === 'asignado').length },
    { name: 'En Proceso', value: casos.filter(c => c.estado === 'en_proceso').length },
    { name: 'En Visita', value: casos.filter(c => c.estado === 'en_visita').length },
    { name: 'Resuelto', value: casos.filter(c => c.estado === 'resuelto').length },
    { name: 'Cerrado', value: casos.filter(c => c.estado === 'cerrado').length },
  ].filter(item => item.value > 0);

  // Casos por prioridad
  const casosPorPrioridad = [
    { name: 'Baja', value: casos.filter(c => c.prioridad === 'baja').length, fill: '#10B981' },
    { name: 'Media', value: casos.filter(c => c.prioridad === 'media').length, fill: '#F59E0B' },
    { name: 'Alta', value: casos.filter(c => c.prioridad === 'alta').length, fill: '#EF4444' },
    { name: 'Urgente', value: casos.filter(c => c.prioridad === 'urgente').length, fill: '#DC2626' },
  ].filter(item => item.value > 0);

  // Casos por dia
  const casosPorDia: { [key: string]: number } = {};
  casos.forEach(caso => {
    const fecha = format(new Date(caso.fechaCreacion), 'dd/MM');
    casosPorDia[fecha] = (casosPorDia[fecha] || 0) + 1;
  });
  const dataCasosPorDia = Object.entries(casosPorDia).map(([fecha, cantidad]) => ({
    fecha,
    cantidad
  }));

  // Casos por tecnico
  const casosPorTecnico: { [key: string]: number } = {};
  casos.forEach(caso => {
    if (caso.tecnicoAsignado) {
      const nombre = caso.tecnicoAsignado.nombreCompleto;
      casosPorTecnico[nombre] = (casosPorTecnico[nombre] || 0) + 1;
    }
  });
  const dataCasosPorTecnico = Object.entries(casosPorTecnico)
    .map(([tecnico, cantidad]) => ({ tecnico, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

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
            <BarChart3 className="text-blue-600" />
            Reportes y Estadisticas
          </h1>
          <p className="text-gray-600 mt-1">
            Analisis y metricas del sistema de casos
          </p>
        </div>
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Calendar className="text-gray-400" size={20} />
          <div className="flex items-center gap-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={cargarReportes}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Casos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalCasos}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Proceso</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{casosEnProceso}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resueltos</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{casosResueltos}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tiempo Promedio</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{tiempoPromedio.toFixed(1)}</p>
              <p className="text-xs text-gray-500">dias</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Graficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Casos por Dia */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Casos por Dia</h3>
          {dataCasosPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dataCasosPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Casos"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No hay datos disponibles</p>
          )}
        </div>

        {/* Casos por Estado */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Casos por Estado</h3>
          {casosPorEstado.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={casosPorEstado}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {casosPorEstado.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No hay datos disponibles</p>
          )}
        </div>

        {/* Casos por Prioridad */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Casos por Prioridad</h3>
          {casosPorPrioridad.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={casosPorPrioridad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Casos">
                  {casosPorPrioridad.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No hay datos disponibles</p>
          )}
        </div>

        {/* Casos por Tecnico */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Casos por Tecnico (Top 10)</h3>
          {dataCasosPorTecnico.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataCasosPorTecnico} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="tecnico" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad" fill="#3B82F6" name="Casos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No hay datos disponibles</p>
          )}
        </div>
      </div>

      {/* Metricas Adicionales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metricas de Rendimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">Tasa de Resolucion</p>
            <p className="text-4xl font-bold text-blue-900 mt-2">{tasaResolucion}%</p>
            <p className="text-xs text-blue-600 mt-1">del total de casos</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-sm text-green-700 font-medium">Casos Nuevos</p>
            <p className="text-4xl font-bold text-green-900 mt-2">
              {casos.filter(c => c.estado === 'nuevo').length}
            </p>
            <p className="text-xs text-green-600 mt-1">pendientes de asignacion</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-sm text-purple-700 font-medium">Satisfaccion Promedio</p>
            <p className="text-4xl font-bold text-purple-900 mt-2">
              {casos.filter(c => c.satisfaccionCliente).length > 0
                ? (casos.reduce((acc, c) => acc + (c.satisfaccionCliente || 0), 0) /
                   casos.filter(c => c.satisfaccionCliente).length).toFixed(1)
                : 'N/A'}
            </p>
            <p className="text-xs text-purple-600 mt-1">de 5 estrellas</p>
          </div>
        </div>
      </div>

      {/* Tabla de Casos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Casos en el Periodo Seleccionado</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numero</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tecnico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {casos.slice(0, 20).map((caso) => (
                <tr key={caso.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{caso.numeroCaso}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      caso.estado === 'resuelto' || caso.estado === 'cerrado'
                        ? 'bg-green-100 text-green-800'
                        : caso.estado === 'en_proceso'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {caso.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      caso.prioridad === 'urgente'
                        ? 'bg-red-100 text-red-800'
                        : caso.prioridad === 'alta'
                        ? 'bg-orange-100 text-orange-800'
                        : caso.prioridad === 'media'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {caso.prioridad}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{caso.categoria}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {caso.tecnicoAsignado?.nombreCompleto || 'Sin asignar'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(caso.fechaCreacion), 'dd/MM/yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {casos.length > 20 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
            Mostrando 20 de {casos.length} casos totales
          </div>
        )}
      </div>
    </div>
  );
}
