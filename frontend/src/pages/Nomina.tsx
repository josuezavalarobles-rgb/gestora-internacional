import { useState } from 'react';
import { Users, DollarSign, TrendingDown, Shield, Plus } from 'lucide-react';

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

  // Datos mock de empleados
  const [empleados] = useState<Empleado[]>([
    {
      id: '1',
      nombre: 'Juan Pérez García',
      puesto: 'Administrador',
      salarioBase: 45000,
      deducciones: {
        afp: 3285,
        ars: 1368,
        isr: 2500
      },
      bonos: 5000,
      salarioNeto: 42847,
      estado: 'Pagado'
    },
    {
      id: '2',
      nombre: 'María Rodríguez López',
      puesto: 'Conserje',
      salarioBase: 25000,
      deducciones: {
        afp: 1825,
        ars: 760,
        isr: 800
      },
      bonos: 2000,
      salarioNeto: 23615,
      estado: 'Procesado'
    },
    {
      id: '3',
      nombre: 'Carlos Martínez Santos',
      puesto: 'Personal de Seguridad',
      salarioBase: 30000,
      deducciones: {
        afp: 2190,
        ars: 912,
        isr: 1200
      },
      bonos: 0,
      salarioNeto: 25698,
      estado: 'Procesado'
    },
    {
      id: '4',
      nombre: 'Ana González Díaz',
      puesto: 'Personal de Limpieza',
      salarioBase: 22000,
      deducciones: {
        afp: 1606,
        ars: 669,
        isr: 600
      },
      bonos: 1000,
      salarioNeto: 20125,
      estado: 'Pendiente'
    },
    {
      id: '5',
      nombre: 'Luis Fernando Torres',
      puesto: 'Mantenimiento',
      salarioBase: 28000,
      deducciones: {
        afp: 2044,
        ars: 851,
        isr: 1000
      },
      bonos: 1500,
      salarioNeto: 25605,
      estado: 'Pendiente'
    }
  ]);

  // Calcular totales
  const totalNominaMes = empleados.reduce((sum: number, e: Empleado) => sum + e.salarioNeto, 0);
  const personalActivo = empleados.length;
  const totalAFP = empleados.reduce((sum: number, e: Empleado) => sum + e.deducciones.afp, 0);
  const totalARS = empleados.reduce((sum: number, e: Empleado) => sum + e.deducciones.ars, 0);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Users className="text-green-600" size={36} />
          Gestión de Nómina
        </h1>
        <p className="text-gray-600">
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
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Periodo:
            </label>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              {periodos.map(periodo => (
                <option key={periodo.value} value={periodo.value}>{periodo.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow transition-all whitespace-nowrap">
              Procesar Nómina
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition-all whitespace-nowrap">
              <Plus size={20} />
              Nuevo Empleado
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Nómina */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Registro de Nómina ({empleados.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Puesto
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Salario Base
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Bonos
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Deducciones
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Neto a Pagar
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
              {empleados.map((empleado: Empleado) => {
                const totalDeducciones = empleado.deducciones.afp + empleado.deducciones.ars + empleado.deducciones.isr;
                return (
                  <tr key={empleado.id} className="hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{empleado.nombre}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{empleado.puesto}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-mono text-gray-900">
                        {formatCurrency(empleado.salarioBase)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-mono text-green-600">
                        +{formatCurrency(empleado.bonos)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-mono text-red-600">
                        -{formatCurrency(totalDeducciones)}
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5 mt-1">
                        <div>AFP: {formatCurrency(empleado.deducciones.afp)}</div>
                        <div>ARS: {formatCurrency(empleado.deducciones.ars)}</div>
                        <div>ISR: {formatCurrency(empleado.deducciones.isr)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-lg font-bold text-gray-900 font-mono">
                        {formatCurrency(empleado.salarioNeto)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow ${getEstadoBadgeColor(empleado.estado)}`}>
                        {empleado.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {empleado.estado === 'Pendiente' && (
                          <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-all text-sm font-medium">
                            Procesar
                          </button>
                        )}
                        {empleado.estado === 'Procesado' && (
                          <button className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-all text-sm font-medium">
                            Pagar
                          </button>
                        )}
                        <button className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-all text-sm font-medium">
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
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="text-purple-600" size={20} />
            AFP (Fondo de Pensiones)
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Empleados:</span>
              <span className="text-gray-900 font-bold">{formatCurrency(totalAFP)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Porcentaje:</span>
              <span className="text-gray-900 font-bold">7.30%</span>
            </div>
            <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
              Aporte obligatorio según ley 87-01
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="text-orange-600" size={20} />
            ARS (Seguro de Salud)
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Empleados:</span>
              <span className="text-gray-900 font-bold">{formatCurrency(totalARS)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Porcentaje:</span>
              <span className="text-gray-900 font-bold">3.04%</span>
            </div>
            <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
              Seguro Familiar de Salud (SFS)
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="text-red-600" size={20} />
            ISR (Impuesto Sobre la Renta)
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Empleados:</span>
              <span className="text-gray-900 font-bold">
                {formatCurrency(empleados.reduce((sum: number, e: Empleado) => sum + e.deducciones.isr, 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Escala:</span>
              <span className="text-gray-900 font-bold">Progresiva</span>
            </div>
            <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
              Retención según escala DGII
            </div>
          </div>
        </div>
      </div>

      {/* Información Legal */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Shield size={20} />
          Normativa República Dominicana
        </h3>
        <div className="text-gray-700 space-y-2 text-sm">
          <p><strong>AFP (7.30%):</strong> Aporte obligatorio al sistema de pensiones según Ley 87-01</p>
          <p><strong>ARS (3.04%):</strong> Seguro Familiar de Salud, descontado del salario del empleado</p>
          <p><strong>ISR:</strong> Impuesto sobre la renta según escala progresiva de la DGII</p>
          <p className="text-yellow-700"><strong>Nota:</strong> El empleador también debe aportar 7.10% AFP y 7.09% ARS adicionales</p>
        </div>
      </div>
    </div>
  );
}
