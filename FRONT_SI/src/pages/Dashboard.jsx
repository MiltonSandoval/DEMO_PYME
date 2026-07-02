import { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Calendar,
  CalendarDays,
  CalendarRange,
  AlertTriangle,
  Trophy,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { useToast } from '../components/Toast';
import './Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend, Filler
);

const fmt = (n) =>
  new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0);

const fmtNum = (n) => new Intl.NumberFormat('es-BO').format(n || 0);

const fmtDatetime = (d) =>
  new Date(d).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const CHART_TOOLTIP_OPTS = {
  backgroundColor: '#1a1a1e',
  borderColor: '#34343d',
  borderWidth: 1,
  titleColor: '#f3f4f6',
  bodyColor: '#9ca3af',
  cornerRadius: 8,
  padding: 12,
  callbacks: {
    label: (ctx) => ' $' + Number(ctx.raw).toFixed(2),
  },
};

const GRID_COLOR = 'rgba(52,52,61,0.35)';
const TICK_COLOR = '#9ca3af';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('30d'); // '7d', '30d', '2025', '2026', 'all', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const toast = useToast();

  const getDateParams = (type, start, end) => {
    const ahora = new Date();
    let startDateStr = null;
    let endDateStr = null;

    if (type === '7d') {
      const d = new Date();
      d.setDate(ahora.getDate() - 6);
      startDateStr = d.toISOString().split('T')[0] + 'T00:00:00Z';
      endDateStr = ahora.toISOString();
    } else if (type === '30d') {
      const d = new Date();
      d.setDate(ahora.getDate() - 29);
      startDateStr = d.toISOString().split('T')[0] + 'T00:00:00Z';
      endDateStr = ahora.toISOString();
    } else if (type === '2025') {
      startDateStr = '2025-01-01T00:00:00Z';
      endDateStr = '2025-12-31T23:59:59Z';
    } else if (type === '2026') {
      startDateStr = '2026-01-01T00:00:00Z';
      endDateStr = '2026-12-31T23:59:59Z';
    } else if (type === 'all') {
      startDateStr = '2020-01-01T00:00:00Z';
      endDateStr = ahora.toISOString();
    } else if (type === 'custom') {
      if (start) startDateStr = new Date(start + 'T00:00:00').toISOString();
      if (end) endDateStr = new Date(end + 'T23:59:59').toISOString();
    }

    return { startDate: startDateStr, endDate: endDateStr };
  };

  const loadDashboard = async (params = {}, isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const res = await api.get('/dashboard', { params });
      setData(res.data);
    } catch (err) {
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const params = getDateParams(filterType, customStart, customEnd);
    if (filterType !== 'custom' || (customStart && customEnd)) {
      loadDashboard(params);
    }
  }, [filterType, customStart, customEnd]);

  const getPeriodLabel = () => {
    if (filterType === '7d') return 'Ventas (7 Días)';
    if (filterType === '30d') return 'Ventas (30 Días)';
    if (filterType === '2025') return 'Ventas del Período (Año 2025)';
    if (filterType === '2026') return 'Ventas del Período (Año 2026)';
    if (filterType === 'all') return 'Ventas del Histórico Completo';
    return 'Ventas del Período Personalizado';
  };

  // ── Chart configs ─────────────────────────────────────────────────────────

  // ── Chart configs ─────────────────────────────────────────────────────────

  const lineChartData = data ? {
    labels: [
      ...(data.ventas15Dias || []).map((d) => d.label),
      ...(data.prediccionVentas || []).map((d) => d.label)
    ],
    datasets: [
      {
        label: 'Ventas Históricas',
        data: [
          ...(data.ventas15Dias || []).map((d) => d.value),
          ...Array((data.prediccionVentas || []).length).fill(null)
        ],
        fill: true,
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
          gradient.addColorStop(0, 'rgba(255,59,48,0.25)');
          gradient.addColorStop(1, 'rgba(244,180,0,0.02)');
          return gradient;
        },
        borderColor: '#ff3b30',
        borderWidth: 2.5,
        pointBackgroundColor: '#ff3b30',
        pointBorderColor: '#1a1a1e',
        pointBorderWidth: 2,
        pointRadius: (ctx) => (ctx.raw === null ? 0 : 4),
        pointHoverRadius: (ctx) => (ctx.raw === null ? 0 : 6),
        tension: 0.4,
      },
      {
        label: 'Tendencia Proyectada (Predictibilidad)',
        data: [
          ...Array(Math.max(0, (data.ventas15Dias || []).length - 1)).fill(null),
          (data.ventas15Dias || [])[(data.ventas15Dias || []).length - 1]?.value ?? null, // Conecta el último punto real
          ...(data.prediccionVentas || []).map((d) => d.value)
        ],
        fill: false,
        borderColor: '#f4b400',
        borderWidth: 2.5,
        borderDash: [6, 4],
        pointBackgroundColor: '#f4b400',
        pointBorderColor: '#1a1a1e',
        pointBorderWidth: 2,
        pointRadius: (ctx) => (ctx.raw === null ? 0 : 4),
        pointHoverRadius: (ctx) => (ctx.raw === null ? 0 : 6),
        tension: 0.4,
      }
    ],
  } : null;

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#9ca3af',
          font: { size: 10 },
          boxWidth: 10,
        }
      },
      tooltip: {
        ...CHART_TOOLTIP_OPTS,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: $${Number(ctx.raw).toFixed(2)}`,
        }
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: TICK_COLOR, font: { size: 10 } },
        border: { display: false },
      },
      y: {
        grid: { color: GRID_COLOR },
        ticks: { color: TICK_COLOR, font: { size: 10 }, callback: (v) => '$' + v },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  const doughnutData = data ? {
    labels: (data.ventasPorCategoria || []).map((c) => c.label),
    datasets: [
      {
        data: (data.ventasPorCategoria || []).map((c) => c.value),
        backgroundColor: (data.ventasPorCategoria || []).map((c) => c.color || '#ff3b30'),
        borderColor: '#1a1a1e',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  } : null;

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#9ca3af',
          font: { size: 11 },
          boxWidth: 12,
          padding: 12,
        },
      },
      tooltip: CHART_TOOLTIP_OPTS,
    },
  };

  const barChartData = data ? {
    labels: (data.ventasPorMes || []).map((m) => m.label),
    datasets: [
      {
        label: 'Ventas',
        data: (data.ventasPorMes || []).map((m) => m.value),
        backgroundColor: (data.ventasPorMes || []).map((_, i, arr) =>
          i === arr.length - 1 ? '#ff3b30' : 'rgba(255,59,48,0.4)'
        ),
        borderRadius: 8,
        borderSkipped: false,
        borderColor: 'transparent',
      },
    ],
  } : null;

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: CHART_TOOLTIP_OPTS,
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: TICK_COLOR, font: { size: 10 } },
        border: { display: false },
      },
      y: {
        grid: { color: GRID_COLOR },
        ticks: { color: TICK_COLOR, font: { size: 10 }, callback: (v) => '$' + v },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  const paymentMethodData = data ? {
    labels: (data.ventasPorMetodoPago || []).map((m) => m.label),
    datasets: [
      {
        data: (data.ventasPorMetodoPago || []).map((m) => m.value),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
        borderColor: '#1a1a1e',
        borderWidth: 3,
        hoverOffset: 8,
      }
    ]
  } : null;

  const paymentMethodOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#9ca3af',
          font: { size: 11 },
          boxWidth: 12,
          padding: 12,
        }
      },
      tooltip: CHART_TOOLTIP_OPTS,
    }
  };

  const workerSalesData = data ? {
    labels: (data.ventasPorTrabajador || []).map((w) => w.label),
    datasets: [
      {
        label: 'Total Ventas',
        data: (data.ventasPorTrabajador || []).map((w) => w.value),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        hoverBackgroundColor: '#22c55e',
        borderRadius: 8,
        borderSkipped: false,
        borderColor: 'transparent',
      }
    ]
  } : null;

  const workerSalesOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: CHART_TOOLTIP_OPTS,
    },
    scales: {
      x: {
        grid: { color: GRID_COLOR },
        ticks: { color: TICK_COLOR, font: { size: 10 }, callback: (v) => '$' + v },
        border: { display: false },
        beginAtZero: true,
      },
      y: {
        grid: { display: false },
        ticks: { color: TICK_COLOR, font: { size: 11 } },
        border: { display: false },
      }
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Cargando dashboard...</span>
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;
  const rankColors = ['#f4b400', '#9ca3af', '#f97316', '', ''];

  return (
    <div className="dashboard-page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>
            Panel general del negocio —{' '}
            {new Date().toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => loadDashboard(getDateParams(filterType, customStart, customEnd), true)}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'dash-spin' : ''} />
          {refreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {/* ── Barra de Filtros de Período de Análisis (Toma de Decisiones) ── */}
      <div className="card mb-3" style={{ padding: '12px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filtro de Período:</span>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            className="form-control" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem', background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
          >
            <option value="7d">Últimos 7 Días (Móviles)</option>
            <option value="30d">Últimos 30 Días (Móviles)</option>
            <option value="2025">Año 2025 (Datos de Demo/Seeding)</option>
            <option value="2026">Año 2026 (Año Actual)</option>
            <option value="all">Histórico Completo</option>
            <option value="custom">Rango Personalizado...</option>
          </select>
        </div>

        {filterType === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.2s ease' }}>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem', background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>a</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem', background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>
        )}

        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Rango analizado:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {(data.ventas15Dias || []).length > 0 ? (data.ventas15Dias || [])[0].label : 'N/A'}
          </strong>{' '}
          a{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {(data.ventas15Dias || []).length > 0 ? (data.ventas15Dias || [])[(data.ventas15Dias || []).length - 1].label : 'N/A'}
          </strong>
        </div>
      </div>

      {/* ── KPI Cards (8 cards) ── */}
      <div className="dash-stats-grid mb-3">
        <StatCard
          label="Ventas del Día"
          value={fmt(summary.ventasHoy)}
          sub={`${summary.transaccionesHoy} transacciones`}
          trend="up"
          Icon={CalendarDays}
          color="var(--red-400)"
          bg="rgba(255,59,48,0.1)"
        />
        <StatCard
          label="Ventas (7 Días)"
          value={fmt(summary.ventasSemana)}
          sub={`${summary.transaccionesSemana} transacciones`}
          trend="up"
          Icon={Calendar}
          color="#3b82f6"
          bg="rgba(59,130,246,0.1)"
        />
        <StatCard
          label={getPeriodLabel()}
          value={fmt(summary.ventasMes)}
          sub={`${summary.transaccionesMes} transacciones`}
          trend="up"
          Icon={CalendarRange}
          color="#a855f7"
          bg="rgba(168,85,247,0.1)"
        />
        <StatCard
          label="Ingresos Totales"
          value={fmt(summary.ingresosTotales)}
          sub={`${fmtNum(summary.totalVentas)} ventas registradas`}
          trend="up"
          Icon={DollarSign}
          color="#f4b400"
          bg="rgba(244,180,0,0.1)"
        />
        <StatCard
          label="Total Productos"
          value={fmtNum(summary.totalProductos)}
          sub={`${fmtNum(summary.totalCategorias)} categorías`}
          Icon={Package}
          color="#14b8a6"
          bg="rgba(20,184,166,0.1)"
        />
        <StatCard
          label="Stock Bajo / Sin Stock"
          value={fmtNum(summary.stockBajoCount + summary.sinStockCount)}
          sub={`${fmtNum(summary.sinStockCount)} sin stock`}
          trend="down"
          Icon={AlertTriangle}
          color="#ef4444"
          bg="rgba(239,68,68,0.1)"
        />
        <StatCard
          label="Clientes Registrados"
          value={fmtNum(summary.clientesRegistrados)}
          sub={`${fmtNum(summary.clientesVIP)} clientes VIP`}
          Icon={Users}
          color="#f97316"
          bg="rgba(249,115,22,0.1)"
        />
        <StatCard
          label="Trabajadores Activos"
          value={fmtNum(summary.trabajadoresActivos)}
          sub={`${fmtNum(summary.trabajadoresTotal)} en total`}
          Icon={UserCheck}
          color="#22c55e"
          bg="rgba(34,197,94,0.1)"
        />
      </div>

      {/* ── Charts Row 1: Línea + Dona ── */}
      <div className="dashboard-charts mb-3">
        <div className="card chart-card">
          <h3 className="chart-title">
            <TrendingUp size={16} /> Ventas Últimos 15 Días
          </h3>
          <div className="chart-wrapper">
            {lineChartData && <Line data={lineChartData} options={lineChartOptions} />}
          </div>
        </div>

        <div className="card chart-card chart-card-sm">
          <h3 className="chart-title">
            <ShoppingCart size={16} /> Ventas por Categoría
          </h3>
          <div className="chart-wrapper donut-wrapper">
            {doughnutData && doughnutData.datasets[0].data.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <p className="text-muted text-sm" style={{ textAlign: 'center', paddingTop: 60 }}>
                Sin datos de ventas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Charts Row 2: Barras + Top Productos + Alertas Stock ── */}
      <div className="dashboard-charts-3 mb-3">
        {/* Barras mensuales */}
        <div className="card chart-card">
          <h3 className="chart-title">
            <CalendarRange size={16} /> Ventas por Mes
          </h3>
          <div className="chart-wrapper" style={{ height: 210 }}>
            {barChartData && <Bar data={barChartData} options={barChartOptions} />}
          </div>
        </div>

        {/* Top Productos */}
        <div className="card chart-card">
          <h3 className="chart-title">
            <Trophy size={16} /> Top 5 Productos
          </h3>
          <div className="dash-top-list">
            {(data.topProductos || []).length === 0 ? (
              <p className="text-muted text-sm" style={{ textAlign: 'center', paddingTop: 24 }}>
                Sin ventas registradas
              </p>
            ) : (
              (data.topProductos || []).map((p, i) => (
                <div key={p.id} className="dash-top-item">
                  <div
                    className="dash-top-rank"
                    style={{
                      color: i === 0 ? '#f4b400' : i === 1 ? '#9ca3af' : i === 2 ? '#f97316' : 'var(--text-muted)',
                      borderColor: i === 0 ? '#f4b400' : i === 1 ? '#9ca3af' : i === 2 ? '#f97316' : 'var(--border-color)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="dash-top-info">
                    <div className="dash-top-name truncate">{p.nombre}</div>
                    <div className="dash-top-cat text-xs text-muted">{p.categoria}</div>
                  </div>
                  <div className="dash-top-sales">
                    <div className="dash-top-qty">{fmtNum(p.unidadesVendidas)} uds</div>
                    <div className="dash-top-rev text-xs text-muted">{fmt(p.ingresoGenerado)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertas de Stock */}
        <div className="card chart-card">
          <h3 className="chart-title" style={{ color: 'var(--yellow-400)' }}>
            <AlertTriangle size={16} /> Alertas de Stock Bajo
          </h3>
          {(data.alertasStock || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#22c55e' }}>
              <Package size={32} style={{ marginBottom: 8 }} />
              <p className="text-sm">Stock en buen estado ✓</p>
            </div>
          ) : (
            <div className="dash-alert-list">
              {(data.alertasStock || []).map((p) => (
                <div
                  key={p.id}
                  className="dash-alert-item"
                  style={{ borderLeftColor: p.agotado ? '#ef4444' : '#f59e0b' }}
                >
                  <div className="dash-alert-info">
                    <div className="dash-alert-name truncate">{p.nombre}</div>
                    <div className="dash-alert-cat text-xs text-muted">{p.categoria}</div>
                  </div>
                  <span className={`badge ${p.agotado ? 'badge-danger' : 'badge-warning'}`}>
                    {p.agotado ? 'Agotado' : `${p.stock} uds`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* ── Charts Row 3: Métodos de Pago + Rendimiento Cajeros (Toma de Decisiones) ── */}
      <div className="dashboard-charts-2 mb-3">
        {/* Métodos de Pago */}
        <div className="card chart-card">
          <h3 className="chart-title">
            <DollarSign size={16} /> Ventas por Método de Pago (Toma de Decisiones)
          </h3>
          <div className="chart-wrapper donut-wrapper">
            {paymentMethodData && paymentMethodData.datasets[0].data.length > 0 ? (
              <Doughnut data={paymentMethodData} options={paymentMethodOptions} />
            ) : (
              <p className="text-muted text-sm" style={{ textAlign: 'center', paddingTop: 60 }}>
                Sin datos de ventas por método de pago
              </p>
            )}
          </div>
        </div>

        {/* Rendimiento por Cajero */}
        <div className="card chart-card">
          <h3 className="chart-title">
            <UserCheck size={16} /> Ventas por Trabajador (Toma de Decisiones)
          </h3>
          <div className="chart-wrapper" style={{ height: 250 }}>
            {workerSalesData && workerSalesData.datasets[0].data.length > 0 ? (
              <Bar data={workerSalesData} options={workerSalesOptions} />
            ) : (
              <p className="text-muted text-sm" style={{ textAlign: 'center', paddingTop: 60 }}>
                Sin datos de ventas por trabajador
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Últimas Ventas ── */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <h3 className="chart-title" style={{ marginBottom: 0 }}>
            <Receipt size={16} /> Últimas Ventas Realizadas
          </h3>
          <a href="/ventas" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
            Ver todo
          </a>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Cajero</th>
                <th>Ítems</th>
                <th>Total</th>
                <th>Método</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(data.ultimasVentas || []).length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                    Sin ventas registradas
                  </td>
                </tr>
              ) : (
                (data.ultimasVentas || []).map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>#{v.id}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {fmtDatetime(v.fecha)}
                    </td>
                    <td>{v.cliente}</td>
                    <td>{v.trabajador}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                        {v.totalItems} ítem{v.totalItems !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <strong>{fmt(v.total)}</strong>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: '0.68rem' }}>
                        {v.metodoPago}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          v.estado === 'completada' ? 'badge-success' :
                          v.estado === 'cancelada'  ? 'badge-danger' : 'badge-warning'
                        }`}
                      >
                        {v.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Sub-component: StatCard ────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, Icon, color, bg }) {
  return (
    <div className="dash-stat-card">
      <div className="dash-stat-icon" style={{ background: bg, color }}>
        <Icon size={22} />
      </div>
      <div className="dash-stat-info">
        <div className="dash-stat-label">{label}</div>
        <div className="dash-stat-value">{value}</div>
        {sub && (
          <div className={`dash-stat-sub ${trend === 'down' ? 'dash-stat-down' : ''}`}>
            {trend === 'up' && <ArrowUpRight size={12} />}
            {trend === 'down' && <ArrowDownRight size={12} />}
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
