import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:32768/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token and rewrite singular routes to plural routes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    let url = config.url || '';

    // Special custom mappings
    if (url.startsWith('/pos/vender')) {
      url = '/ventas';
    } else if (url.startsWith('/permiso/rol/')) {
      const parts = url.split('/');
      const rolId = parts[parts.length - 1];
      url = `/roles/${rolId}/permisos`;
    } else if (url.match(/^\/venta\/\d+\/anular/)) {
      url = url.replace(/^\/venta\/(\d+)\/anular/, '/ventas/$1/cancelar');
    } else {
      // General singular to plural mappings matching controller class names
      const mappings = [
        { pattern: /^\/categoria(\/|$)/, replacement: '/categorias$1' },
        { pattern: /^\/cliente(\/|$)/, replacement: '/clientes$1' },
        { pattern: /^\/producto(\/|$)/, replacement: '/productos$1' },
        { pattern: /^\/proveedor(\/|$)/, replacement: '/proveedores$1' },
        { pattern: /^\/trabajador(\/|$)/, replacement: '/trabajadores$1' },
        { pattern: /^\/rol(\/|$)/, replacement: '/roles$1' },
        { pattern: /^\/modulo(\/|$)/, replacement: '/modulos$1' },
        { pattern: /^\/venta(\/|$)/, replacement: '/ventas$1' },
        { pattern: /^\/cotizacion(\/|$)/, replacement: '/cotizaciones$1' },
        { pattern: /^\/devolucion(\/|$)/, replacement: '/devoluciones$1' },
        { pattern: /^\/compra(\/|$)/, replacement: '/ordencompra$1' },
        { pattern: /^\/movimientoinventario(\/|$)/, replacement: '/movimientosinventario$1' },
      ];

      for (const m of mappings) {
        if (url.match(m.pattern)) {
          url = url.replace(m.pattern, m.replacement);
          break;
        }
      }
    }
    config.url = url;

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (session expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permisos');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
