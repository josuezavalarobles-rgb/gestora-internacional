import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  UserCog,
  BarChart3,
  Calendar,
  Plus,
  CheckCircle,
  Bot,
  Home,
  Search,
  Mail,
  Settings,
  BookOpen,
  Receipt,
  TrendingUp,
  Building2,
  DoorOpen,
  UserCheck,
  Wallet
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      exact: true,
    },
    {
      path: '/casos',
      icon: FolderOpen,
      label: 'Casos',
    },
    {
      path: '/nuevo-caso',
      icon: Plus,
      label: 'Nuevo Caso',
    },
    {
      path: '/prospecting',
      icon: Search,
      label: 'Prospección',
    },
    {
      path: '/solicitudes-ia',
      icon: Bot,
      label: 'Solicitudes IA',
    },
    {
      path: '/citas',
      icon: Calendar,
      label: 'Citas',
    },
    {
      path: '/aprobaciones',
      icon: CheckCircle,
      label: 'Aprobaciones',
    },
    {
      path: '/tecnicos',
      icon: UserCog,
      label: 'Tecnicos',
    },
    {
      path: '/usuarios',
      icon: Users,
      label: 'Usuarios',
    },
    {
      path: '/propietarios',
      icon: Home,
      label: 'Propietarios',
    },
    {
      path: '/contabilidad',
      icon: BookOpen,
      label: 'Contabilidad',
    },
    {
      path: '/gastos',
      icon: Receipt,
      label: 'Gastos',
    },
    {
      path: '/ingresos',
      icon: TrendingUp,
      label: 'Ingresos',
    },
    {
      path: '/proveedores',
      icon: Building2,
      label: 'Proveedores',
    },
    {
      path: '/areas-comunes',
      icon: DoorOpen,
      label: 'Áreas Comunes',
    },
    {
      path: '/control-visitas',
      icon: UserCheck,
      label: 'Control de Visitas',
    },
    {
      path: '/nomina',
      icon: Wallet,
      label: 'Nómina',
    },
    {
      path: '/reportes',
      icon: BarChart3,
      label: 'Reportes',
    },
    {
      path: '/email-marketing',
      icon: Mail,
      label: 'Email Marketing',
    },
    {
      path: '/configuracion',
      icon: Settings,
      label: 'Configuración',
    },
    {
      path: '/calendario',
      icon: Calendar,
      label: 'Calendario (Viejo)',
    },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 min-h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center glow-blue">
            <span className="text-white font-bold text-lg">GI</span>
          </div>
          <span className="text-lg font-semibold text-white">
            Gestora Internacional
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-lg glow-blue'
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={active ? 'text-blue-200' : 'text-gray-400'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">AD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Admin</p>
            <p className="text-xs text-gray-400">Administrador</p>
          </div>
        </div>
      </div>
    </div>
  );
}
