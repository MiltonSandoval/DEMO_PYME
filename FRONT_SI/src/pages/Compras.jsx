import { useState, useEffect } from 'react';
import { Plus, Search, Eye } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

export default function Compras() {
  const [items, setItems] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ proveedorId: '', observacion: '', detalles: [] });
  const [prodBusqueda, setProdBusqueda] = useState('');
  const { tienePermiso } = useAuth();
  const toast = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, pRes, prRes] = await Promise.allSettled([
        api.get('/compra'), api.get('/producto'), api.get('/proveedor')
      ]);
      if (cRes.status === 'fulfilled') setItems(cRes.value.data);
      if (pRes.status === 'fulfilled') setProductos(pRes.value.data);
      if (prRes.status === 'fulfilled') setProveedores(prRes.value.data);
    } catch {} finally { setLoading(false); }
  };

  const filtered = items.filter(c =>
    c.proveedorNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.id?.toString().includes(busqueda)
  );

  const addDetalle = (prod) => {
    setForm(prev => {
      const existing = prev.detalles.find(d => d.productoId === prod.id);
      if (existing) return {...prev, detalles: prev.detalles.map(d => d.productoId === prod.id ? {...d, cantidad: d.cantidad+1} : d)};
      return {...prev, detalles: [...prev.detalles, { productoId: prod.id, nombre: prod.nombre, costoUnitarioUSD: prod.precioCompraUSD||0, cantidad: 1 }]};
    });
  };

  const totalCompra = form.detalles.reduce((s,d) => s + d.costoUnitarioUSD * d.cantidad, 0);

  const handleSave = async () => {
    if (!form.proveedorId) { toast.error('Seleccione un proveedor'); return; }
    if (form.detalles.length === 0) { toast.error('Agregue productos'); return; }
    try {
      await api.post('/compra', {
        idProveedor: Number(form.proveedorId),
        subtotal: totalCompra,
        impuesto: 0,
        total: totalCompra,
        fechaEsperada: new Date().toISOString().split('T')[0],
        notas: form.observacion,
        detalles: form.detalles.map(d => ({
          idProducto: d.productoId,
          cantidad: d.cantidad,
          costoUnitario: d.costoUnitarioUSD,
        })),
      });
      toast.success('Compra registrada — stock actualizado');
      setShowModal(false);
      setForm({ proveedorId: '', observacion: '', detalles: [] });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
  };

  const handleShowDetail = async (item) => {
    try {
      const res = await api.get(`/compra/${item.id}`);
      setSelected(res.data);
      setShowDetail(true);
    } catch {
      toast.error('Error al cargar detalles de la compra');
    }
  };

  const filteredProds = productos.filter(p => p.nombre?.toLowerCase().includes(prodBusqueda.toLowerCase()));

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Compras</h1>
        <div className="flex gap-sm">
          <div className="search-bar"><Search size={16} className="search-icon"/>
            <input className="form-control" placeholder="Buscar..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/></div>
          {tienePermiso('Compras','Crear') && <button className="btn btn-fire" onClick={()=>setShowModal(true)}><Plus size={16}/> Nueva Compra</button>}
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>#</th><th>Fecha</th><th>Proveedor</th><th>Total</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.map(c=>(
              <tr key={c.id}>
                <td><strong>#{c.id}</strong></td>
                <td className="text-sm">{new Date(c.fecha || c.creadoEn).toLocaleDateString('es-BO')}</td>
                <td>{c.proveedor || c.proveedorNombre || '—'}</td>
                <td style={{fontWeight:700,color:'var(--yellow-400)'}}>${(c.total || c.totalUSD)?.toFixed(2)}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={()=>handleShowDetail(c)}><Eye size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail */}
      <Modal isOpen={showDetail} onClose={()=>setShowDetail(false)} title={`Compra #${selected?.id}`} size="lg">
        {selected && (
          <>
            <div className="mb-2"><span className="text-muted text-sm">Proveedor:</span> <strong>{selected.proveedor?.nombre || selected.proveedorNombre || '—'}</strong></div>
            <div className="table-container">
              <table>
                <thead><tr><th>Producto</th><th>Cant.</th><th>Costo Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {selected.detalles?.map((d,i)=>(
                    <tr key={i}>
                      <td>{d.producto?.nombre || d.productoNombre || `#${d.productoId}`}</td>
                      <td>{d.cantidad}</td>
                      <td>${(d.costoUnitario || d.costoUnitarioUSD)?.toFixed(2)}</td>
                      <td style={{fontWeight:600}}>${(d.cantidad * (d.costoUnitario || d.costoUnitarioUSD)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>

      {/* Create */}
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Nueva Compra" size="lg">
        <div className="grid-2">
          <div className="form-group"><label>Proveedor *</label>
            <select className="form-control" value={form.proveedorId} onChange={e=>setForm({...form,proveedorId:e.target.value})}>
              <option value="">Seleccione...</option>
              {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select></div>
          <div className="form-group"><label>Observación</label>
            <input className="form-control" value={form.observacion} onChange={e=>setForm({...form,observacion:e.target.value})}/></div>
        </div>
        <div style={{borderTop:'1px solid var(--border-color)',paddingTop:16,marginTop:8}}>
          <div className="search-bar mb-1"><Search size={14} className="search-icon"/>
            <input className="form-control" style={{fontSize:'0.8rem'}} placeholder="Buscar producto..." value={prodBusqueda} onChange={e=>setProdBusqueda(e.target.value)}/></div>
          <div style={{maxHeight:120,overflowY:'auto',marginBottom:12}}>
            {filteredProds.slice(0,8).map(p=>(
              <div key={p.id} className="cliente-option" onClick={()=>addDetalle(p)}>
                <span>{p.nombre}</span><span className="text-muted text-sm">${p.precioCompraUSD?.toFixed(2)}</span>
              </div>
            ))}
          </div>
          {form.detalles.length > 0 && (
            <div className="table-container" style={{marginBottom:12}}>
              <table>
                <thead><tr><th>Producto</th><th>Cant.</th><th>Costo</th><th>Subtotal</th></tr></thead>
                <tbody>{form.detalles.map(d=>(
                  <tr key={d.productoId}><td>{d.nombre}</td>
                  <td><input type="number" min="1" style={{width:50,padding:'4px',background:'var(--bg-input)',border:'1px solid var(--border-color)',borderRadius:4,color:'var(--text-primary)',textAlign:'center'}}
                    value={d.cantidad} onChange={e=>setForm(prev=>({...prev,detalles:prev.detalles.map(x=>x.productoId===d.productoId?{...x,cantidad:Number(e.target.value)||1}:x)}))}/></td>
                  <td><input type="number" min="0" step="0.01" style={{width:70,padding:'4px',background:'var(--bg-input)',border:'1px solid var(--border-color)',borderRadius:4,color:'var(--text-primary)',textAlign:'center'}}
                    value={d.costoUnitarioUSD} onChange={e=>setForm(prev=>({...prev,detalles:prev.detalles.map(x=>x.productoId===d.productoId?{...x,costoUnitarioUSD:Number(e.target.value)||0}:x)}))}/></td>
                  <td style={{fontWeight:600}}>${(d.costoUnitarioUSD*d.cantidad).toFixed(2)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div className="cart-summary" style={{borderRadius:'var(--radius-sm)'}}>
            <div className="summary-row total"><span>TOTAL:</span><span>${totalCompra.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
          <button className="btn btn-fire" onClick={handleSave}>Registrar Compra</button>
        </div>
      </Modal>
    </div>
  );
}
