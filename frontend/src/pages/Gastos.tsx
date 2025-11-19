import { useState } from 'react';
import { Receipt, Plus, TrendingDown, Clock, CheckCircle, FileText } from 'lucide-react';

interface Gasto {
  id: string;
  fecha: string;
  concepto: string;
  proveedor: string;
  ncf: string;
  monto: number;
  estado: 'Pendiente' | 'Pagado' | 'Vencido';
}

export default function Gastos() {
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);

  // Datos mock de gastos
  const [gastos] = useState<Gasto[]>([
    {
      id: '1',
      fecha: '2024-11-05',
      concepto: 'Mantenimiento Ascensores',
      proveedor: 'Servicios Técnicos RD',
      ncf: 'B0100000001',
      monto: 45000,
      estado: 'Pagado'
    },
    {
      id: '2',
      fecha: '2024-11-10',
      concepto: 'Suministros de Limpieza',
      proveedor: 'Suministros del Caribe',
      ncf: 'B0100000002',
      monto: 32000,
      estado: 'Pagado'
    },
    {
      id: '3',
      fecha: '2024-11-12',
      concepto: 'Reparación Eléctrica Torre A',
      proveedor: 'Electrónica Santo Domingo',
      ncf: 'B0100000003',
      monto: 28500,
      estado: 'Pendiente'
    },
    {
      id: '4',
      fecha: '2024-11-15',
      concepto: 'Jardinería Áreas Comunes',
      proveedor: 'Jardinería Tropical',
      ncf: 'B0100000004',
      monto: 18000,
      estado: 'Pendiente'
    },
    {
      id: '5',
      fecha: '2024-11-01',
      concepto: 'Servicio de Seguridad',
      proveedor: 'Seguridad Integral',
      ncf: 'B0100000005',
      monto: 65000,
      estado: 'Pagado'
    },
    {
      id: '6',
      fecha: '2024-11-08',
      concepto: 'Consumo de Agua',
      proveedor: 'CAASD',
      ncf: 'B0200000001',
      monto: 45000,
      estado: 'Vencido'
    }
  ]);

  // Calcular estadísticas
  const totalGastosMes = gastos.reduce((sum: number, g: Gasto) => sum + g.monto, 0);
  const pendientesPago = gastos.filter((g: Gasto) => g.estado === 'Pendiente').length;
  const pagados = gastos.filter((g: Gasto) => g.estado === 'Pagado').length;
  const ncfUsados = gastos.filter((g: Gasto) => g.ncf).length;

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
      'Pendiente': 'bg-yellow-600 text-white',
      'Pagado': 'bg-green-600 text-white',
      'Vencido': 'bg-red-600 text-white'
    };
    return colors[estado] || 'bg-gray-600 text-white';
  };

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Receipt className="text-orange-400" size={40} />
          Gestión de Gastos
        </h1>
        <p className="text-gray-400 text-lg">
          Control de gastos operativos y comprobantes fiscales (NCF)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl shadow-2xl p-6 glow-orange">
          <div className="flex items-center justify-between mb-3">
            <div className="text-orange-200 text-sm font-bold uppercase">Total Gastos Mes</div>
            <TrendingDown className="text-orange-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalGastosMes)}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl shadow-2xl p-6 glow-yellow">
          <div className="flex items-center justify-between mb-3">
            <div className="text-yellow-200 text-sm font-bold uppercase">Pendientes de Pago</div>
            <Clock className="text-yellow-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{pendientesPago}</div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-2xl p-6 glow-green">
          <div className="flex items-center justify-between mb-3">
            <div className="text-green-200 text-sm font-bold uppercase">Pagados</div>
            <CheckCircle className="text-green-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{pagados}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6 glow-blue">
          <div className="flex items-center justify-between mb-3">
            <div className="text-blue-200 text-sm font-bold uppercase">NCF Usados</div>
            <FileText className="text-blue-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{ncfUsados}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-bold text-gray-200 uppercase tracking-wide">
              Filtrar por mes:
            </label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              className="px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              {meses.map(mes => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all glow-blue whitespace-nowrap">
            <Plus size={20} />
            Nuevo Gasto
          </button>
        </div>
      </div>

      {/* Tabla de Gastos */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            Registro de Gastos ({gastos.length})
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
                  Proveedor
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  NCF
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Monto
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
              {gastos.map((gasto: Gasto) => (
                <tr key={gasto.id} className="hover:bg-slate-700 hover:bg-opacity-30 transition-all">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-300">{formatDate(gasto.fecha)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{gasto.concepto}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">{gasto.proveedor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-blue-400">{gasto.ncf}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-white font-mono">
                      {formatCurrency(gasto.monto)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getEstadoBadgeColor(gasto.estado)}`}>
                      {gasto.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {gasto.estado !== 'Pagado' && (
                        <button className="px-3 py-1.5 bg-green-600 bg-opacity-20 hover:bg-opacity-30 text-green-400 rounded-lg transition-all text-sm font-medium">
                          Marcar Pagado
                        </button>
                      )}
                      <button className="px-3 py-1.5 bg-blue-600 bg-opacity-20 hover:bg-opacity-30 text-blue-400 rounded-lg transition-all text-sm font-medium">
                        Ver Detalles
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información sobre NCF */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-950 bg-opacity-20 border border-blue-500 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
          <FileText size={20} />
          Información sobre NCF (Números de Comprobante Fiscal)
        </h3>
        <div className="text-gray-300 space-y-2 text-sm">
          <p>Los NCF son obligatorios para todos los gastos registrados según la DGII de República Dominicana.</p>
          <p>Tipos comunes: B01 (Crédito Fiscal), B02 (Consumo), B14 (Régimen Especial), B15 (Gubernamental)</p>
          <p className="text-yellow-400"><strong>Importante:</strong> Verificar que los NCF sean válidos antes de registrar el pago.</p>
        </div>
      </div>
    </div>
  );
}
