import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Trabajadores() {
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', ci: '', celular: '', usuario: '', contrasena: '', rolId: '', activo: true });
  const { tienePermiso } = useAuth();
  const toast = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, rRes] = await Promise.all([api.get('/trabajador'), api.get('/rol')]);
      setItems(tRes.data);
      setRoles(rRes.data);
    } catch { toast.error('Error al cargar trabajadores'); }
    finally { setLoading(false); }
  };

  const filtered = items.filter(t =>
    t.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    t.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const openCreate = () => {
    setSelected(null);
    setForm({ nombre: '', ci: '', celular: '', usuario: '', contrasena: '', rolId: roles[0]?.id || '', activo: true });
    setShowModal(true);
  };
  const openEdit = (item) => {
    setSelected(item);
    setForm({
      nombre: item.nombre||'',
      ci: item.ci||'',
      celular: item.telefono||'',
      usuario: item.email||'',
      contrasena: '',
      rolId: item.idRol||'',
      activo: item.estado === 'activo'
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.usuario.trim()) { toast.error('Nombre y correo son requeridos'); return; }
    if (!selected && !form.contrasena) { toast.error('La contraseña es requerida'); return; }
    try {
      const body = {
        nombre: form.nombre,
        idRol: form.rolId ? Number(form.rolId) : null,
        email: form.usuario,
        password: form.contrasena,
        telefono: form.celular,
        direccion: selected?.direccion || '',
        estado: form.activo ? 'activo' : 'inactivo',
        fechaIngreso: selected?.fechaIngreso || new Date().toISOString().split('T')[0],
        salario: selected?.salario || 0
      };
      if (!body.password) delete body.password;
      if (selected) {
        await api.put(`/trabajador/${selected.id}`, body);
        toast.success('Trabajador actualizado');
      } else {
        await api.post('/trabajador', body);
        toast.success('Trabajador creado');
      }
      setShowModal(false); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/trabajador/${selected.id}`); toast.success('Trabajador eliminado'); setShowConfirm(false); loadData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error al eliminar'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Trabajadores</h1>
        <div className="flex gap-sm">
          <div className="search-bar"><Search size={16} className="search-icon"/>
            <input className="form-control" placeholder="Buscar..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/></div>
          {tienePermiso('Trabajadores','Crear') && <button className="btn btn-fire" onClick={openCreate}><Plus size={16}/> Nuevo</button>}
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Nombre</th><th>CI</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtered.map(t=>(
              <tr key={t.id}>
                <td><strong>{t.nombre}</strong></td>
                <td>{t.ci||'—'}</td>
                <td>{t.email}</td>
                <td><span className="badge badge-fire">{t.rol?.nombre || t.rolNombre || 'Sin rol'}</span></td>
                <td><span className={`badge ${t.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>{t.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
                <td><div className="flex gap-sm">
                  {tienePermiso('Trabajadores','Editar') && <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(t)}><Edit2 size={14}/></button>}
                  {tienePermiso('Trabajadores','Eliminar') && <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>{setSelected(t);setShowConfirm(true);}}><Trash2 size={14}/></button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={selected?'Editar Trabajador':'Nuevo Trabajador'} size="lg">
        <div className="grid-2">
          <div className="form-group"><label>Nombre *</label><input className="form-control" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></div>
          <div className="form-group"><label>CI</label><input className="form-control" value={form.ci} onChange={e=>setForm({...form,ci:e.target.value})}/></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>Celular</label><input className="form-control" value={form.celular} onChange={e=>setForm({...form,celular:e.target.value})}/></div>
          <div className="form-group"><label>Rol</label>
            <select className="form-control" value={form.rolId} onChange={e=>setForm({...form,rolId:e.target.value})}>
              <option value="">Sin rol</option>
              {roles.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>Usuario *</label><input className="form-control" value={form.usuario} onChange={e=>setForm({...form,usuario:e.target.value})}/></div>
          <div className="form-group"><label>{selected?'Nueva Contraseña (dejar vacío para mantener)':'Contraseña *'}</label>
            <input type="password" className="form-control" value={form.contrasena} onChange={e=>setForm({...form,contrasena:e.target.value})}/></div>
        </div>
        <div className="form-group"><label>Estado</label>
          <select className="form-control" value={form.activo?'true':'false'} onChange={e=>setForm({...form,activo:e.target.value==='true'})}>
            <option value="true">Activo</option><option value="false">Inactivo</option></select></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
          <button className="btn btn-fire" onClick={handleSave}>{selected?'Actualizar':'Crear'}</button>
        </div>
      </Modal>
      <ConfirmDialog isOpen={showConfirm} onClose={()=>setShowConfirm(false)} onConfirm={handleDelete}
        title="¿Eliminar trabajador?" message={`Se eliminará "${selected?.nombre}".`}/>
    </div>
  );
}
