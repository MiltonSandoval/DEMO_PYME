import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

export default function Productos() {
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [form, setForm] = useState({
    nombre: '', codigoBarras: '', precioCompraUSD: 0,
    precioVentaUSD: 0, stock: 0, stockMinimo: 5, categoriaId: '', activo: true,
    unidad: 'und'
  });
  const { tienePermiso } = useAuth();
  const toast = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        api.get('/producto', { params: { page, pageSize, search: busqueda || undefined } }),
        api.get('/categoria'),
      ]);
      // La respuesta es paginada: { items, totalItems, totalPages, page, pageSize }
      setItems(pRes.data.items ?? pRes.data);
      setTotalItems(pRes.data.totalItems ?? pRes.data.length);
      setTotalPages(pRes.data.totalPages ?? 1);
      setCategorias(cRes.data);
    } catch { toast.error('Error al cargar productos'); }
    finally { setLoading(false); }
  }, [page, pageSize, busqueda]);

  useEffect(() => { loadData(); }, [loadData]);

  // Debounce búsqueda: esperar 400ms después de que el usuario deje de escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusqueda(inputBusqueda);
      setPage(1); // Reiniciar a página 1 al buscar
    }, 400);
    return () => clearTimeout(timer);
  }, [inputBusqueda]);

  const openCreate = () => {
    setSelected(null);
    setForm({ nombre: '', codigoBarras: '', precioCompraUSD: 0,
      precioVentaUSD: 0, stock: 0, stockMinimo: 5, categoriaId: categorias[0]?.id || '', activo: true, unidad: 'und' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setSelected(item);
    setForm({
      nombre: item.nombre || '',
      codigoBarras: item.codigo || item.codigoBarras || '', precioCompraUSD: item.precioCompra || item.precioCompraUSD || 0,
      precioVentaUSD: item.precioVenta || item.precioVentaUSD || 0, stock: item.stock || 0,
      stockMinimo: item.stockMinimo || 5, categoriaId: item.idCategoria || item.categoriaId || '',
      activo: item.estado === 'activo' || item.activo !== false, unidad: item.unidad || 'und'
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    if (!form.codigoBarras.trim()) { toast.error('El código es requerido'); return; }
    try {
      const body = {
        nombre: form.nombre,
        codigo: form.codigoBarras,
        idCategoria: form.categoriaId ? Number(form.categoriaId) : null,
        precioCompra: Number(form.precioCompraUSD),
        precioVenta: Number(form.precioVentaUSD),
        stock: Number(form.stock),
        stockMinimo: Number(form.stockMinimo),
        estado: form.activo ? 'activo' : 'inactivo',
        unidad: form.unidad || 'und',
      };
      if (selected) {
        await api.put(`/producto/${selected.id}`, body);
        toast.success('Producto actualizado');
      } else {
        await api.post('/producto', body);
        toast.success('Producto creado');
      }
      setShowModal(false);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/producto/${selected.id}`);
      toast.success('Producto eliminado');
      setShowConfirm(false);
      setSelected(null);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al eliminar'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Productos</h1>
        <div className="flex gap-sm">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              className="form-control"
              placeholder="Buscar nombre o código..."
              value={inputBusqueda}
              onChange={(e) => setInputBusqueda(e.target.value)}
            />
          </div>
          {tienePermiso('Productos', 'Crear') && (
            <button className="btn btn-fire" onClick={openCreate}><Plus size={16}/> Nuevo</button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th><th>Código</th><th>Categoría</th>
              <th>P. Compra</th><th>P. Venta</th><th>Stock</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay productos registrados.'}
              </td></tr>
            ) : items.map(p => (
              <tr key={p.id}>
                <td><strong>{p.nombre}</strong></td>
                <td className="text-muted">{p.codigo || p.codigoBarras || '—'}</td>
                <td>{p.categoria?.nombre || p.categoriaNombre || '—'}</td>
                <td>${(p.precioCompra || p.precioCompraUSD)?.toFixed(2)}</td>
                <td style={{ fontWeight: 600, color: 'var(--yellow-400)' }}>${(p.precioVenta || p.precioVentaUSD)?.toFixed(2)}</td>
                <td>
                  <span className={`badge ${p.stock <= (p.stockMinimo||5) ? (p.stock === 0 ? 'badge-danger' : 'badge-warning') : 'badge-success'}`}>
                    {p.stock}
                  </span>
                </td>
                <td><span className={`badge ${(p.estado === 'activo' || p.activo !== false) ? 'badge-success' : 'badge-danger'}`}>
                  {(p.estado === 'activo' || p.activo !== false) ? 'Activo' : 'Inactivo'}
                </span></td>
                <td>
                  <div className="flex gap-sm">
                    {tienePermiso('Productos', 'Editar') && (
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><Edit2 size={14}/></button>
                    )}
                    {tienePermiso('Productos', 'Eliminar') && (
                      <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}}
                        onClick={() => {setSelected(p); setShowConfirm(true);}}><Trash2 size={14}/></button>
                    )}
                  </div>
                </td>
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
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Modal CRUD */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={selected ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <div className="grid-2">
          <div className="form-group"><label>Nombre *</label>
            <input className="form-control" value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})} /></div>
          <div className="form-group"><label>Código de Barras *</label>
            <input className="form-control" value={form.codigoBarras}
              onChange={e => setForm({...form, codigoBarras: e.target.value})} /></div>
        </div>
        <div className="grid-3">
          <div className="form-group"><label>Categoría</label>
            <select className="form-control" value={form.categoriaId}
              onChange={e => setForm({...form, categoriaId: e.target.value})}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select></div>
          <div className="form-group"><label>Unidad *</label>
            <select className="form-control" value={form.unidad}
              onChange={e => setForm({...form, unidad: e.target.value})}>
              <option value="und">Unidad (und)</option>
              <option value="kg">Kilogramo (kg)</option>
              <option value="lt">Litro (lt)</option>
              <option value="gr">Gramo (gr)</option>
            </select></div>
          <div className="form-group"><label>Estado</label>
            <select className="form-control" value={form.activo ? 'true' : 'false'}
              onChange={e => setForm({...form, activo: e.target.value === 'true'})}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>Precio Compra (USD)</label>
            <input type="number" className="form-control" min="0" step="0.01"
              value={form.precioCompraUSD}
              onChange={e => setForm({...form, precioCompraUSD: e.target.value})} /></div>
          <div className="form-group"><label>Precio Venta (USD)</label>
            <input type="number" className="form-control" min="0" step="0.01"
              value={form.precioVentaUSD}
              onChange={e => setForm({...form, precioVentaUSD: e.target.value})} /></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>Stock</label>
            <input type="number" className="form-control" min="0"
              value={form.stock}
              onChange={e => setForm({...form, stock: e.target.value})} /></div>
          <div className="form-group"><label>Stock Mínimo</label>
            <input type="number" className="form-control" min="0"
              value={form.stockMinimo}
              onChange={e => setForm({...form, stockMinimo: e.target.value})} /></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
          <button className="btn btn-fire" onClick={handleSave}>
            {selected ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete} title="¿Eliminar producto?"
        message={`Se eliminará "${selected?.nombre}". Esta acción no se puede deshacer.`} />
    </div>
  );
}
