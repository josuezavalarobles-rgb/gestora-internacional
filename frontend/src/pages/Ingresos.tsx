import { useState } from 'react';
import { TrendingUp, Plus, DollarSign, CheckCircle, Clock, FileText } from 'lucide-react';

interface Ingreso {
  id: string;
  fecha: string;
  concepto: string;
  unidad: string;
  monto: number;
  estado: 'Cobrado' | 'Pendiente' | 'Vencido';
  recibo: string;
}

export default function Ingresos() {
  // Datos mock de ingresos
  const [ingresos] = useState<Ingreso[]>([
    {
      id: '1',
      fecha: '2024-11-01',
      concepto: 'Mantenimiento Mensual',
      unidad: 'Apto 101',
      monto: 5000,
      estado: 'Cobrado',
      recibo: 'REC-2024-001'
    },
    {
      id: '2',
      fecha: '2024-11-01',
      concepto: 'Mantenimiento Mensual',
      unidad: 'Apto 102',
      monto: 5000,
      estado: 'Cobrado',
      recibo: 'REC-2024-002'
    },
    {
      id: '3',
      fecha: '2024-11-01',
      concepto: 'Mantenimiento Mensual',
      unidad: 'Apto 201',
      monto: 5000,
      estado: 'Pendiente',
      recibo: 'REC-2024-003'
    },
    {
      id: '4',
      fecha: '2024-11-01',
      concepto: 'Mantenimiento Mensual',
      unidad: 'Apto 202',
      monto: 5000,
      estado: 'Pendiente',
      recibo: 'REC-2024-004'
    },
    {
      id: '5',
      fecha: '2024-11-15',
      concepto: 'Cuota Extraordinaria - Pintura',
      unidad: 'Apto 101',
      monto: 2500,
      estado: 'Cobrado',
      recibo: 'REC-2024-005'
    },
    {
      id: '6',
      fecha: '2024-11-20',
      concepto: 'Multa por Ruido',
      unidad: 'Apto 301',
      monto: 1000,
      estado: 'Vencido',
      recibo: 'REC-2024-006'
    }
  ]);

  // Calcular estadísticas
  const totalIngresosMes = ingresos.reduce((sum: number, i: Ingreso) => sum + i.monto, 0);
  const cobrados = ingresos.filter((i: Ingreso) => i.estado === 'Cobrado').length;
  const pendientes = ingresos.filter((i: Ingreso) => i.estado === 'Pendiente').length;
  const recibosEmitidos = ingresos.filter((i: Ingreso) => i.recibo).length;

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
      'Cobrado': 'bg-green-600 text-white',
      'Pendiente': 'bg-yellow-600 text-white',
      'Vencido': 'bg-red-600 text-white'
    };
    return colors[estado] || 'bg-gray-600 text-white';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <TrendingUp className="text-green-400" size={40} />
          Gestión de Ingresos
        </h1>
        <p className="text-gray-400 text-lg">
          Control de cuotas de mantenimiento y otros ingresos del condominio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-2xl p-6 glow-green">
          <div className="flex items-center justify-between mb-3">
            <div className="text-green-200 text-sm font-bold uppercase">Total Ingresos Mes</div>
            <DollarSign className="text-green-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalIngresosMes)}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6 glow-blue">
          <div className="flex items-center justify-between mb-3">
            <div className="text-blue-200 text-sm font-bold uppercase">Cobrados</div>
            <CheckCircle className="text-blue-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{cobrados}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl shadow-2xl p-6 glow-yellow">
          <div className="flex items-center justify-between mb-3">
            <div className="text-yellow-200 text-sm font-bold uppercase">Pendientes</div>
            <Clock className="text-yellow-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{pendientes}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-2xl p-6 glow-purple">
          <div className="flex items-center justify-between mb-3">
            <div className="text-purple-200 text-sm font-bold uppercase">Recibos Emitidos</div>
            <FileText className="text-purple-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{recibosEmitidos}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all glow-blue">
          <Plus size={20} />
          Nuevo Ingreso
        </button>
      </div>

      {/* Tabla de Ingresos */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            Registro de Ingresos ({ingresos.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800 bg-opacity-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Unidad
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Recibo
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {ingresos.map((ingreso: Ingreso) => (
                <tr key={ingreso.id} className="hover:bg-slate-700 hover:bg-opacity-30 transition-all">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300">{formatDate(ingreso.fecha)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{ingreso.concepto}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300">{ingreso.unidad}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-white font-mono">
                      {formatCurrency(ingreso.monto)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getEstadoBadgeColor(ingreso.estado)}`}>
                      {ingreso.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-mono text-blue-400">{ingreso.recibo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {ingreso.estado !== 'Cobrado' && (
                        <button className="px-3 py-1.5 bg-green-600 bg-opacity-20 hover:bg-opacity-30 text-green-400 rounded-lg transition-all text-sm font-medium">
                          Marcar Cobrado
                        </button>
                      )}
                      <button className="px-3 py-1.5 bg-purple-600 bg-opacity-20 hover:bg-opacity-30 text-purple-400 rounded-lg transition-all text-sm font-medium">
                        Imprimir Recibo
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen por concepto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Mantenimiento Mensual</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total:</span>
              <span className="text-white font-bold">
                {formatCurrency(ingresos.filter((i: Ingreso) => i.concepto.includes('Mantenimiento')).reduce((sum: number, i: Ingreso) => sum + i.monto, 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Unidades:</span>
              <span className="text-white font-bold">
                {ingresos.filter((i: Ingreso) => i.concepto.includes('Mantenimiento')).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Cuotas Extraordinarias</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total:</span>
              <span className="text-white font-bold">
                {formatCurrency(ingresos.filter((i: Ingreso) => i.concepto.includes('Extraordinaria')).reduce((sum: number, i: Ingreso) => sum + i.monto, 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Unidades:</span>
              <span className="text-white font-bold">
                {ingresos.filter((i: Ingreso) => i.concepto.includes('Extraordinaria')).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Otros Ingresos</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total:</span>
              <span className="text-white font-bold">
                {formatCurrency(ingresos.filter((i: Ingreso) => !i.concepto.includes('Mantenimiento') && !i.concepto.includes('Extraordinaria')).reduce((sum: number, i: Ingreso) => sum + i.monto, 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Conceptos:</span>
              <span className="text-white font-bold">
                {ingresos.filter((i: Ingreso) => !i.concepto.includes('Mantenimiento') && !i.concepto.includes('Extraordinaria')).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
