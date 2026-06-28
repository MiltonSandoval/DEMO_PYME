import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Proveedores() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' });
  const { tienePermiso } = useAuth();
  const toast = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setLoading(true); const res = await api.get('/proveedor'); setItems(res.data); }
    catch { toast.error('Error al cargar proveedores'); } finally { setLoading(false); }
  };

  const filtered = items.filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

  const openCreate = () => { setSelected(null); setForm({ nombre: '', contacto: '', telefono: '', email: '', direccion: '' }); setShowModal(true); };
  const openEdit = (item) => { setSelected(item); setForm({ nombre: item.nombre||'', contacto: item.contacto||'', telefono: item.telefono||'', email: item.email||'', direccion: item.direccion||'' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    try {
      if (selected) { await api.put(`/proveedor/${selected.id}`, form); toast.success('Proveedor actualizado'); }
      else { await api.post('/proveedor', form); toast.success('Proveedor creado'); }
      setShowModal(false); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/proveedor/${selected.id}`); toast.success('Proveedor eliminado'); setShowConfirm(false); loadData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error al eliminar'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Proveedores</h1>
        <div className="flex gap-sm">
          <div className="search-bar"><Search size={16} className="search-icon"/>
            <input className="form-control" placeholder="Buscar..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/></div>
          {tienePermiso('Proveedores','Crear') && <button className="btn btn-fire" onClick={openCreate}><Plus size={16}/> Nuevo</button>}
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.map(p=>(
              <tr key={p.id}>
                <td><strong>{p.nombre}</strong></td><td>{p.contacto||'—'}</td><td>{p.telefono||'—'}</td>
                <td className="text-muted">{p.email||'—'}</td>
                <td>{p.direccion||'—'}</td>
                <td><div className="flex gap-sm">
                  {tienePermiso('Proveedores','Editar') && <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(p)}><Edit2 size={14}/></button>}
                  {tienePermiso('Proveedores','Eliminar') && <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>{setSelected(p);setShowConfirm(true);}}><Trash2 size={14}/></button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={selected?'Editar Proveedor':'Nuevo Proveedor'}>
        <div className="grid-2">
          <div className="form-group"><label>Nombre *</label><input className="form-control" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></div>
          <div className="form-group"><label>Contacto</label><input className="form-control" value={form.contacto} onChange={e=>setForm({...form,contacto:e.target.value})}/></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>Teléfono</label><input className="form-control" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}/></div>
          <div className="form-group"><label>Email</label><input className="form-control" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
        </div>
        <div className="form-group"><label>Dirección</label><input className="form-control" value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})}/></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
          <button className="btn btn-fire" onClick={handleSave}>{selected?'Actualizar':'Crear'}</button>
        </div>
      </Modal>
      <ConfirmDialog isOpen={showConfirm} onClose={()=>setShowConfirm(false)} onConfirm={handleDelete}
        title="¿Eliminar proveedor?" message={`Se eliminará "${selected?.nombre}".`}/>
    </div>
  );
}
