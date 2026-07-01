import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import Pagination from '../components/Pagination';

export default function Inventario() {
  const [allItems, setAllItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  // Paginación cliente-side
  // Modificación de paginación cliente-side
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const toast = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/movimientoinventario');
      setAllItems(res.data.items ?? res.data);
    } catch { toast.error('Error al cargar inventario'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtrado y paginación cliente-side
  const filtered = allItems.filter(m =>
    (m.producto || m.productoNombre)?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.motivo?.toLowerCase().includes(busqueda.toLowerCase())
  );
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  const tipoColor = (tipo) => {
    switch(tipo?.toLowerCase()) {
      case 'entrada': case 'compraentrada': return 'badge-success';
      case 'salida': case 'ventasalida': return 'badge-danger';
      case 'devolucion': return 'badge-info';
      case 'merma': case 'ajuste': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Inventario (Kardex)</h1>
        <div className="search-bar">
          <Search size={16} className="search-icon"/>
          <input className="form-control" placeholder="Filtrar por producto, tipo o motivo..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>#</th><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th></tr></thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                No hay movimientos en esta página.
              </td></tr>
            ) : items.map(m=>(
              <tr key={m.id}>
                <td>#{m.id}</td>
                <td className="text-sm">{new Date(m.fecha || m.creadoEn).toLocaleString('es-BO')}</td>
                <td><strong>{m.producto || m.productoNombre || `—`}</strong></td>
                <td><span className={`badge ${tipoColor(m.tipo)}`}>{m.tipo}</span></td>
                <td style={{fontWeight:600, color: m.cantidad > 0 ? 'var(--success)' : 'var(--danger)'}}>
                  {m.cantidad > 0 ? '+' : ''}{m.cantidad}
                </td>
                <td className="text-muted text-sm">{m.motivo || m.referencia || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          pageSizeOptions={[10, 15, 25, 50]}
        />
      </div>
    </div>
  );
}
