import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Categorias() {
  const [items, setItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: '#ff3b30', icono: 'tag' });
  const { tienePermiso } = useAuth();
  const toast = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setLoading(true); const res = await api.get('/categoria'); setItems(res.data); }
    catch { toast.error('Error al cargar categorías'); }
    finally { setLoading(false); }
  };

  const filtered = items.filter(c => c.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

  const openCreate = () => { setSelected(null); setForm({ nombre: '', descripcion: '', color: '#ff3b30', icono: 'tag' }); setShowModal(true); };
  const openEdit = (item) => { setSelected(item); setForm({ nombre: item.nombre || '', descripcion: item.descripcion || '', color: item.color || '#ff3b30', icono: item.icono || 'tag' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    try {
      if (selected) { await api.put(`/categoria/${selected.id}`, form); toast.success('Categoría actualizada'); }
      else { await api.post('/categoria', form); toast.success('Categoría creada'); }
      setShowModal(false); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/categoria/${selected.id}`); toast.success('Categoría eliminada'); setShowConfirm(false); loadData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error al eliminar'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Categorías</h1>
        <div className="flex gap-sm">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input className="form-control" placeholder="Buscar..." value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          {tienePermiso('Categorias', 'Crear') && (
            <button className="btn btn-fire" onClick={openCreate}><Plus size={16}/> Nueva</button>
          )}
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Color/Icono</th><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '50%',
                    background: c.color || '#ff3b30', color: '#fff', fontSize: 11, fontWeight: 'bold'
                  }}>
                    {c.icono?.substring(0, 3) || 'cat'}
                  </span>
                </td>
                <td><strong>{c.nombre}</strong></td>
                <td className="text-muted">{c.descripcion || '—'}</td>
                <td>
                  <div className="flex gap-sm">
                    {tienePermiso('Categorias', 'Editar') && <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Edit2 size={14}/></button>}
                    {tienePermiso('Categorias', 'Eliminar') && <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={() => {setSelected(c); setShowConfirm(true);}}><Trash2 size={14}/></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selected ? 'Editar Categoría' : 'Nueva Categoría'}>
        <div className="form-group"><label>Nombre *</label>
          <input className="form-control" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
        <div className="form-group"><label>Descripción</label>
          <textarea className="form-control" rows={2} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} /></div>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="form-group"><label>Icono *</label>
            <input className="form-control" value={form.icono} onChange={e => setForm({...form, icono: e.target.value})} placeholder="Ej. tag, box, tv" /></div>
          <div className="form-group"><label>Color *</label>
            <input type="color" className="form-control" style={{ height: 38, padding: '2px 8px' }} value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
        </div>
        <div className="modal-footer" style={{ marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
          <button className="btn btn-fire" onClick={handleSave}>{selected ? 'Actualizar' : 'Crear'}</button>
        </div>
      </Modal>
      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleDelete}
        title="¿Eliminar categoría?" message={`Se eliminará "${selected?.nombre}".`} />
    </div>
  );
}
