import { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard,
  DollarSign, Truck, Percent, CheckCircle, Printer,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import './POS.css';

export default function POS() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [tipoCambio, setTipoCambio] = useState(1);
  const [monedaVista, setMonedaVista] = useState('USD');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [descuento, setDescuento] = useState(0);
  const [esDelivery, setEsDelivery] = useState(false);
  const [costoDelivery, setCostoDelivery] = useState(0);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastVenta, setLastVenta] = useState(null);
  const [clienteBusqueda, setClienteBusqueda] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', ci: '', telefono: '' });
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, clienteRes, configRes] = await Promise.allSettled([
        api.get('/producto'),
        api.get('/cliente'),
        api.get('/configuracion'),
      ]);
      if (prodRes.status === 'fulfilled') setProductos(prodRes.value.data.filter(p => p.activo !== false));
      if (clienteRes.status === 'fulfilled') setClientes(clienteRes.value.data);
      if (configRes.status === 'fulfilled') {
        const tc = configRes.value.data?.tipoCambioBs || 1;
        setTipoCambio(tc);
      }
    } catch { /* ignore */ }
  };

  // Filter products by search
  const filteredProducts = productos.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigoBarras?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Cart operations
  const addToCart = (producto) => {
    setCarrito((prev) => {
      const existing = prev.find((c) => c.productoId === producto.id);
      if (existing) {
        if (existing.cantidad >= producto.stock) {
          toast.warning('Stock insuficiente');
          return prev;
        }
        return prev.map((c) =>
          c.productoId === producto.id ? { ...c, cantidad: c.cantidad + 1 } : c
        );
      }
      if (producto.stock <= 0) {
        toast.warning('Producto agotado');
        return prev;
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precioUnitarioUSD: producto.precioVenta || producto.precioVentaUSD,
          cantidad: 1,
          stock: producto.stock,
        },
      ];
    });
  };

  const updateQty = (productoId, delta) => {
    setCarrito((prev) =>
      prev
        .map((c) => {
          if (c.productoId !== productoId) return c;
          const newQty = c.cantidad + delta;
          if (newQty > c.stock) {
            toast.warning('Stock insuficiente');
            return c;
          }
          return { ...c, cantidad: Math.max(0, newQty) };
        })
        .filter((c) => c.cantidad > 0)
    );
  };

  const removeFromCart = (productoId) => {
    setCarrito((prev) => prev.filter((c) => c.productoId !== productoId));
  };

  // Calculations
  const subtotalUSD = carrito.reduce((s, c) => s + c.precioUnitarioUSD * c.cantidad, 0);
  const descuentoMonto = (subtotalUSD * descuento) / 100;
  const deliveryCost = esDelivery ? costoDelivery : 0;
  const totalUSD = subtotalUSD - descuentoMonto + deliveryCost;
  const totalBs = totalUSD * tipoCambio;

  const convertPrice = (usd) => {
    if (monedaVista === 'Bs') return (usd * tipoCambio).toFixed(2) + ' Bs';
    return '$' + usd.toFixed(2);
  };

  // Cliente express
  const handleClienteExpress = async () => {
    if (!nuevoCliente.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    try {
      const res = await api.post('/cliente', nuevoCliente);
      setClientes((prev) => [...prev, res.data]);
      setClienteSeleccionado(res.data);
      setShowClienteModal(false);
      setNuevoCliente({ nombre: '', ci: '', telefono: '' });
      toast.success('Cliente registrado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar cliente');
    }
  };

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre?.toLowerCase().includes(clienteBusqueda.toLowerCase()) ||
      c.ci?.includes(clienteBusqueda)
  );

  // Checkout
  const handleCheckout = async () => {
    if (carrito.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    setLoading(true);
    try {
      // Map payment method name to database seed ID (1 = efectivo, 2 = transferencia, 3 = delivery)
      let idMetodoPago = 1;
      if (metodoPago === 'Tarjeta' || metodoPago === 'Transferencia' || metodoPago === 'QR' || metodoPago === 'Mixto') {
        idMetodoPago = 2;
      } else if (metodoPago === 'Delivery') {
        idMetodoPago = 3;
      }

      // Ensure idCliente is resolved (default to first available client or 1)
      const idCliente = clienteSeleccionado?.id || (clientes.length > 0 ? clientes[0].id : 1);

      const body = {
        idCliente: idCliente,
        idMetodoPago: idMetodoPago,
        subtotal: subtotalUSD,
        descuento: descuento,
        montoDescuento: descuentoMonto,
        impuesto: 0,
        total: totalUSD,
        efectivoRecibido: totalUSD,
        direccionEnvio: esDelivery ? 'Delivery' : null,
        detalles: carrito.map((c) => ({
          idProducto: c.productoId,
          cantidad: c.cantidad,
          precioUnitario: c.precioUnitarioUSD,
        })),
      };
      const res = await api.post('/pos/vender', body);
      setLastVenta({
        id: res.data.id,
        totalUSD: totalUSD,
        hashQR: res.data.hashQR
      });
      setShowCheckoutModal(false);
      setShowReceiptModal(true);
      setCarrito([]);
      setClienteSeleccionado(null);
      setDescuento(0);
      setEsDelivery(false);
      setCostoDelivery(0);
      toast.success('Venta registrada con éxito');
      loadData(); // Refresh stock
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pos-page">
      <div className="page-header">
        <h1>Punto de Venta</h1>
        <div className="flex gap-sm items-center">
          <span className="text-sm text-muted">TC: {tipoCambio} Bs</span>
          <button
            className={`btn btn-sm ${monedaVista === 'USD' ? 'btn-fire' : 'btn-secondary'}`}
            onClick={() => setMonedaVista('USD')}
          >
            USD
          </button>
          <button
            className={`btn btn-sm ${monedaVista === 'Bs' ? 'btn-fire' : 'btn-secondary'}`}
            onClick={() => setMonedaVista('Bs')}
          >
            Bs
          </button>
        </div>
      </div>

      <div className="pos-layout">
        {/* Products Panel */}
        <div className="pos-products">
          <div className="search-bar mb-2">
            <Search size={16} className="search-icon" />
            <input
              ref={searchRef}
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="products-grid">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className={`product-card ${p.stock <= 0 ? 'out-of-stock' : ''}`}
                onClick={() => addToCart(p)}
              >
                <div className="product-name">{p.nombre}</div>
                <div className="product-price">{convertPrice(p.precioVenta || p.precioVentaUSD)}</div>
                <div className={`product-stock ${p.stock <= (p.stockMinimo || 5) ? 'low' : ''}`}>
                  Stock: {p.stock}
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-muted text-sm" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>
                No se encontraron productos
              </p>
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="pos-cart">
          <div className="cart-header">
            <h3><ShoppingCart size={18} /> Carrito ({carrito.length})</h3>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowClienteModal(true)}
            >
              <User size={14} />
              {clienteSeleccionado ? clienteSeleccionado.nombre : 'Cliente'}
            </button>
          </div>

          <div className="cart-items">
            {carrito.length === 0 ? (
              <div className="cart-empty">
                <ShoppingCart size={40} />
                <p>Agregue productos al carrito</p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.productoId} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.nombre}</span>
                    <span className="cart-item-price">
                      {convertPrice(item.precioUnitarioUSD)} c/u
                    </span>
                  </div>
                  <div className="cart-item-actions">
                    <button className="btn-icon btn-ghost" onClick={() => updateQty(item.productoId, -1)}>
                      <Minus size={14} />
                    </button>
                    <span className="cart-item-qty">{item.cantidad}</span>
                    <button className="btn-icon btn-ghost" onClick={() => updateQty(item.productoId, 1)}>
                      <Plus size={14} />
                    </button>
                    <button className="btn-icon btn-ghost" onClick={() => removeFromCart(item.productoId)} style={{ color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="cart-item-subtotal">
                    {convertPrice(item.precioUnitarioUSD * item.cantidad)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{convertPrice(subtotalUSD)}</span>
            </div>
            {descuento > 0 && (
              <div className="summary-row discount">
                <span>Descuento ({descuento}%):</span>
                <span>-{convertPrice(descuentoMonto)}</span>
              </div>
            )}
            {esDelivery && (
              <div className="summary-row">
                <span>Delivery:</span>
                <span>+{convertPrice(costoDelivery)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>TOTAL:</span>
              <span>{monedaVista === 'Bs' ? totalBs.toFixed(2) + ' Bs' : '$' + totalUSD.toFixed(2)}</span>
            </div>
            {monedaVista === 'USD' && (
              <div className="summary-row equiv">
                <span>Equivalente:</span>
                <span>{totalBs.toFixed(2)} Bs</span>
              </div>
            )}
          </div>

          <button
            className="btn btn-fire w-full checkout-btn"
            onClick={() => setShowCheckoutModal(true)}
            disabled={carrito.length === 0}
          >
            <CreditCard size={18} />
            Procesar Venta
          </button>
        </div>
      </div>

      {/* Cliente Modal */}
      <Modal isOpen={showClienteModal} onClose={() => setShowClienteModal(false)} title="Seleccionar Cliente" size="md">
        <div className="search-bar mb-2">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o CI..."
            value={clienteBusqueda}
            onChange={(e) => setClienteBusqueda(e.target.value)}
          />
        </div>

        <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
          {filteredClientes.map((c) => (
            <div
              key={c.id}
              className={`cliente-option ${clienteSeleccionado?.id === c.id ? 'selected' : ''}`}
              onClick={() => { setClienteSeleccionado(c); setShowClienteModal(false); }}
            >
              <span>{c.nombre}</span>
              <span className="text-muted text-sm">{c.ci || 'Sin CI'}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
          <h4 style={{ fontSize: '0.85rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
            Registro Rápido
          </h4>
          <div className="grid-2">
            <div className="form-group">
              <label>Nombre</label>
              <input className="form-control" value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
            </div>
            <div className="form-group">
              <label>CI</label>
              <input className="form-control" value={nuevoCliente.ci}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, ci: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Celular/Teléfono</label>
            <input className="form-control" value={nuevoCliente.telefono}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
          </div>
          <button className="btn btn-fire w-full" onClick={handleClienteExpress}>
            <Plus size={16} /> Registrar y Seleccionar
          </button>
        </div>
      </Modal>

      {/* Checkout Modal */}
      <Modal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="Confirmar Venta" size="md">
        <div className="form-group">
          <label>Método de Pago</label>
          <select className="form-control" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
            <option value="QR">QR</option>
            <option value="Mixto">Mixto</option>
          </select>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Descuento (%)</label>
            <input type="number" className="form-control" min="0" max="100"
              value={descuento} onChange={(e) => setDescuento(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>¿Delivery?</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={esDelivery} onChange={(e) => setEsDelivery(e.target.checked)} />
                Sí
              </label>
              {esDelivery && (
                <input type="number" className="form-control" style={{ width: 100 }} min="0" step="0.5"
                  value={costoDelivery} onChange={(e) => setCostoDelivery(Number(e.target.value))}
                  placeholder="Costo USD" />
              )}
            </div>
          </div>
        </div>

        <div className="cart-summary" style={{ marginTop: 16 }}>
          <div className="summary-row total">
            <span>TOTAL A COBRAR:</span>
            <span>${totalUSD.toFixed(2)} / {totalBs.toFixed(2)} Bs</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowCheckoutModal(false)}>Cancelar</button>
          <button className="btn btn-fire" onClick={handleCheckout} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (
              <><CheckCircle size={16} /> Confirmar Venta</>
            )}
          </button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Venta Exitosa" size="sm">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle size={32} color="var(--success)" />
          </div>
          <h3 style={{ marginBottom: 8 }}>¡Venta Procesada!</h3>
          {lastVenta && (
            <>
              <p className="text-muted text-sm">Factura #{lastVenta.id}</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: '12px 0', color: 'var(--success)' }}>
                ${lastVenta.totalUSD?.toFixed(2)}
              </p>
            </>
          )}
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => setShowReceiptModal(false)}>Cerrar</button>
        </div>
      </Modal>
    </div>
  );
}
