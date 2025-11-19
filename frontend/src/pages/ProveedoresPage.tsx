import { useState } from 'react';
import { Store, Plus, Search, Star, TrendingUp, Users, Award } from 'lucide-react';

interface Proveedor {
  id: string;
  nombre: string;
  rnc: string;
  tipo: string;
  telefono: string;
  email: string;
  calificacion: number;
  gastosDelMes: number;
  estado: 'Activo' | 'Inactivo';
}

export default function ProveedoresPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Datos mock de proveedores
  const [proveedores] = useState<Proveedor[]>([
    {
      id: '1',
      nombre: 'Servicios Técnicos RD',
      rnc: '131-45678-9',
      tipo: 'Mantenimiento',
      telefono: '809-555-1234',
      email: 'contacto@serviciosrd.com',
      calificacion: 4.5,
      gastosDelMes: 45000,
      estado: 'Activo'
    },
    {
      id: '2',
      nombre: 'Suministros del Caribe',
      rnc: '131-23456-7',
      tipo: 'Limpieza',
      telefono: '809-555-5678',
      email: 'ventas@suministroscaribe.com',
      calificacion: 4.8,
      gastosDelMes: 32000,
      estado: 'Activo'
    },
    {
      id: '3',
      nombre: 'Electrónica Santo Domingo',
      rnc: '131-98765-4',
      tipo: 'Electricidad',
      telefono: '809-555-9876',
      email: 'info@electronicasd.com',
      calificacion: 4.2,
      gastosDelMes: 28500,
      estado: 'Activo'
    },
    {
      id: '4',
      nombre: 'Jardinería Tropical',
      rnc: '131-11223-3',
      tipo: 'Jardinería',
      telefono: '809-555-2468',
      email: 'jardineria@tropical.com',
      calificacion: 4.7,
      gastosDelMes: 18000,
      estado: 'Activo'
    },
    {
      id: '5',
      nombre: 'Seguridad Integral',
      rnc: '131-33445-5',
      tipo: 'Seguridad',
      telefono: '809-555-1357',
      email: 'contacto@seguridadintegral.com',
      calificacion: 4.9,
      gastosDelMes: 65000,
      estado: 'Activo'
    },
    {
      id: '6',
      nombre: 'Plomería Express',
      rnc: '131-55667-7',
      tipo: 'Plomería',
      telefono: '809-555-8642',
      email: 'servicios@plomeriaexpress.com',
      calificacion: 4.3,
      gastosDelMes: 22000,
      estado: 'Inactivo'
    }
  ]);

  // Calcular estadísticas
  const totalProveedores = proveedores.length;
  const proveedoresActivos = proveedores.filter((p: Proveedor) => p.estado === 'Activo').length;
  const calificacionPromedio = proveedores.length > 0
    ? proveedores.reduce((sum: number, p: Proveedor) => sum + p.calificacion, 0) / proveedores.length
    : 0;
  const gastosDelMes = proveedores.reduce((sum: number, p: Proveedor) => sum + (p.gastosDelMes || 0), 0);

  // Filtrar proveedores por búsqueda
  const proveedoresFiltrados = proveedores.filter((proveedor: Proveedor) =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.rnc.includes(searchTerm) ||
    proveedor.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
        <span className="text-sm text-gray-700 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Store className="text-purple-600" size={36} />
          Gestión de Proveedores
        </h1>
        <p className="text-gray-600">
          Directorio de proveedores y evaluación de servicios
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-2xl p-6 glow-purple">
          <div className="flex items-center justify-between mb-3">
            <div className="text-purple-200 text-sm font-bold uppercase">Total Proveedores</div>
            <Store className="text-purple-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{totalProveedores}</div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-2xl p-6 glow-green">
          <div className="flex items-center justify-between mb-3">
            <div className="text-green-200 text-sm font-bold uppercase">Activos</div>
            <Users className="text-green-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{proveedoresActivos}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl shadow-2xl p-6 glow-yellow">
          <div className="flex items-center justify-between mb-3">
            <div className="text-yellow-200 text-sm font-bold uppercase">Evaluación Promedio</div>
            <Award className="text-yellow-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{calificacionPromedio.toFixed(1)} / 5</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6 glow-blue">
          <div className="flex items-center justify-between mb-3">
            <div className="text-blue-200 text-sm font-bold uppercase">Gastos del Mes</div>
            <TrendingUp className="text-blue-200" size={24} />
          </div>
          <div className="text-3xl font-bold text-white">{formatCurrency(gastosDelMes)}</div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Buscar por nombre, RNC o tipo de servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition-all whitespace-nowrap">
            <Plus size={20} />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Tabla de Proveedores */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Directorio de Proveedores ({proveedoresFiltrados.length})
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
                  RNC
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Tipo de Servicio
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Calificación
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proveedoresFiltrados.map((proveedor: Proveedor) => (
                <tr key={proveedor.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{proveedor.nombre}</div>
                      <div className="text-xs text-gray-600">{proveedor.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-700">{proveedor.rnc}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow bg-blue-600 text-white">
                      {proveedor.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{proveedor.telefono}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center">
                      {renderStars(proveedor.calificacion)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-all text-sm font-medium">
                        Ver Detalles
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

        {proveedoresFiltrados.length === 0 && (
          <div className="p-12 text-center">
            <Store size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No se encontraron proveedores</p>
            <p className="text-gray-500 text-sm">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}
      </div>

      {/* Top Proveedores del Mes */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="text-yellow-600" size={24} />
          Top Proveedores del Mes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {proveedores
            .sort((a: Proveedor, b: Proveedor) => (b.gastosDelMes || 0) - (a.gastosDelMes || 0))
            .slice(0, 4)
            .map((proveedor: Proveedor, index: number) => (
              <div key={proveedor.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl font-bold text-yellow-600">#{index + 1}</span>
                  {renderStars(proveedor.calificacion)}
                </div>
                <h4 className="text-gray-900 font-bold mb-1">{proveedor.nombre}</h4>
                <p className="text-sm text-gray-600 mb-2">{proveedor.tipo}</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(proveedor.gastosDelMes)}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
