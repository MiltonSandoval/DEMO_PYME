import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, XCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

export default function Ventas() {
  const [allItems, setAllItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // Paginación cliente-side
  // Modificación de paginación cliente-side
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { tienePermiso } = useAuth();
  const toast = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/venta');
      const data = res.data.items ?? res.data;
      setAllItems(data);
    } catch { toast.error('Error al cargar ventas'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtrado y paginación cliente-side
  const filtered = allItems.filter(v =>
    v.id?.toString().includes(busqueda) ||
    (v.cliente || v.clienteNombre || '')?.toLowerCase().includes(busqueda.toLowerCase()) ||
    (v.trabajador || v.trabajadorNombre || '')?.toLowerCase().includes(busqueda.toLowerCase())
  );
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Debounce búsqueda 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusqueda(inputBusqueda);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputBusqueda]);

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
    const e = (estado || '').toLowerCase();
    if (e === 'completada') return 'badge-success';
    if (e === 'anulada' || e === 'cancelada') return 'badge-danger';
    return 'badge-warning';
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Historial de Ventas</h1>
        <div className="search-bar">
          <Search size={16} className="search-icon"/>
          <input className="form-control" placeholder="Buscar por # factura, cliente o vendedor..."
            value={inputBusqueda} onChange={e => setInputBusqueda(e.target.value)}/>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Vendedor</th><th>Método</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay ventas registradas.'}
              </td></tr>
            ) : items.map(v=>(
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
            <div style={{marginTop:16, padding:'12px 16px', background:'var(--bg-input)', borderRadius:'var(--radius-sm)', display:'flex', justifyContent:'space-between', fontWeight:700}}>
              <span>TOTAL:</span><span style={{color:'var(--yellow-400)'}}>${(selected.total || selected.totalUSD)?.toFixed(2)}</span>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={()=>setShowConfirm(false)} onConfirm={handleAnular}
        title="¿Anular venta?" message={`Se anulará la factura #${selected?.id}. El stock será restaurado.`}/>
    </div>
  );
}
