import { useState, useEffect } from 'react';
import { DollarSign, Lock, Unlock, Clock } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

export default function Caja() {
  const [sesionActiva, setSesionActiva] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [montoInicial, setMontoInicial] = useState(0);
  const [conteoEfectivo, setConteoEfectivo] = useState({
    b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, m5: 0, m2: 0, m1: 0, m050: 0, m020: 0, m010: 0
  });
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedNotas, setExpandedNotas] = useState({});
  const toast = useToast();

  const toggleNota = (id) => {
    setExpandedNotas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sesioncaja');
      const data = res.data;
      setSesiones(data);
      const activa = data.find(s => s.estado === 'abierta');
      setSesionActiva(activa || null);
    } catch { toast.error('Error al cargar sesiones de caja'); }
    finally { setLoading(false); }
  };

  const totalConteo = () => {
    const c = conteoEfectivo;
    return c.b200*200 + c.b100*100 + c.b50*50 + c.b20*20 + c.b10*10 +
           c.m5*5 + c.m2*2 + c.m1*1 + c.m050*0.5 + c.m020*0.2 + c.m010*0.1;
  };

  const handleAbrir = async () => {
    try {
      await api.post('/sesioncaja/abrir', { montoApertura: Number(montoInicial) });
      toast.success('Caja abierta exitosamente');
      setShowAbrirModal(false);
      setMontoInicial(0);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al abrir caja'); }
  };

  const handleCerrar = async () => {
    try {
      await api.put(`/sesioncaja/${sesionActiva.id}/cerrar`, {
        montoCierre: totalConteo(),
        conteoEfectivo: JSON.stringify(conteoEfectivo),
        notas: observacion,
      });
      toast.success('Caja cerrada exitosamente');
      setShowCerrarModal(false);
      setConteoEfectivo({ b200:0,b100:0,b50:0,b20:0,b10:0,m5:0,m2:0,m1:0,m050:0,m020:0,m010:0 });
      setObservacion('');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al cerrar caja'); }
  };

  const updateConteo = (key, val) => {
    setConteoEfectivo(prev => ({...prev, [key]: Number(val) || 0}));
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  const billetes = [
    { key: 'b200', label: 'Bs 200', val: 200 },
    { key: 'b100', label: 'Bs 100', val: 100 },
    { key: 'b50', label: 'Bs 50', val: 50 },
    { key: 'b20', label: 'Bs 20', val: 20 },
    { key: 'b10', label: 'Bs 10', val: 10 },
    { key: 'm5', label: 'Bs 5', val: 5 },
    { key: 'm2', label: 'Bs 2', val: 2 },
    { key: 'm1', label: 'Bs 1', val: 1 },
    { key: 'm050', label: 'Bs 0.50', val: 0.5 },
    { key: 'm020', label: 'Bs 0.20', val: 0.2 },
    { key: 'm010', label: 'Bs 0.10', val: 0.1 },
  ];

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Control de Caja</h1>
        <div className="flex gap-sm">
          {!sesionActiva ? (
            <button className="btn btn-fire" onClick={()=>setShowAbrirModal(true)}>
              <Unlock size={16}/> Abrir Caja
            </button>
          ) : (
            <button className="btn btn-danger" onClick={()=>setShowCerrarModal(true)}>
              <Lock size={16}/> Cerrar Caja
            </button>
          )}
        </div>
      </div>

      {/* Active Session */}
      {sesionActiva && (
        <div className="card card-fire mb-3">
          <div className="flex items-center gap-md">
            <div className="metric-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
              <Unlock size={24}/>
            </div>
            <div>
              <h3 style={{ marginBottom: 4 }}>Caja Abierta</h3>
              <p className="text-muted text-sm">
                Abierta el {new Date(sesionActiva.fechaApertura).toLocaleString('es-BO')} —
                Monto inicial: Bs {sesionActiva.montoApertura?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Cajero</th>
              <th>Apertura</th>
              <th>Cierre</th>
              <th>Monto Inicial</th>
              <th>Monto Esperado</th>
              <th>Monto Cierre</th>
              <th>Diferencia</th>
              <th>Estado</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {sesiones.map(s => {
              const diff = s.diferencia || 0;
              return (
                <tr key={s.id}>
                  <td><strong>#{s.id}</strong></td>
                  <td className="text-sm">{s.trabajador || '—'}</td>
                  <td className="text-sm">{new Date(s.fechaApertura).toLocaleString('es-BO')}</td>
                  <td className="text-sm">{s.fechaCierre ? new Date(s.fechaCierre).toLocaleString('es-BO') : '—'}</td>
                  <td>Bs {s.montoApertura?.toFixed(2)}</td>
                  <td>{s.montoEsperado != null ? `Bs ${s.montoEsperado.toFixed(2)}` : '—'}</td>
                  <td>{s.montoCierre != null ? `Bs ${s.montoCierre.toFixed(2)}` : '—'}</td>
                  <td>
                    {s.estado === 'abierta' ? (
                      <span className="text-muted">—</span>
                    ) : diff === 0 ? (
                      <span className="text-muted" style={{ fontWeight: 600 }}>Bs 0.00</span>
                    ) : (
                      <span style={{ color: diff > 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                        {diff > 0 ? '+' : ''}Bs {diff.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td><span className={`badge ${s.estado==='abierta'?'badge-success':'badge-info'}`}>{s.estado}</span></td>
                  <td
                    className="text-sm text-muted"
                    style={{
                      maxWidth: '200px',
                      cursor: s.notas ? 'pointer' : 'default',
                      whiteSpace: expandedNotas[s.id] ? 'normal' : 'nowrap',
                      overflow: expandedNotas[s.id] ? 'visible' : 'hidden',
                      textOverflow: expandedNotas[s.id] ? 'unset' : 'ellipsis',
                      wordBreak: 'break-word',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => s.notas && toggleNota(s.id)}
                    title={s.notas && !expandedNotas[s.id] ? "Haz clic para ver completo" : ""}
                  >
                    {s.notas ? (
                      <>
                        {s.notas}
                        {!expandedNotas[s.id] && s.notas.length > 25 && (
                          <span style={{ color: 'var(--color-primary, #3b82f6)', marginLeft: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            (ver más)
                          </span>
                        )}
                      </>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Abrir Modal */}
      <Modal isOpen={showAbrirModal} onClose={()=>setShowAbrirModal(false)} title="Abrir Caja">
        <div className="form-group"><label>Monto Inicial (Bs)</label>
          <input type="number" className="form-control" min="0" step="0.5" value={montoInicial}
            onChange={e=>setMontoInicial(e.target.value)}/></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setShowAbrirModal(false)}>Cancelar</button>
          <button className="btn btn-fire" onClick={handleAbrir}><Unlock size={16}/> Abrir</button>
        </div>
      </Modal>

      {/* Cerrar Modal */}
      <Modal isOpen={showCerrarModal} onClose={()=>setShowCerrarModal(false)} title="Cerrar Caja — Arqueo" size="lg">
        <p className="text-muted text-sm mb-2">Cuente los billetes y monedas en caja:</p>
        <div className="grid-3" style={{ gap: 8 }}>
          {billetes.map(b=>(
            <div key={b.key} className="flex items-center gap-sm" style={{ background:'var(--bg-input)', padding:'8px 12px', borderRadius:'var(--radius-sm)' }}>
              <span style={{ minWidth: 56, fontSize:'0.8rem', fontWeight:600 }}>{b.label}</span>
              <input type="number" className="form-control" style={{ padding:'6px 8px', width:60 }} min="0"
                value={conteoEfectivo[b.key]} onChange={e=>updateConteo(b.key, e.target.value)}/>
              <span className="text-muted text-xs">= Bs {(conteoEfectivo[b.key] * b.val).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="cart-summary" style={{ marginTop: 16, borderRadius:'var(--radius-sm)' }}>
          <div className="summary-row total">
            <span>TOTAL CONTEO:</span>
            <span>Bs {totalConteo().toFixed(2)}</span>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 16 }}><label>Observación</label>
          <textarea className="form-control" rows={2} value={observacion}
            onChange={e=>setObservacion(e.target.value)} placeholder="Notas adicionales..."/></div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setShowCerrarModal(false)}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleCerrar}><Lock size={16}/> Cerrar Caja</button>
        </div>
      </Modal>
    </div>
  );
}
