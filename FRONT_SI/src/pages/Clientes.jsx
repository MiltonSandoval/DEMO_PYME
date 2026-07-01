import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

export default function Clientes() {
  const [allItems, setAllItems] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', ci: '', telefono: '', email: '', direccion: '' });

  // Paginación cliente-side
  // Modificación de paginación cliente-side
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { tienePermiso } = useAuth();
  const toast = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/cliente');
      const data = res.data.items ?? res.data;
      setAllItems(data);
    } catch { toast.error('Error al cargar clientes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtrado y paginación cliente-side
  const filtered = allItems.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.ci?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.toLowerCase().includes(busqueda.toLowerCase())
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

  const openCreate = () => { setSelected(null); setForm({ nombre: '', ci: '', telefono: '', email: '', direccion: '' }); setShowModal(true); };
  const openEdit = (item) => {
    setSelected(item);
    setForm({ nombre: item.nombre||'', ci: item.ci||'', telefono: item.telefono||'', email: item.email||'', direccion: item.direccion||'' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    try {
      if (selected) { await api.put(`/cliente/${selected.id}`, form); toast.success('Cliente actualizado'); }
      else { await api.post('/cliente', form); toast.success('Cliente creado'); }
      setShowModal(false); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/cliente/${selected.id}`); toast.success('Cliente eliminado'); setShowConfirm(false); loadData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error al eliminar'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Clientes</h1>
        <div className="flex gap-sm">
          <div className="search-bar"><Search size={16} className="search-icon"/>
            <input className="form-control" placeholder="Buscar por nombre, CI o celular..."
              value={inputBusqueda} onChange={e => setInputBusqueda(e.target.value)}/></div>
          {tienePermiso('Clientes','Crear') && <button className="btn btn-fire" onClick={openCreate}><Plus size={16}/> Nuevo</button>}
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Nombre</th><th>CI</th><th>Celular/Teléfono</th><th>Email</th><th>Dirección</th><th>Acciones</th></tr></thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay clientes registrados.'}
              </td></tr>
            ) : items.map(c=>(
              <tr key={c.id}>
                <td><strong>{c.nombre}</strong></td><td>{c.ci||'—'}</td><td>{c.telefono||'—'}</td>
                <td className="text-muted">{c.email||'—'}</td><td className="text-muted">{c.direccion||'—'}</td>
                <td><div className="flex gap-sm">
                  {tienePermiso('Clientes','Editar') && <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(c)}><Edit2 size={14}/></button>}
                  {tienePermiso('Clientes','Eliminar') && <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>{setSelected(c);setShowConfirm(true);}}><Trash2 size={14}/></button>}
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
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={selected?'Editar Cliente':'Nuevo Cliente'}>
        <div className="grid-2">
          <div className="form-group"><label>Nombre *</label><input className="form-control" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></div>
          <div className="form-group"><label>CI</label><input className="form-control" value={form.ci} onChange={e=>setForm({...form,ci:e.target.value})}/></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>Celular/Teléfono</label><input className="form-control" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}/></div>
          <div className="form-group"><label>Email</label><input className="form-control" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
        </div>
        <div className="form-group"><label>Dirección</label><input className="form-control" value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})}/></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
          <button className="btn btn-fire" onClick={handleSave}>{selected?'Actualizar':'Crear'}</button>
        </div>
      </Modal>
      <ConfirmDialog isOpen={showConfirm} onClose={()=>setShowConfirm(false)} onConfirm={handleDelete}
        title="¿Eliminar cliente?" message={`Se eliminará "${selected?.nombre}".`}/>
    </div>
  );
}
