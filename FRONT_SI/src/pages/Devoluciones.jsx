import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

export default function Devoluciones() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ventaId: '', productoId: '', cantidad: 1, motivo: '', tipo: 'Devolucion' });
  const [ventaProductos, setVentaProductos] = useState([]);
  const [cargandoVenta, setCargandoVenta] = useState(false);
  const { tienePermiso } = useAuth();
  const toast = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setLoading(true); const res = await api.get('/devolucion'); setItems(res.data); }
    catch { toast.error('Error al cargar devoluciones'); } finally { setLoading(false); }
  };

  const filtered = items.filter(d =>
    d.motivo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.id?.toString().includes(busqueda)
  );

  const handleCargarVenta = async (ventaId) => {
    if (!ventaId) {
      setVentaProductos([]);
      return;
    }
    try {
      setCargandoVenta(true);
      const res = await api.get(`/venta/${ventaId}`);
      const detalles = res.data.detalles || [];
      setVentaProductos(detalles);
      if (detalles.length > 0) {
        const firstProdId = detalles[0].productoId || detalles[0].producto?.id;
        setForm(prev => ({ ...prev, productoId: firstProdId }));
      } else {
        toast.warning('Esta venta no tiene productos registrados');
      }
    } catch {
      setVentaProductos([]);
      toast.error('No se pudo encontrar la venta con ese ID');
    } finally {
      setCargandoVenta(false);
    }
  };

  const handleSave = async () => {
    if (!form.ventaId || !form.productoId) { toast.error('Complete los campos requeridos'); return; }
    try {
      // 1. Fetch sale details to get the product unit price
      const ventaRes = await api.get(`/venta/${form.ventaId}`);
      const venta = ventaRes.data;
      
      // 2. Find the product in the sale details
      const detalleOriginal = venta.detalles?.find(d => d.productoId === Number(form.productoId) || d.producto?.id === Number(form.productoId));
      if (!detalleOriginal) {
        toast.error('El producto no pertenece a la venta original');
        return;
      }

      if (Number(form.cantidad) > detalleOriginal.cantidad) {
        toast.error(`La cantidad a devolver (${form.cantidad}) no puede ser mayor a la cantidad vendida (${detalleOriginal.cantidad})`);
        return;
      }
      
      const precioUnitario = detalleOriginal.precioUnitario || detalleOriginal.precioUnitarioUSD || 0;
      const totalReembolso = Number(form.cantidad) * precioUnitario;

      // 3. Post to devolucion
      await api.post('/devolucion', {
        idVenta: Number(form.ventaId),
        total: totalReembolso,
        metodoReembolso: 'efectivo',
        reingreso: form.tipo === 'Devolucion',
        notas: form.motivo,
        detalles: [{
          idProducto: Number(form.productoId),
          cantidad: Number(form.cantidad),
          precioUnitario: precioUnitario,
          motivo: form.motivo || 'Devolución'
        }]
      });
      toast.success('Devolución registrada');
      setShowModal(false);
      setForm({ ventaId: '', productoId: '', cantidad: 1, motivo: '', tipo: 'Devolucion' });
      setVentaProductos([]);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al registrar'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Devoluciones</h1>
        <div className="flex gap-sm">
          <div className="search-bar"><Search size={16} className="search-icon"/>
            <input className="form-control" placeholder="Buscar..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/></div>
          {tienePermiso('Devoluciones','Crear') && <button className="btn btn-fire" onClick={()=>{setVentaProductos([]); setForm({ ventaId: '', productoId: '', cantidad: 1, motivo: '', tipo: 'Devolucion' }); setShowModal(true);}}><Plus size={16}/> Nueva</button>}
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>#</th><th>Fecha</th><th>Venta #</th><th>Producto</th><th>Cant.</th><th>Tipo</th><th>Motivo</th></tr></thead>
          <tbody>
            {filtered.map(d=>(
              <tr key={d.id}>
                <td><strong>#{d.id}</strong></td>
                <td className="text-sm">{new Date(d.fecha || d.creadoEn).toLocaleDateString('es-BO')}</td>
                <td>#{d.idVenta || d.ventaId}</td>
                <td>{d.productoNombre||`#${d.productoId}`}</td>
                <td>{d.cantidad}</td>
                <td><span className={`badge ${d.tipo==='Devolucion'?'badge-info':'badge-warning'}`}>{d.tipo}</span></td>
                <td className="text-muted">{d.motivo||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Nueva Devolución">
        <div className="grid-2">
          <div className="form-group">
            <label>ID Venta *</label>
            <div className="flex gap-xs">
              <input type="number" className="form-control" value={form.ventaId} onChange={e=>setForm({...form,ventaId:e.target.value})} placeholder="Ej: 42"/>
              <button type="button" className="btn btn-secondary" onClick={() => handleCargarVenta(form.ventaId)} disabled={cargandoVenta}>
                {cargandoVenta ? 'Cargando...' : 'Cargar'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Producto *</label>
            <select className="form-control" value={form.productoId} onChange={e=>setForm({...form,productoId:e.target.value})} disabled={ventaProductos.length === 0}>
              {ventaProductos.length === 0 ? (
                <option value="">Busque un ID de venta válido</option>
              ) : (
                ventaProductos.map(d => {
                  const pId = d.productoId || d.producto?.id;
                  const pNombre = d.producto?.nombre || d.productoNombre || `#${pId}`;
                  return <option key={pId} value={pId}>{pNombre} (Cant: {d.cantidad})</option>;
                })
              )}
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>Cantidad</label>
            <input type="number" className="form-control" min="1" value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})}/></div>
          <div className="form-group"><label>Tipo</label>
            <select className="form-control" value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
              <option value="Devolucion">Devolución</option>
              <option value="Merma">Merma</option>
            </select></div>
        </div>
        <div className="form-group"><label>Motivo</label>
          <textarea className="form-control" rows={3} value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value})} placeholder="Describa el motivo..."/></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
          <button className="btn btn-fire" onClick={handleSave}>Registrar</button>
        </div>
      </Modal>
    </div>
  );
}
