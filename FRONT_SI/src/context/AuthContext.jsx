import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedPermisos = localStorage.getItem('permisos');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setPermisos(savedPermisos ? JSON.parse(savedPermisos) : []);
    }
    setLoading(false);
  }, []);

  const login = async (usuario, contrasena) => {
    const res = await api.post('/auth/login', {
      email: usuario,
      password: contrasena
    });
    const { token, nombre, email, rol, permisos: perms } = res.data;

    const trabajador = {
      nombre,
      email,
      rolNombre: rol
    };

    const permsMapped = (perms || []).map(p => ({
      modulo: p.moduloClave,
      leer: p.leer,
      crear: p.crear,
      editar: p.editar,
      eliminar: p.eliminar
    }));

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(trabajador));
    localStorage.setItem('permisos', JSON.stringify(permsMapped));

    setUser(trabajador);
    setPermisos(permsMapped);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permisos');
    setUser(null);
    setPermisos([]);
  };

  /**
   * Check if user has a specific permission on a module.
   * @param {string} modulo - Module name (e.g., 'Productos', 'Ventas')
   * @param {string} accion - Action: 'Leer', 'Crear', 'Editar', 'Eliminar'
   * @returns {boolean}
   */
  const tienePermiso = (modulo, accion = 'Leer') => {
    if (!permisos || permisos.length === 0) return false;
    const p = permisos.find(
      (pm) => pm.modulo?.toLowerCase() === modulo?.toLowerCase()
    );
    if (!p) return false;
    switch (accion) {
      case 'Leer': return p.leer === true;
      case 'Crear': return p.crear === true;
      case 'Editar': return p.editar === true;
      case 'Eliminar': return p.eliminar === true;
      default: return false;
    }
  };

  const isAuthenticated = !!user;

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, permisos, isAuthenticated, login, logout, tienePermiso }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}

export default AuthContext;
