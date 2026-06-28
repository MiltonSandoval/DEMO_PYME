import { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function Configuracion() {
  const [config, setConfig] = useState({
    nombre: '', razonSocial: '', ruc: '', direccion: '', ciudad: '', pais: '',
    telefono: '', celular: '', email: '', sitioWeb: '', regimenTributario: '',
    logoImagen: '', iva: 0, prefijoFactura: 'F', secuencialFactura: 1,
    secuencialCotizacion: 1, monedaBase: 'USD', simboloMoneda: '$',
    monedaVisualizacion: 'USD', tipoCambio: 1, mensajeRecibo: '', pieFactura: '',
    plantillaRecibo: 'T1', plantillaCotizacion: 'T1', codigoPaisWhatsapp: '591',
    mensajeWhatsapp: '', claveFirmaDigital: ''
  });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/configuracion');
      if (res.data) setConfig(res.data);
    } catch { /* first time — empty */ }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      await api.put('/configuracion', {
        ...config,
        tipoCambio: Number(config.tipoCambio),
        iva: Number(config.iva),
        secuencialFactura: Number(config.secuencialFactura),
        secuencialCotizacion: Number(config.secuencialCotizacion)
      });
      toast.success('Configuración guardada exitosamente');
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/><span>Cargando...</span></div>;

  return (
    <div style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="page-header">
        <h1>Configuración</h1>
        <button className="btn btn-fire" onClick={handleSave}>
          <Save size={16}/> Guardar Cambios
        </button>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: '1rem' }}>
          <SettingsIcon size={18}/> Datos del Negocio
        </h3>

        <div className="grid-2">
          <div className="form-group"><label>Nombre del Negocio</label>
            <input className="form-control" value={config.nombre}
              onChange={e=>setConfig({...config, nombre: e.target.value})}/></div>
          <div className="form-group"><label>NIT / RUC</label>
            <input className="form-control" value={config.ruc || ''}
              onChange={e=>setConfig({...config, ruc: e.target.value})}/></div>
        </div>
        <div className="grid-2">
          <div className="form-group"><label>Teléfono</label>
            <input className="form-control" value={config.telefono || ''}
              onChange={e=>setConfig({...config, telefono: e.target.value})}/></div>
          <div className="form-group"><label>Dirección</label>
            <input className="form-control" value={config.direccion || ''}
              onChange={e=>setConfig({...config, direccion: e.target.value})}/></div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 12 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: '1rem', color: 'var(--yellow-400)' }}>
            💱 Moneda y Tipo de Cambio
          </h3>
          <div className="grid-2">
            <div className="form-group"><label>Moneda Visualización</label>
              <select className="form-control" value={config.monedaVisualizacion}
                onChange={e=>setConfig({...config, monedaVisualizacion: e.target.value})}>
                <option value="USD">USD (Dólares)</option>
                <option value="Bs">Bs (Bolivianos)</option>
              </select></div>
            <div className="form-group"><label>Tipo de Cambio (1 USD = X Bs)</label>
              <input type="number" className="form-control" min="0" step="0.01"
                value={config.tipoCambio}
                onChange={e=>setConfig({...config, tipoCambio: e.target.value})}/></div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 12 }}>
          <div className="form-group"><label>URL del Logo</label>
            <input className="form-control" value={config.logoImagen || ''}
              onChange={e=>setConfig({...config, logoImagen: e.target.value})}
              placeholder="https://ejemplo.com/logo.png"/></div>
          {config.logoImagen && (
            <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <img src={config.logoImagen} alt="Logo" style={{ maxHeight: 80, objectFit: 'contain' }}
                onError={e => e.target.style.display = 'none'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
