using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.DTOs.Dashboard;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API_SI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private const int UMBRAL_STOCK_BAJO = 5;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<DashboardResponseDTO>> GetDashboard()
        {
            var ahora = DateTimeOffset.UtcNow;
            var hoyInicio = new DateTimeOffset(ahora.Year, ahora.Month, ahora.Day, 0, 0, 0, TimeSpan.Zero);
            var semanaInicio = hoyInicio.AddDays(-6);
            var mesInicio = new DateTimeOffset(ahora.Year, ahora.Month, 1, 0, 0, 0, TimeSpan.Zero);

            // ─── KPI Ventas ───────────────────────────────────────────────────────────
            var ventasQuery = _context.Ventas
                .Where(v => v.Estado != "cancelada");

            var ventasHoy = await ventasQuery
                .Where(v => v.Fecha >= hoyInicio)
                .GroupBy(_ => 1)
                .Select(g => new { Total = g.Sum(v => v.Total), Count = g.Count() })
                .FirstOrDefaultAsync();

            var ventasSemana = await ventasQuery
                .Where(v => v.Fecha >= semanaInicio)
                .GroupBy(_ => 1)
                .Select(g => new { Total = g.Sum(v => v.Total), Count = g.Count() })
                .FirstOrDefaultAsync();

            var ventasMes = await ventasQuery
                .Where(v => v.Fecha >= mesInicio)
                .GroupBy(_ => 1)
                .Select(g => new { Total = g.Sum(v => v.Total), Count = g.Count() })
                .FirstOrDefaultAsync();

            var ingresosTotales = await ventasQuery
                .GroupBy(_ => 1)
                .Select(g => new { Total = g.Sum(v => v.Total), Count = g.Count() })
                .FirstOrDefaultAsync();

            // ─── KPI Generales ────────────────────────────────────────────────────────
            var totalProductos = await _context.Productos.CountAsync();
            var totalCategorias = await _context.Categorias.CountAsync();
            var clientesRegistrados = await _context.Clientes.CountAsync();
            var clientesVIP = await _context.Clientes.CountAsync(c => c.Tipo == "vip");
            var trabajadoresActivos = await _context.Trabajadores.CountAsync(t => t.Estado == "activo");
            var trabajadoresTotal = await _context.Trabajadores.CountAsync();

            var stockBajoCount = await _context.Productos
                .CountAsync(p => p.Stock > 0 && p.Stock <= UMBRAL_STOCK_BAJO && p.Estado == "activo");
            var sinStockCount = await _context.Productos
                .CountAsync(p => p.Stock == 0 && p.Estado == "activo");

            // ─── Gráfico 1: Ventas últimos 15 días ───────────────────────────────────
            var hace15Dias = hoyInicio.AddDays(-14);
            var ventasPorDia = await ventasQuery
                .Where(v => v.Fecha >= hace15Dias)
                .GroupBy(v => new
                {
                    Anio = v.Fecha.Year,
                    Mes = v.Fecha.Month,
                    Dia = v.Fecha.Day
                })
                .Select(g => new
                {
                    g.Key.Anio,
                    g.Key.Mes,
                    g.Key.Dia,
                    Total = g.Sum(v => v.Total)
                })
                .ToListAsync();

            var ventas15Dias = new List<ChartPointDTO>();
            for (int i = 14; i >= 0; i--)
            {
                var dia = hoyInicio.AddDays(-i);
                var entry = ventasPorDia.FirstOrDefault(v =>
                    v.Anio == dia.Year && v.Mes == dia.Month && v.Dia == dia.Day);

                ventas15Dias.Add(new ChartPointDTO
                {
                    Label = dia.ToString("dd/MM"),
                    Value = entry?.Total ?? 0
                });
            }

            // ─── Gráfico 2: Ventas por Categoría ─────────────────────────────────────
            // Colores fijos asignados por categoría (mismo orden que la DB)
            var coloresCat = new[] {
                "#ff3b30", "#f4b400", "#ff6b35", "#22c55e", "#3b82f6",
                "#a855f7", "#ec4899", "#14b8a6", "#f97316", "#6366f1"
            };

            var ventasPorCategoria = await _context.VentaDetalles
                .Where(vd => vd.Venta.Estado != "cancelada")
                .GroupBy(vd => new { vd.Producto.IdCategoria, vd.Producto.Categoria!.Nombre, vd.Producto.Categoria.Color })
                .Select(g => new
                {
                    g.Key.IdCategoria,
                    g.Key.Nombre,
                    g.Key.Color,
                    Total = g.Sum(vd => vd.Subtotal)
                })
                .OrderByDescending(x => x.Total)
                .ToListAsync();

            var ventasCat = ventasPorCategoria.Select((x, idx) => new ChartPointDTO
            {
                Label = x.Nombre,
                Value = x.Total,
                Color = string.IsNullOrEmpty(x.Color) ? coloresCat[idx % coloresCat.Length] : x.Color
            }).ToList();

            // ─── Gráfico 3: Ventas por Mes (últimos 6 meses) ─────────────────────────
            var hace6Meses = mesInicio.AddMonths(-5);
            var ventasPorMes = await ventasQuery
                .Where(v => v.Fecha >= hace6Meses)
                .GroupBy(v => new { v.Fecha.Year, v.Fecha.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    Total = g.Sum(v => v.Total)
                })
                .ToListAsync();

            var ventasMesList = new List<ChartPointDTO>();
            for (int i = 5; i >= 0; i--)
            {
                var mes = mesInicio.AddMonths(-i);
                var entry = ventasPorMes.FirstOrDefault(v => v.Year == mes.Year && v.Month == mes.Month);
                ventasMesList.Add(new ChartPointDTO
                {
                    Label = mes.ToString("MMM"),
                    Value = entry?.Total ?? 0
                });
            }

            // ─── Top 5 Productos más vendidos ────────────────────────────────────────
            var topProductos = await _context.Productos
                .Where(p => p.Estado == "activo")
                .OrderByDescending(p => p.UnidadesVendidas)
                .Take(5)
                .Select(p => new TopProductoDTO
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    Categoria = p.Categoria != null ? p.Categoria.Nombre : null,
                    UnidadesVendidas = p.UnidadesVendidas,
                    IngresoGenerado = p.UnidadesVendidas * p.PrecioVenta
                })
                .ToListAsync();

            // ─── Alertas de Stock Bajo ────────────────────────────────────────────────
            var alertasStock = await _context.Productos
                .Where(p => p.Stock <= UMBRAL_STOCK_BAJO && p.Estado == "activo")
                .OrderBy(p => p.Stock)
                .Take(8)
                .Select(p => new StockAlertDTO
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    Categoria = p.Categoria != null ? p.Categoria.Nombre : null,
                    Stock = p.Stock,
                    StockMinimo = p.StockMinimo > 0 ? p.StockMinimo : UMBRAL_STOCK_BAJO,
                    Agotado = p.Stock == 0
                })
                .ToListAsync();

            // ─── Últimas 8 ventas ─────────────────────────────────────────────────────
            var ultimasVentas = await _context.Ventas
                .Include(v => v.Cliente)
                .Include(v => v.Trabajador)
                .Include(v => v.MetodoPago)
                .Include(v => v.VentaDetalles)
                .OrderByDescending(v => v.Fecha)
                .Take(8)
                .Select(v => new UltimaVentaDTO
                {
                    Id = v.Id,
                    Fecha = v.Fecha,
                    Cliente = v.Cliente.Nombre,
                    Trabajador = v.Trabajador.Nombre,
                    Total = v.Total,
                    Estado = v.Estado,
                    MetodoPago = v.MetodoPago.Nombre,
                    TotalItems = v.VentaDetalles.Count
                })
                .ToListAsync();

            // ─── Armar respuesta ──────────────────────────────────────────────────────
            var response = new DashboardResponseDTO
            {
                Summary = new DashboardSummaryDTO
                {
                    VentasHoy = ventasHoy?.Total ?? 0,
                    TransaccionesHoy = ventasHoy?.Count ?? 0,
                    VentasSemana = ventasSemana?.Total ?? 0,
                    TransaccionesSemana = ventasSemana?.Count ?? 0,
                    VentasMes = ventasMes?.Total ?? 0,
                    TransaccionesMes = ventasMes?.Count ?? 0,
                    IngresosTotales = ingresosTotales?.Total ?? 0,
                    TotalVentas = ingresosTotales?.Count ?? 0,
                    TotalProductos = totalProductos,
                    TotalCategorias = totalCategorias,
                    StockBajoCount = stockBajoCount,
                    SinStockCount = sinStockCount,
                    ClientesRegistrados = clientesRegistrados,
                    ClientesVIP = clientesVIP,
                    TrabajadoresActivos = trabajadoresActivos,
                    TrabajadoresTotal = trabajadoresTotal
                },
                Ventas15Dias = ventas15Dias,
                VentasPorCategoria = ventasCat,
                VentasPorMes = ventasMesList,
                TopProductos = topProductos,
                AlertasStock = alertasStock,
                UltimasVentas = ultimasVentas
            };

            return Ok(response);
        }
    }
}
