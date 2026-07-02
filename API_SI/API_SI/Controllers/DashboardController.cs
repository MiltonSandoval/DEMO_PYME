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
        public async Task<ActionResult<DashboardResponseDTO>> GetDashboard([FromQuery] DateTimeOffset? startDate, [FromQuery] DateTimeOffset? endDate)
        {
            var ahora = DateTimeOffset.UtcNow;
            var hoyInicio = new DateTimeOffset(ahora.Year, ahora.Month, ahora.Day, 0, 0, 0, TimeSpan.Zero);
            var semanaInicio = hoyInicio.AddDays(-6);

            DateTimeOffset filtroInicio = startDate ?? hoyInicio.AddDays(-29);
            DateTimeOffset filtroFin = endDate ?? ahora;

            var hoyInicioFiltro = new DateTimeOffset(filtroFin.Year, filtroFin.Month, filtroFin.Day, 0, 0, 0, TimeSpan.Zero);
            var semanaInicioFiltro = hoyInicioFiltro.AddDays(-6);

            // ─── KPI Ventas ───────────────────────────────────────────────────────────
            var ventasQuery = _context.Ventas
                .Where(v => v.Estado != "cancelada");

            var ventasHoy = await ventasQuery
                .Where(v => v.Fecha >= hoyInicioFiltro && v.Fecha <= filtroFin)
                .GroupBy(_ => 1)
                .Select(g => new { Total = g.Sum(v => v.Total), Count = g.Count() })
                .FirstOrDefaultAsync();

            var ventasSemana = await ventasQuery
                .Where(v => v.Fecha >= semanaInicioFiltro && v.Fecha <= filtroFin)
                .GroupBy(_ => 1)
                .Select(g => new { Total = g.Sum(v => v.Total), Count = g.Count() })
                .FirstOrDefaultAsync();

            // Ventas del Período Seleccionado (Filtros de fecha dinámicos)
            var ventasMes = await ventasQuery
                .Where(v => v.Fecha >= filtroInicio && v.Fecha <= filtroFin)
                .GroupBy(_ => 1)
                .Select(g => new { Total = g.Sum(v => v.Total), Count = g.Count() })
                .FirstOrDefaultAsync();

            var ingresosTotales = await ventasQuery
                .GroupBy(_ => 1)
                .Select(g => new { Total = g.Sum(v => v.Total), Count = g.Count() })
                .FirstOrDefaultAsync();

            // ─── KPI Generales (Estado actual del inventario y negocio) ───────────────
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

            // ─── Gráfico 1: Ventas por Día o Mes en el período seleccionado ──────────
            var diasDiferencia = (filtroFin - filtroInicio).Days;
            var ventasPorDia = await ventasQuery
                .Where(v => v.Fecha >= filtroInicio && v.Fecha <= filtroFin)
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

            var ventasRangoList = new List<ChartPointDTO>();
            if (diasDiferencia <= 62)
            {
                // Agrupamiento diario para rangos de hasta 2 meses
                for (int i = diasDiferencia; i >= 0; i--)
                {
                    var dia = filtroFin.AddDays(-i);
                    var entry = ventasPorDia.FirstOrDefault(v =>
                        v.Anio == dia.Year && v.Mes == dia.Month && v.Dia == dia.Day);

                    ventasRangoList.Add(new ChartPointDTO
                    {
                        Label = dia.ToString("dd/MM"),
                        Value = entry?.Total ?? 0
                    });
                }
            }
            else
            {
                // Agrupamiento mensual para rangos largos
                var ventasPorMesRango = await ventasQuery
                    .Where(v => v.Fecha >= filtroInicio && v.Fecha <= filtroFin)
                    .GroupBy(v => new { v.Fecha.Year, v.Fecha.Month })
                    .Select(g => new
                    {
                        g.Key.Year,
                        g.Key.Month,
                        Total = g.Sum(v => v.Total)
                    })
                    .ToListAsync();

                var tempFecha = new DateTimeOffset(filtroInicio.Year, filtroInicio.Month, 1, 0, 0, 0, TimeSpan.Zero);
                while (tempFecha <= filtroFin)
                {
                    var y = tempFecha.Year;
                    var m = tempFecha.Month;
                    var entry = ventasPorMesRango.FirstOrDefault(v => v.Year == y && v.Month == m);
                    
                    ventasRangoList.Add(new ChartPointDTO
                    {
                        Label = tempFecha.ToString("MM/yy"),
                        Value = entry?.Total ?? 0
                    });
                    tempFecha = tempFecha.AddMonths(1);
                }
            }

            // ─── Gráfico 2: Ventas por Categoría en el período ───────────────────────
            var coloresCat = new[] {
                "#ff3b30", "#f4b400", "#ff6b35", "#22c55e", "#3b82f6",
                "#a855f7", "#ec4899", "#14b8a6", "#f97316", "#6366f1"
            };

            var ventasPorCategoria = await _context.VentaDetalles
                .Where(vd => vd.Venta.Estado != "cancelada" && vd.Venta.Fecha >= filtroInicio && vd.Venta.Fecha <= filtroFin)
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

            // ─── Gráfico 3: Ventas por Mes (últimos 6 meses antes del fin de filtro) ─
            var mesInicioGrafico = new DateTimeOffset(filtroFin.Year, filtroFin.Month, 1, 0, 0, 0, TimeSpan.Zero);
            var hace6Meses = mesInicioGrafico.AddMonths(-5);
            var ventasPorMes = await ventasQuery
                .Where(v => v.Fecha >= hace6Meses && v.Fecha <= filtroFin)
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
                var mes = mesInicioGrafico.AddMonths(-i);
                var entry = ventasPorMes.FirstOrDefault(v => v.Year == mes.Year && v.Month == mes.Month);
                ventasMesList.Add(new ChartPointDTO
                {
                    Label = mes.ToString("MMM"),
                    Value = entry?.Total ?? 0
                });
            }

            // ─── Top 5 Productos más vendidos en el período ──────────────────────────
            var topProductos = await _context.VentaDetalles
                .Where(vd => vd.Venta.Estado != "cancelada" && vd.Venta.Fecha >= filtroInicio && vd.Venta.Fecha <= filtroFin)
                .GroupBy(vd => new { vd.IdProducto, vd.Producto.Nombre, CategoriaNombre = vd.Producto.Categoria!.Nombre })
                .Select(g => new TopProductoDTO
                {
                    Id = g.Key.IdProducto,
                    Nombre = g.Key.Nombre,
                    Categoria = g.Key.CategoriaNombre,
                    UnidadesVendidas = g.Sum(vd => vd.Cantidad),
                    IngresoGenerado = g.Sum(vd => vd.Subtotal)
                })
                .OrderByDescending(x => x.UnidadesVendidas)
                .Take(5)
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

            // ─── Últimas 8 ventas en el período seleccionado ─────────────────────────
            var ultimasVentas = await _context.Ventas
                .Where(v => v.Fecha >= filtroInicio && v.Fecha <= filtroFin)
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

            // ─── Proyección Predictiva (Regresión Lineal a 7 periodos futuros) ────────
            var prediccionVentas = new List<ChartPointDTO>();
            if (ventasRangoList.Count > 1)
            {
                double sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
                int nPoints = ventasRangoList.Count;
                for (int i = 0; i < nPoints; i++)
                {
                    double xVal = i;
                    double yVal = (double)ventasRangoList[i].Value;
                    sumX += xVal;
                    sumY += yVal;
                    sumXY += xVal * yVal;
                    sumXX += xVal * xVal;
                }

                double slope = 0;
                double intercept = 0;
                double denominator = nPoints * sumXX - sumX * sumX;
                if (Math.Abs(denominator) > 0.0001)
                {
                    slope = (nPoints * sumXY - sumX * sumY) / denominator;
                    intercept = (sumY - slope * sumX) / nPoints;
                }
                else
                {
                    slope = 0;
                    intercept = sumY / nPoints;
                }

                for (int i = 1; i <= 7; i++)
                {
                    double xVal = nPoints - 1 + i;
                    double yPred = slope * xVal + intercept;
                    if (yPred < 0) yPred = 0;

                    string labelPred = "";
                    if (diasDiferencia <= 62)
                    {
                        labelPred = filtroFin.AddDays(i).ToString("dd/MM") + " (Proy.)";
                    }
                    else
                    {
                        labelPred = filtroFin.AddMonths(i).ToString("MM/yy") + " (Proy.)";
                    }

                    prediccionVentas.Add(new ChartPointDTO
                    {
                        Label = labelPred,
                        Value = (decimal)yPred
                    });
                }
            }

            // ─── Ventas por Método de Pago en el período ─────────────────────────────
            var ventasMetodoPagoRaw = await _context.Ventas
                .Where(v => v.Estado != "cancelada" && v.Fecha >= filtroInicio && v.Fecha <= filtroFin)
                .GroupBy(v => new { v.IdMetodoPago, v.MetodoPago.Nombre })
                .Select(g => new
                {
                    g.Key.Nombre,
                    Total = g.Sum(v => v.Total)
                })
                .ToListAsync();

            var ventasMetodoPago = ventasMetodoPagoRaw.Select(x => new ChartPointDTO
            {
                Label = x.Nombre,
                Value = x.Total
            }).ToList();

            // ─── Ventas por Trabajador (Top Rendimiento) en el período ───────────────
            var ventasTrabajadorRaw = await _context.Ventas
                .Where(v => v.Estado != "cancelada" && v.Fecha >= filtroInicio && v.Fecha <= filtroFin)
                .GroupBy(v => new { v.IdTrabajador, v.Trabajador.Nombre })
                .Select(g => new
                {
                    g.Key.Nombre,
                    Total = g.Sum(v => v.Total)
                })
                .OrderByDescending(x => x.Total)
                .Take(5)
                .ToListAsync();

            var ventasTrabajador = ventasTrabajadorRaw.Select(x => new ChartPointDTO
            {
                Label = x.Nombre,
                Value = x.Total
            }).ToList();

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
                Ventas15Dias = ventasRangoList,
                VentasPorCategoria = ventasCat,
                VentasPorMes = ventasMesList,
                PrediccionVentas = prediccionVentas,
                VentasPorMetodoPago = ventasMetodoPago,
                VentasPorTrabajador = ventasTrabajador,
                TopProductos = topProductos,
                AlertasStock = alertasStock,
                UltimasVentas = ultimasVentas
            };

            return Ok(response);
        }
    }
}
