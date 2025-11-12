import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ArrowRight,
  User,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useCasos } from '@/hooks/useCasos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Casos() {
  const { data: casos = [], isLoading, isError } = useCasos();

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todas');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  // Aplicar filtros
  const casosFiltrados = casos.filter((caso) => {
    if (filtroEstado !== 'todos' && caso.estado !== filtroEstado) return false;
    if (filtroPrioridad !== 'todas' && caso.prioridad !== filtroPrioridad) return false;
    if (filtroTipo !== 'todos' && caso.tipo !== filtroTipo) return false;

    if (filtroBusqueda) {
      const busqueda = filtroBusqueda.toLowerCase();
      const coincideNumero = caso.numeroCaso.toLowerCase().includes(busqueda);
      const coincideCliente = caso.usuario.nombreCompleto.toLowerCase().includes(busqueda);
      const coincideDescripcion = caso.descripcion.toLowerCase().includes(busqueda);
      if (!coincideNumero && !coincideCliente && !coincideDescripcion) return false;
    }

    return true;
  });

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      nuevo: 'bg-blue-100 text-blue-800 border-blue-200',
      asignado: 'bg-purple-100 text-purple-800 border-purple-200',
      en_proceso: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      en_visita: 'bg-orange-100 text-orange-800 border-orange-200',
      resuelto: 'bg-green-100 text-green-800 border-green-200',
      cerrado: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Función para obtener el color del badge según la prioridad
  const getPrioridadBadgeColor = (prioridad: string) => {
    const colors: Record<string, string> = {
      baja: 'bg-gray-100 text-gray-700 border-gray-200',
      media: 'bg-blue-100 text-blue-700 border-blue-200',
      alta: 'bg-orange-100 text-orange-700 border-orange-200',
      urgente: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[prioridad] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Función para formatear el estado
  const formatEstado = (estado: string) => {
    return estado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando casos...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="text-destructive" size={24} />
          <div>
            <h3 className="text-destructive font-semibold">Error al cargar casos</h3>
            <p className="text-destructive/80">Por favor, intente nuevamente más tarde.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Casos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los casos y tickets del sistema
          </p>
        </div>
        <Link
          to="/nuevo-caso"
          className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          <span>Nuevo Caso</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-card-foreground">{casos.length}</p>
            </div>
            <FileText className="text-primary" size={24} />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Nuevos</p>
              <p className="text-2xl font-bold text-card-foreground">
                {casos.filter(c => c.estado === 'nuevo').length}
              </p>
            </div>
            <Clock className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En Proceso</p>
              <p className="text-2xl font-bold text-card-foreground">
                {casos.filter(c => ['asignado', 'en_proceso', 'en_visita'].includes(c.estado)).length}
              </p>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Urgentes</p>
              <p className="text-2xl font-bold text-card-foreground">
                {casos.filter(c => c.prioridad === 'urgente').length}
              </p>
            </div>
            <AlertTriangle className="text-red-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter size={20} className="text-muted-foreground" />
          <h2 className="text-lg font-semibold text-card-foreground">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro por Estado */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-input"
            >
              <option value="todos">Todos</option>
              <option value="nuevo">Nuevo</option>
              <option value="asignado">Asignado</option>
              <option value="en_proceso">En Proceso</option>
              <option value="en_visita">En Visita</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>

          {/* Filtro por Prioridad */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Prioridad
            </label>
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-input"
            >
              <option value="todas">Todas</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          {/* Filtro por Tipo */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Tipo
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-input"
            >
              <option value="todos">Todos</option>
              <option value="garantia">Garantía</option>
              <option value="condominio">Condominio</option>
            </select>
          </div>

          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Número, cliente o descripción..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="w-full px-3 py-2 pl-10 bg-background border border-input text-foreground placeholder-muted-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-input"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-semibold text-foreground">{casosFiltrados.length}</span> de{' '}
            <span className="font-semibold text-foreground">{casos.length}</span> casos
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Caso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {casosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-muted-foreground">
                      <AlertTriangle className="mx-auto mb-2 text-muted-foreground" size={48} />
                      <p className="text-lg font-medium text-foreground">No se encontraron casos</p>
                      <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                casosFiltrados.map((caso) => (
                  <tr key={caso.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {caso.numeroCaso}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {caso.categoria}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User size={16} className="text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium text-foreground">{caso.usuario.nombreCompleto}</div>
                          <div className="text-sm text-muted-foreground">{caso.usuario.telefono}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <MapPin size={16} className="text-muted-foreground" />
                        <div>
                          <div className="text-sm text-foreground">{caso.condominio.nombre}</div>
                          <div className="text-sm text-muted-foreground">{caso.unidad}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoBadgeColor(caso.estado)}`}>
                        {formatEstado(caso.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPrioridadBadgeColor(caso.prioridad)}`}>
                        {caso.prioridad.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar size={16} />
                        <span>{formatDate(caso.fechaCreacion)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/casos/${caso.id}`}
                        className="inline-flex items-center space-x-1 text-primary hover:text-primary/80 font-medium"
                      >
                        <span>Ver detalles</span>
                        <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
