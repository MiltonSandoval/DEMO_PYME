import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileText, Send, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';

export default function Cotizaciones() {
  const [allItems, setAllItems] = useState([]);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    clienteNombre: '', clienteCelular: '', validezDias: 7, observacion: '', detalles: []
  });
  const [prodBusqueda, setProdBusqueda] = useState('');

  // Paginación cliente-side
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { tienePermiso } = useAuth();
  const toast = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, pRes] = await Promise.allSettled([
        api.get('/cotizacion'),
        api.get('/producto'), // sin paginación para el selector de productos en el modal
      ]);
      if (cRes.status === 'fulfilled') {
        const data = cRes.value.data;
        setAllItems(data.items ?? data);
      }
      if (pRes.status === 'fulfilled') setProductos(pRes.value.data.filter(p => p.activo !== false || p.estado === 'activo'));
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtrado y paginación cliente-side
  const filtered = allItems.filter(c =>
    c.clienteNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.id?.toString().includes(busqueda)
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

  const addDetalle = (prod) => {
    setForm(prev => {
      const existing = prev.detalles.find(d => d.productoId === prod.id);
      if (existing) {
        return {...prev, detalles: prev.detalles.map(d => d.productoId === prod.id ? {...d, cantidad: d.cantidad + 1} : d)};
      }
      return {...prev, detalles: [...prev.detalles, { productoId: prod.id, nombre: prod.nombre, precioUnitarioUSD: prod.precioVenta || prod.precioVentaUSD || 0, cantidad: 1 }]};
    });
  };

  const removeDetalle = (prodId) => {
    setForm(prev => ({...prev, detalles: prev.detalles.filter(d => d.productoId !== prodId)}));
  };

  const totalCotizacion = form.detalles.reduce((s, d) => s + (d.precioUnitarioUSD || 0) * d.cantidad, 0);

  const handleSave = async () => {
    if (!form.clienteNombre.trim()) { toast.error('El nombre del cliente es requerido'); return; }
    if (form.detalles.length === 0) { toast.error('Agregue al menos un producto'); return; }
    try {
      await api.post('/cotizacion', {
        clienteNombre: form.clienteNombre,
        clienteTelefono: form.clienteCelular,
        descuentoGlobal: 0,
        subtotal: totalCotizacion,
        montoDescuento: 0,
        total: totalCotizacion,
        diasValidez: Number(form.validezDias),
        plantilla: 'T1',
        notas: form.observacion,
        detalles: form.detalles.map(d => ({
          idProducto: d.productoId,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitarioUSD,
          descuento: 0,
        })),
      });
      toast.success('Cotización creada');
      setShowModal(false);
      setForm({ clienteNombre: '', clienteCelular: '', validezDias: 7, observacion: '', detalles: [] });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
  };

  const sendWhatsApp = (cot) => {
    const celular = cot.clienteTelefono || cot.clienteCelular;
    if (!celular) { toast.warning('El cliente no tiene celular registrado'); return; }
    const total = cot.total || cot.totalUSD;
    const dias = cot.diasValidez || cot.validezDias;
    const msg = encodeURIComponent(
      `Hola ${cot.clienteNombre}, le compartimos su cotización #${cot.id} por un total de $${total?.toFixed(2)}. Válida por ${dias} días. — ElectroShop`
    );
    window.open(`https://wa.me/591${celular}?text=${msg}`, '_blank');
  };

  const filteredProds = productos.filter(p => p.nombre?.toLowerCase().includes(prodBusqueda.toLowerCase()));

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Cotizaciones</h1>
        <div className="flex gap-sm">
          <div className="search-bar"><Search size={16} className="search-icon"/>
            <input className="form-control" placeholder="Buscar por cliente o #..." value={inputBusqueda} onChange={e=>setInputBusqueda(e.target.value)}/></div>
          {tienePermiso('Cotizaciones','Crear') && <button className="btn btn-fire" onClick={()=>setShowModal(true)}><Plus size={16}/> Nueva</button>}
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Validez</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay cotizaciones registradas.'}
              </td></tr>
            ) : items.map(c=>(
              <tr key={c.id}>
                <td><strong>#{c.id}</strong></td>
                <td className="text-sm">{new Date(c.fechaCreacion || c.creadoEn).toLocaleDateString('es-BO')}</td>
                <td>{c.clienteNombre}</td>
                <td style={{fontWeight:700,color:'var(--yellow-400)'}}>${(c.total || c.totalUSD)?.toFixed(2)}</td>
                <td>{c.diasValidez || c.validezDias} días</td>
                <td><span className={`badge ${c.estado==='pendiente'?'badge-warning':'badge-success'}`}>{c.estado||'pendiente'}</span></td>
                <td><div className="flex gap-sm">
                  {(c.clienteTelefono || c.clienteCelular) && <button className="btn btn-ghost btn-sm" style={{color:'#22c55e'}} onClick={()=>sendWhatsApp(c)} title="Enviar por WhatsApp"><Send size={14}/></button>}
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
        />
      </div>

      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Nueva Cotización" size="lg">
        <div className="grid-2">
          <div className="form-group"><label>Cliente *</label>
            <input className="form-control" value={form.clienteNombre} onChange={e=>setForm({...form,clienteNombre:e.target.value})} placeholder="Nombre del cliente"/></div>
          <div className="form-group"><label>Celular</label>
            <input className="form-control" value={form.clienteCelular} onChange={e=>setForm({...form,clienteCelular:e.target.value})} placeholder="Ej: 70012345"/></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>Validez (días)</label>
            <input type="number" className="form-control" min="1" value={form.validezDias} onChange={e=>setForm({...form,validezDias:e.target.value})}/></div>
          <div className="form-group"><label>Observación</label>
            <input className="form-control" value={form.observacion} onChange={e=>setForm({...form,observacion:e.target.value})}/></div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 8 }}>
          <div className="search-bar mb-1"><Search size={14} className="search-icon"/>
            <input className="form-control" style={{fontSize:'0.8rem'}} placeholder="Buscar producto..." value={prodBusqueda} onChange={e=>setProdBusqueda(e.target.value)}/></div>
          <div style={{ maxHeight: 150, overflowY: 'auto', marginBottom: 12 }}>
            {filteredProds.slice(0, 10).map(p => (
              <div key={p.id} className="cliente-option" onClick={() => addDetalle(p)}>
                <span>{p.nombre}</span><span className="text-muted text-sm">${(p.precioVenta || p.precioVentaUSD || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {form.detalles.length > 0 && (
            <div className="table-container" style={{ marginBottom: 12 }}>
              <table>
                <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
                <tbody>
                  {form.detalles.map(d=>(
                    <tr key={d.productoId}>
                      <td>{d.nombre}</td>
                      <td><input type="number" min="1" style={{width:50,padding:'4px',background:'var(--bg-input)',border:'1px solid var(--border-color)',borderRadius:4,color:'var(--text-primary)',textAlign:'center'}}
                        value={d.cantidad} onChange={e=>setForm(prev=>({...prev,detalles:prev.detalles.map(x=>x.productoId===d.productoId?{...x,cantidad:Number(e.target.value)||1}:x)}))}/></td>
                      <td>${(d.precioUnitarioUSD || 0).toFixed(2)}</td>
                      <td style={{fontWeight:600}}>${((d.precioUnitarioUSD || 0) * d.cantidad).toFixed(2)}</td>
                      <td><button className="btn-ghost btn-icon" onClick={()=>removeDetalle(d.productoId)}><Trash2 size={14} color="var(--danger)"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="cart-summary" style={{borderRadius:'var(--radius-sm)'}}>
            <div className="summary-row total"><span>TOTAL:</span><span>${totalCotizacion.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
          <button className="btn btn-fire" onClick={handleSave}><FileText size={16}/> Crear Cotización</button>
        </div>
      </Modal>
    </div>
  );
}
