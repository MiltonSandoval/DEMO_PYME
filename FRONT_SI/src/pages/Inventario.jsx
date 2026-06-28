import { useState, useEffect } from 'react';
import { Search, Warehouse } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function Inventario() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setLoading(true); const res = await api.get('/movimientoinventario'); setItems(res.data); }
    catch { toast.error('Error al cargar inventario'); } finally { setLoading(false); }
  };

  const filtered = items.filter(m =>
    (m.producto || m.productoNombre)?.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.tipo?.toLowerCase().includes(busqueda.toLowerCase())
  );

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
          <input className="form-control" placeholder="Buscar por producto o tipo..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>#</th><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Motivo</th></tr></thead>
          <tbody>
            {filtered.map(m=>(
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
      </div>
    </div>
  );
}
