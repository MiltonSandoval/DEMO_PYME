import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Users,
  UserRound,
  Truck,
  Receipt,
  FileText,
  ClipboardList,
  Undo2,
  Warehouse,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Flame,
  DollarSign,
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', modulo: 'Dashboard' },
  { path: '/pos', icon: ShoppingCart, label: 'Punto de Venta', modulo: 'POS' },
  { path: '/caja', icon: DollarSign, label: 'Control de Caja', modulo: 'Caja' },
  { path: '/productos', icon: Package, label: 'Productos', modulo: 'Productos' },
  { path: '/categorias', icon: FolderTree, label: 'Categorías', modulo: 'Categorias' },
  { path: '/clientes', icon: UserRound, label: 'Clientes', modulo: 'Clientes' },
  { path: '/trabajadores', icon: Users, label: 'Trabajadores', modulo: 'Trabajadores' },
  { path: '/proveedores', icon: Truck, label: 'Proveedores', modulo: 'Proveedores' },
  { path: '/ventas', icon: Receipt, label: 'Historial Ventas', modulo: 'Ventas' },
  { path: '/cotizaciones', icon: FileText, label: 'Cotizaciones', modulo: 'Cotizaciones' },
  { path: '/compras', icon: ClipboardList, label: 'Compras', modulo: 'Compras' },
  { path: '/devoluciones', icon: Undo2, label: 'Devoluciones', modulo: 'Devoluciones' },
  { path: '/inventario', icon: Warehouse, label: 'Inventario', modulo: 'Inventario' },
  { path: '/roles', icon: Shield, label: 'Roles', modulo: 'Roles' },
  { path: '/configuracion', icon: Settings, label: 'Configuración', modulo: 'Configuracion' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, tienePermiso, logout } = useAuth();
  const location = useLocation();

  const visibleItems = menuItems.filter((item) => tienePermiso(item.modulo, 'Leer'));

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Flame size={24} />
        </div>
        {!collapsed && <span className="logo-text">ElectroShop</span>}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && <div className="nav-indicator" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="user-info">
            <div className="user-avatar">
              {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.nombre || 'Usuario'}</span>
              <span className="user-role">{user?.rolNombre || 'Sin rol'}</span>
            </div>
          </div>
        )}
        <button className="nav-item logout-btn" onClick={logout} title="Cerrar sesión">
          <LogOut size={20} />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>

      {/* Toggle */}
      <button className="sidebar-toggle" onClick={onToggle}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
