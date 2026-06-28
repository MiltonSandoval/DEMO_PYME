import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Caja from './pages/Caja';
import Productos from './pages/Productos';
import Categorias from './pages/Categorias';
import Clientes from './pages/Clientes';
import Trabajadores from './pages/Trabajadores';
import Proveedores from './pages/Proveedores';
import Ventas from './pages/Ventas';
import Cotizaciones from './pages/Cotizaciones';
import Compras from './pages/Compras';
import Devoluciones from './pages/Devoluciones';
import Inventario from './pages/Inventario';
import Roles from './pages/Roles';
import Configuracion from './pages/Configuracion';
import Validar from './pages/Validar';

function ProtectedRoute({ children, modulo }) {
  const { isAuthenticated, tienePermiso } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (modulo && !tienePermiso(modulo, 'Leer')) {
    return (
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(239,68,68,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem'
        }}>
          🔒
        </div>
        <h2 style={{ color: 'var(--text-primary)' }}>Acceso Denegado</h2>
        <p className="text-muted">No tiene permisos para acceder a este módulo.</p>
      </div>
    );
  }
  return children;
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
      />
      <div className={`main-area ${collapsed ? 'collapsed' : ''}`}>
        <Topbar
          collapsed={collapsed}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />
        <div className="page-content">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute modulo="Dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute modulo="POS"><POS /></ProtectedRoute>} />
            <Route path="/caja" element={<ProtectedRoute modulo="Caja"><Caja /></ProtectedRoute>} />
            <Route path="/productos" element={<ProtectedRoute modulo="Productos"><Productos /></ProtectedRoute>} />
            <Route path="/categorias" element={<ProtectedRoute modulo="Categorias"><Categorias /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute modulo="Clientes"><Clientes /></ProtectedRoute>} />
            <Route path="/trabajadores" element={<ProtectedRoute modulo="Trabajadores"><Trabajadores /></ProtectedRoute>} />
            <Route path="/proveedores" element={<ProtectedRoute modulo="Proveedores"><Proveedores /></ProtectedRoute>} />
            <Route path="/ventas" element={<ProtectedRoute modulo="Ventas"><Ventas /></ProtectedRoute>} />
            <Route path="/cotizaciones" element={<ProtectedRoute modulo="Cotizaciones"><Cotizaciones /></ProtectedRoute>} />
            <Route path="/compras" element={<ProtectedRoute modulo="Compras"><Compras /></ProtectedRoute>} />
            <Route path="/devoluciones" element={<ProtectedRoute modulo="Devoluciones"><Devoluciones /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute modulo="Inventario"><Inventario /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute modulo="Roles"><Roles /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute modulo="Configuracion"><Configuracion /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/validar" element={<Validar />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
