import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Flame, Search } from 'lucide-react';
import api from '../services/api';
import './Login.css'; /* Reuse login background styles */

export default function Validar() {
  const [searchParams] = useSearchParams();
  const [hash, setHash] = useState(searchParams.get('qr') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const qr = searchParams.get('qr');
    if (qr) {
      setHash(qr);
      validar(qr);
    }
  }, [searchParams]);

  const validar = async (h) => {
    const hashToUse = h || hash;
    if (!hashToUse.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.get('/validar', { params: { qr: hashToUse } });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Documento no encontrado o inválido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-blob blob-1" />
      <div className="login-blob blob-2" />

      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="login-header">
          <div className="login-logo">
            <Flame size={32} />
          </div>
          <h1>ElectroShop</h1>
          <p>Verificación de Documento</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              className="form-control"
              placeholder="Ingrese el código de verificación..."
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && validar()}
            />
          </div>
          <button
            className="btn btn-fire w-full"
            style={{ marginTop: 12 }}
            onClick={() => validar()}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : (
              'Verificar'
            )}
          </button>
        </div>

        {error && (
          <div style={{
            textAlign: 'center', padding: 24,
            background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239,68,68,0.2)'
          }}>
            <XCircle size={40} color="var(--danger)" style={{ marginBottom: 12 }} />
            <h3 style={{ marginBottom: 8, color: 'var(--danger)' }}>No Válido</h3>
            <p className="text-muted text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div style={{
            textAlign: 'center', padding: 24,
            background: 'rgba(34,197,94,0.08)', borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(34,197,94,0.2)'
          }}>
            <CheckCircle size={40} color="var(--success)" style={{ marginBottom: 12 }} />
            <h3 style={{ marginBottom: 8, color: 'var(--success)' }}>✓ Documento Válido</h3>
            <div style={{ textAlign: 'left', marginTop: 16 }}>
              <div className="flex justify-between mb-1">
                <span className="text-muted text-sm">Tipo:</span>
                <strong>{result.tipo === 'venta' ? 'Venta (Factura)' : result.tipo === 'cotizacion' ? 'Cotización' : (result.tipo || 'Documento')}</strong>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-muted text-sm">Nro:</span>
                <strong>#{result.id}</strong>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-muted text-sm">Fecha:</span>
                <span>{result.fecha || result.fechaCreacion ? new Date(result.fecha || result.fechaCreacion).toLocaleDateString('es-BO') : '—'}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-muted text-sm">Total:</span>
                <strong style={{ color: 'var(--yellow-400)' }}>${(result.total || result.totalUSD || 0).toFixed(2)}</strong>
              </div>
              {(result.cliente || result.clienteNombre) && (
                <div className="flex justify-between">
                  <span className="text-muted text-sm">Cliente:</span>
                  <span>{result.cliente?.nombre || result.clienteNombre || '—'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="login-footer">
          <span>Sistema de verificación ElectroShop POS</span>
        </div>
      </div>
    </div>
  );
}
