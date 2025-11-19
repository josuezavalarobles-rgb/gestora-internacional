import { useState } from 'react';
import { BookOpen, Plus, Search, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';

interface Cuenta {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'Activo' | 'Pasivo' | 'Ingreso' | 'Gasto' | 'Capital';
  saldo: number;
}

export default function Contabilidad() {
  const [searchTerm, setSearchTerm] = useState('');

  // Datos mock de plan de cuentas
  const [cuentas] = useState<Cuenta[]>([
    {
      id: '1',
      codigo: '1-01-001',
      nombre: 'Caja General',
      tipo: 'Activo',
      saldo: 450000
    },
    {
      id: '2',
      codigo: '1-01-002',
      nombre: 'Banco Popular - Cuenta Corriente',
      tipo: 'Activo',
      saldo: 2350000
    },
    {
      id: '3',
      codigo: '1-02-001',
      nombre: 'Cuentas por Cobrar - Residentes',
      tipo: 'Activo',
      saldo: 125000
    },
    {
      id: '4',
      codigo: '2-01-001',
      nombre: 'Cuentas por Pagar - Proveedores',
      tipo: 'Pasivo',
      saldo: 85000
    },
    {
      id: '5',
      codigo: '2-01-002',
      nombre: 'Préstamos Bancarios',
      tipo: 'Pasivo',
      saldo: 500000
    },
    {
      id: '6',
      codigo: '4-01-001',
      nombre: 'Cuotas de Mantenimiento',
      tipo: 'Ingreso',
      saldo: 320000
    },
    {
      id: '7',
      codigo: '4-02-001',
      nombre: 'Ingresos por Áreas Comunes',
      tipo: 'Ingreso',
      saldo: 45000
    },
    {
      id: '8',
      codigo: '5-01-001',
      nombre: 'Salarios y Beneficios',
      tipo: 'Gasto',
      saldo: 180000
    },
    {
      id: '9',
      codigo: '5-02-001',
      nombre: 'Servicios Públicos',
      tipo: 'Gasto',
      saldo: 95000
    },
    {
      id: '10',
      codigo: '5-03-001',
      nombre: 'Mantenimiento y Reparaciones',
      tipo: 'Gasto',
      saldo: 65000
    },
    {
      id: '11',
      codigo: '3-01-001',
      nombre: 'Capital Social',
      tipo: 'Capital',
      saldo: 1500000
    }
  ]);

  // Calcular totales
  const totalActivos = cuentas
    .filter((c: Cuenta) => c.tipo === 'Activo')
    .reduce((sum: number, c: Cuenta) => sum + c.saldo, 0);

  const totalIngresos = cuentas
    .filter((c: Cuenta) => c.tipo === 'Ingreso')
    .reduce((sum: number, c: Cuenta) => sum + c.saldo, 0);

  const totalGastos = cuentas
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <BookOpen className="text-blue-600" size={36} />
          Plan de Cuentas Contables
        </h1>
        <p className="text-gray-600">
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
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Buscar por código, nombre o tipo de cuenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition-all whitespace-nowrap">
            <Plus size={20} />
            Nueva Cuenta
          </button>
        </div>
      </div>

      {/* Tabla de Cuentas */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Cuentas Registradas ({cuentasFiltradas.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Nombre de Cuenta
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cuentasFiltradas.map((cuenta: Cuenta) => (
                <tr key={cuenta.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-bold text-blue-600">
                      {cuenta.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{cuenta.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow ${getTipoBadgeColor(cuenta.tipo)}`}>
                      {cuenta.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-gray-900 font-mono">
                      {formatCurrency(cuenta.saldo)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-all text-sm font-medium">
                        Ver Movimientos
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

        {cuentasFiltradas.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No se encontraron cuentas</p>
            <p className="text-gray-500 text-sm">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
