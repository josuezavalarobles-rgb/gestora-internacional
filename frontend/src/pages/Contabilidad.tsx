import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Search, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import { contabilidadAPI } from '../services/api';

interface Cuenta {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'Activo' | 'Pasivo' | 'Ingreso' | 'Gasto' | 'Capital';
  saldo: number;
}

export default function Contabilidad() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Cargar plan de cuentas desde el API
  const { data: cuentas = [], isLoading, error } = useQuery({
    queryKey: ['plan-cuentas'],
    queryFn: () => contabilidadAPI.obtenerPlanCuentas(),
  });

  // Cargar balance general
  const { data: balanceGeneral } = useQuery({
    queryKey: ['balance-general'],
    queryFn: () => contabilidadAPI.obtenerBalanceGeneral(),
  });

  // Cargar estado de resultados
  const { data: estadoResultados } = useQuery({
    queryKey: ['estado-resultados'],
    queryFn: () => contabilidadAPI.obtenerEstadoResultados(),
  });

  // Mutación para crear cuenta
  const crearCuentaMutation = useMutation({
    mutationFn: contabilidadAPI.crearCuenta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-cuentas'] });
    },
  });

  // Calcular totales
  const totalActivos = balanceGeneral?.totalActivos || cuentas
    .filter((c: Cuenta) => c.tipo === 'Activo')
    .reduce((sum: number, c: Cuenta) => sum + c.saldo, 0);

  const totalIngresos = estadoResultados?.totalIngresos || cuentas
    .filter((c: Cuenta) => c.tipo === 'Ingreso')
    .reduce((sum: number, c: Cuenta) => sum + c.saldo, 0);

  const totalGastos = estadoResultados?.totalGastos || cuentas
    .filter((c: Cuenta) => c.tipo === 'Gasto')
    .reduce((sum: number, c: Cuenta) => sum + c.saldo, 0);

  const balance = totalIngresos - totalGastos;

  // Filtrar cuentas por búsqueda
  const cuentasFiltradas = cuentas.filter((cuenta: Cuenta) =>
    cuenta.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cuenta.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cuenta.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'Activo': 'bg-blue-600 text-white',
      'Pasivo': 'bg-red-600 text-white',
      'Ingreso': 'bg-green-600 text-white',
      'Gasto': 'bg-orange-600 text-white',
      'Capital': 'bg-purple-600 text-white'
    };
    return colors[tipo] || 'bg-gray-600 text-white';
  };

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Cargando plan de cuentas...</p>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={64} className="mx-auto text-red-500 mb-4" />
          <p className="text-red-400 text-lg mb-2">Error al cargar plan de cuentas</p>
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
          <BookOpen className="text-blue-400" size={40} />
          Plan de Cuentas Contables
        </h1>
        <p className="text-gray-400 text-lg">
          Gestión del catálogo de cuentas contables del condominio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6 glow-blue">
          <div className="flex items-center justify-between mb-3">
            <div className="text-blue-200 text-sm font-bold uppercase">Total Activos</div>
            <TrendingUp className="text-blue-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalActivos)}</div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-2xl p-6 glow-green">
          <div className="flex items-center justify-between mb-3">
            <div className="text-green-200 text-sm font-bold uppercase">Ingresos</div>
            <DollarSign className="text-green-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalIngresos)}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl shadow-2xl p-6 glow-orange">
          <div className="flex items-center justify-between mb-3">
            <div className="text-orange-200 text-sm font-bold uppercase">Gastos</div>
            <TrendingDown className="text-orange-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalGastos)}</div>
        </div>

        <div className={`bg-gradient-to-br rounded-xl shadow-2xl p-6 ${
          balance >= 0
            ? 'from-purple-600 to-purple-800 glow-purple'
            : 'from-red-600 to-red-800 glow-red'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-purple-200 text-sm font-bold uppercase">Balance</div>
            <FileText className="text-purple-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(balance)}</div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Buscar por código, nombre o tipo de cuenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-slate-700 border border-slate-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all glow-blue whitespace-nowrap">
            <Plus size={20} />
            Nueva Cuenta
          </button>
        </div>
      </div>

      {/* Tabla de Cuentas */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            Cuentas Registradas ({cuentasFiltradas.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800 bg-opacity-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Nombre de Cuenta
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {cuentasFiltradas.map((cuenta: Cuenta) => (
                <tr key={cuenta.id} className="hover:bg-slate-700 hover:bg-opacity-30 transition-all">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-bold text-blue-400">
                      {cuenta.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{cuenta.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getTipoBadgeColor(cuenta.tipo)}`}>
                      {cuenta.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-white font-mono">
                      {formatCurrency(cuenta.saldo)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="px-3 py-1.5 bg-blue-600 bg-opacity-20 hover:bg-opacity-30 text-blue-400 rounded-lg transition-all text-sm font-medium">
                        Ver Movimientos
                      </button>
                      <button className="px-3 py-1.5 bg-purple-600 bg-opacity-20 hover:bg-opacity-30 text-purple-400 rounded-lg transition-all text-sm font-medium">
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cuentasFiltradas.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen size={64} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">No se encontraron cuentas</p>
            <p className="text-gray-500 text-sm">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
