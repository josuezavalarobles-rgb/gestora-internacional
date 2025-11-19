import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, DollarSign, TrendingDown, Shield, Plus } from 'lucide-react';
import { nominaAPI } from '../services/api';

interface Empleado {
  id: string;
  nombre: string;
  puesto: string;
  salarioBase: number;
  deducciones: {
    afp: number;
    ars: number;
    isr: number;
  };
  bonos: number;
  salarioNeto: number;
  estado: 'Procesado' | 'Pendiente' | 'Pagado';
}

export default function Nomina() {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2024-11');
  const queryClient = useQueryClient();

  // Cargar nómina desde el API
  const { data: empleados = [], isLoading, error } = useQuery({
    queryKey: ['nomina', periodoSeleccionado],
    queryFn: () => nominaAPI.obtenerTodas({ periodo: periodoSeleccionado }),
  });

  // Cargar estadísticas
  const { data: estadisticas } = useQuery({
    queryKey: ['nomina-estadisticas', periodoSeleccionado],
    queryFn: () => nominaAPI.obtenerEstadisticas({ periodo: periodoSeleccionado }),
  });

  // Mutación para aprobar nómina
  const aprobarMutation = useMutation({
    mutationFn: (id: string) => nominaAPI.aprobar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nomina'] });
      queryClient.invalidateQueries({ queryKey: ['nomina-estadisticas'] });
    },
  });

  // Mutación para pagar nómina
  const pagarMutation = useMutation({
    mutationFn: (id: string) => nominaAPI.pagar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nomina'] });
      queryClient.invalidateQueries({ queryKey: ['nomina-estadisticas'] });
    },
  });

  // Calcular totales
  const totalNominaMes = estadisticas?.totalNominaMes || empleados.reduce((sum: number, e: Empleado) => sum + e.salarioNeto, 0);
  const personalActivo = estadisticas?.personalActivo || empleados.length;
  const totalAFP = estadisticas?.totalAFP || empleados.reduce((sum: number, e: Empleado) => sum + e.deducciones.afp, 0);
  const totalARS = estadisticas?.totalARS || empleados.reduce((sum: number, e: Empleado) => sum + e.deducciones.ars, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      'Pagado': 'bg-green-600 text-white',
      'Procesado': 'bg-blue-600 text-white',
      'Pendiente': 'bg-yellow-600 text-white'
    };
    return colors[estado] || 'bg-gray-600 text-white';
  };

  const periodos = [
    { value: '2024-11', label: 'Noviembre 2024' },
    { value: '2024-10', label: 'Octubre 2024' },
    { value: '2024-09', label: 'Septiembre 2024' },
    { value: '2024-08', label: 'Agosto 2024' }
  ];

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Cargando nómina...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <Users size={64} className="mx-auto text-red-500 mb-4" />
          <p className="text-red-400 text-lg mb-2">Error al cargar nómina</p>
          <p className="text-gray-500 text-sm">{error instanceof Error ? error.message : 'Error desconocido'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Users className="text-green-400" size={40} />
          Gestión de Nómina
        </h1>
        <p className="text-gray-400 text-lg">
          Control de salarios y deducciones de ley según normativa dominicana
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-2xl p-6 glow-green">
          <div className="flex items-center justify-between mb-3">
            <div className="text-green-200 text-sm font-bold uppercase">Total Nómina Mes</div>
            <DollarSign className="text-green-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalNominaMes)}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6 glow-blue">
          <div className="flex items-center justify-between mb-3">
            <div className="text-blue-200 text-sm font-bold uppercase">Personal Activo</div>
            <Users className="text-blue-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{personalActivo}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-2xl p-6 glow-purple">
          <div className="flex items-center justify-between mb-3">
            <div className="text-purple-200 text-sm font-bold uppercase">AFP Total</div>
            <Shield className="text-purple-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalAFP)}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl shadow-2xl p-6 glow-orange">
          <div className="flex items-center justify-between mb-3">
            <div className="text-orange-200 text-sm font-bold uppercase">ARS Total</div>
            <TrendingDown className="text-orange-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalARS)}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-bold text-gray-200 uppercase tracking-wide">
              Periodo:
            </label>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              {periodos.map(periodo => (
                <option key={periodo.value} value={periodo.value}>{periodo.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all glow-green whitespace-nowrap">
              Procesar Nómina
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all glow-blue whitespace-nowrap">
              <Plus size={20} />
              Nuevo Empleado
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Nómina */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            Registro de Nómina ({empleados.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800 bg-opacity-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Puesto
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Salario Base
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Bonos
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Deducciones
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Neto a Pagar
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {empleados.map((empleado: Empleado) => {
                const totalDeducciones = empleado.deducciones.afp + empleado.deducciones.ars + empleado.deducciones.isr;
                return (
                  <tr key={empleado.id} className="hover:bg-slate-700 hover:bg-opacity-30 transition-all">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{empleado.nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{empleado.puesto}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-mono text-white">
                        {formatCurrency(empleado.salarioBase)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-mono text-green-400">
                        +{formatCurrency(empleado.bonos)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-mono text-red-400">
                        -{formatCurrency(totalDeducciones)}
                      </div>
                      <div className="text-xs text-gray-400 space-y-0.5 mt-1">
                        <div>AFP: {formatCurrency(empleado.deducciones.afp)}</div>
                        <div>ARS: {formatCurrency(empleado.deducciones.ars)}</div>
                        <div>ISR: {formatCurrency(empleado.deducciones.isr)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-lg font-bold text-white font-mono">
                        {formatCurrency(empleado.salarioNeto)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getEstadoBadgeColor(empleado.estado)}`}>
                        {empleado.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {empleado.estado === 'Pendiente' && (
                          <button className="px-3 py-1.5 bg-blue-600 bg-opacity-20 hover:bg-opacity-30 text-blue-400 rounded-lg transition-all text-sm font-medium">
                            Procesar
                          </button>
                        )}
                        {empleado.estado === 'Procesado' && (
                          <button className="px-3 py-1.5 bg-green-600 bg-opacity-20 hover:bg-opacity-30 text-green-400 rounded-lg transition-all text-sm font-medium">
                            Pagar
                          </button>
                        )}
                        <button className="px-3 py-1.5 bg-purple-600 bg-opacity-20 hover:bg-opacity-30 text-purple-400 rounded-lg transition-all text-sm font-medium">
                          Ver Recibo
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de Deducciones por Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="text-purple-400" size={20} />
            AFP (Fondo de Pensiones)
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Empleados:</span>
              <span className="text-white font-bold">{formatCurrency(totalAFP)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Porcentaje:</span>
              <span className="text-white font-bold">7.30%</span>
            </div>
            <div className="pt-2 border-t border-slate-700 text-xs text-gray-400">
              Aporte obligatorio según ley 87-01
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="text-orange-400" size={20} />
            ARS (Seguro de Salud)
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Empleados:</span>
              <span className="text-white font-bold">{formatCurrency(totalARS)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Porcentaje:</span>
              <span className="text-white font-bold">3.04%</span>
            </div>
            <div className="pt-2 border-t border-slate-700 text-xs text-gray-400">
              Seguro Familiar de Salud (SFS)
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="text-red-400" size={20} />
            ISR (Impuesto Sobre la Renta)
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Empleados:</span>
              <span className="text-white font-bold">
                {formatCurrency(empleados.reduce((sum: number, e: Empleado) => sum + e.deducciones.isr, 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Escala:</span>
              <span className="text-white font-bold">Progresiva</span>
            </div>
            <div className="pt-2 border-t border-slate-700 text-xs text-gray-400">
              Retención según escala DGII
            </div>
          </div>
        </div>
      </div>

      {/* Información Legal */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-950 bg-opacity-20 border border-blue-500 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
          <Shield size={20} />
          Normativa República Dominicana
        </h3>
        <div className="text-gray-300 space-y-2 text-sm">
          <p><strong>AFP (7.30%):</strong> Aporte obligatorio al sistema de pensiones según Ley 87-01</p>
          <p><strong>ARS (3.04%):</strong> Seguro Familiar de Salud, descontado del salario del empleado</p>
          <p><strong>ISR:</strong> Impuesto sobre la renta según escala progresiva de la DGII</p>
          <p className="text-yellow-400"><strong>Nota:</strong> El empleador también debe aportar 7.10% AFP y 7.09% ARS adicionales</p>
        </div>
      </div>
    </div>
  );
}
