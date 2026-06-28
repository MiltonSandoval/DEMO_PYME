import { useState, useEffect } from 'react';
import { Search, Eye, XCircle, Receipt } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Ventas() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const { tienePermiso } = useAuth();
  const toast = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setLoading(true); const res = await api.get('/venta'); setItems(res.data); }
    catch { toast.error('Error al cargar ventas'); } finally { setLoading(false); }
  };

  const filtered = items.filter(v =>
    v.id?.toString().includes(busqueda) ||
    (v.cliente || v.clienteNombre)?.toLowerCase().includes(busqueda.toLowerCase()) ||
    (v.trabajador || v.trabajadorNombre)?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleShowDetail = async (item) => {
    try {
      const res = await api.get(`/venta/${item.id}`);
      setSelected(res.data);
      setShowDetail(true);
    } catch {
      toast.error('Error al cargar detalles de la venta');
    }
  };

  const handleAnular = async () => {
    try {
      await api.put(`/venta/${selected.id}/anular`);
      toast.success('Venta anulada');
      setShowConfirm(false);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al anular'); }
  };

  const estadoColor = (estado) => {
    switch(estado) {
      case 'Completada': return 'badge-success';
      case 'Anulada': return 'badge-danger';
      default: return 'badge-warning';
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Historial de Ventas</h1>
        <div className="search-bar">
          <Search size={16} className="search-icon"/>
          <input className="form-control" placeholder="Buscar por # factura, cliente..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Vendedor</th><th>Método</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.map(v=>(
              <tr key={v.id}>
                <td><strong>#{v.id}</strong></td>
                <td className="text-sm">{new Date(v.fecha || v.creadoEn).toLocaleString('es-BO')}</td>
                <td>{v.cliente || v.clienteNombre || 'General'}</td>
                <td>{v.trabajador || v.trabajadorNombre || '—'}</td>
                <td><span className="badge badge-info">{v.metodoPago}</span></td>
                <td style={{fontWeight:700, color:'var(--yellow-400)'}}>${(v.total || v.totalUSD)?.toFixed(2)}</td>
                <td><span className={`badge ${estadoColor(v.estado)}`}>{v.estado}</span></td>
                <td><div className="flex gap-sm">
                  <button className="btn btn-ghost btn-sm" onClick={()=>handleShowDetail(v)}><Eye size={14}/></button>
                  {tienePermiso('Ventas','Eliminar') && v.estado !== 'Anulada' && v.estado !== 'cancelada' && (
                    <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>{setSelected(v);setShowConfirm(true);}}><XCircle size={14}/></button>
                  )}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={()=>setShowDetail(false)} title={`Factura #${selected?.id}`} size="lg">
        {selected && (
          <>
            <div className="grid-2 mb-2">
              <div><span className="text-muted text-sm">Cliente:</span> <strong>{selected.cliente?.nombre || selected.clienteNombre || 'General'}</strong></div>
              <div><span className="text-muted text-sm">Método:</span> <strong>{selected.metodoPago?.nombre || selected.metodoPago}</strong></div>
              <div><span className="text-muted text-sm">Fecha:</span> {new Date(selected.fecha || selected.creadoEn).toLocaleString('es-BO')}</div>
              <div><span className="text-muted text-sm">Descuento:</span> {selected.descuento || selected.descuentoPorcentaje || 0}%</div>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {selected.detalles?.map((d,i)=>(
                    <tr key={i}>
                      <td>{d.producto?.nombre || d.productoNombre || `#${d.productoId}`}</td><td>{d.cantidad}</td>
                      <td>${(d.precioUnitario || d.precioUnitarioUSD)?.toFixed(2)}</td>
                      <td style={{fontWeight:600}}>${(d.cantidad * (d.precioUnitario || d.precioUnitarioUSD)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="cart-summary" style={{marginTop:16, borderRadius:'var(--radius-sm)'}}>
              <div className="summary-row total"><span>TOTAL:</span><span>${(selected.total || selected.totalUSD)?.toFixed(2)}</span></div>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={()=>setShowConfirm(false)} onConfirm={handleAnular}
        title="¿Anular venta?" message={`Se anulará la factura #${selected?.id}. El stock será restaurado.`}/>
    </div>
  );
}
