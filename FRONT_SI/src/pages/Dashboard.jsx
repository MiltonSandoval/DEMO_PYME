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
  const toast = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Chart configs ─────────────────────────────────────────────────────────

  const lineChartData = data ? {
    labels: data.ventas15Dias.map((d) => d.label),
    datasets: [
      {
        label: 'Ventas',
        data: data.ventas15Dias.map((d) => d.value),
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
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      },
    ],
  } : null;

  const lineChartOptions = {
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

  const doughnutData = data ? {
    labels: data.ventasPorCategoria.map((c) => c.label),
    datasets: [
      {
        data: data.ventasPorCategoria.map((c) => c.value),
        backgroundColor: data.ventasPorCategoria.map((c) => c.color || '#ff3b30'),
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
    labels: data.ventasPorMes.map((m) => m.label),
    datasets: [
      {
        label: 'Ventas',
        data: data.ventasPorMes.map((m) => m.value),
        backgroundColor: data.ventasPorMes.map((_, i, arr) =>
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
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'dash-spin' : ''} />
          {refreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
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
          label="Ventas de la Semana"
          value={fmt(summary.ventasSemana)}
          sub={`${summary.transaccionesSemana} transacciones`}
          trend="up"
          Icon={Calendar}
          color="#3b82f6"
          bg="rgba(59,130,246,0.1)"
        />
        <StatCard
          label="Ventas del Mes"
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
            {data.topProductos.length === 0 ? (
              <p className="text-muted text-sm" style={{ textAlign: 'center', paddingTop: 24 }}>
                Sin ventas registradas
              </p>
            ) : (
              data.topProductos.map((p, i) => (
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
          {data.alertasStock.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#22c55e' }}>
              <Package size={32} style={{ marginBottom: 8 }} />
              <p className="text-sm">Stock en buen estado ✓</p>
            </div>
          ) : (
            <div className="dash-alert-list">
              {data.alertasStock.map((p) => (
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
              {data.ultimasVentas.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                    Sin ventas registradas
                  </td>
                </tr>
              ) : (
                data.ultimasVentas.map((v) => (
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
