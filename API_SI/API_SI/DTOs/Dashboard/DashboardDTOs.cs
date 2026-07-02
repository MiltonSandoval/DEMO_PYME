namespace API_SI.DTOs.Dashboard
{
    public class DashboardSummaryDTO
    {
        public decimal VentasHoy { get; set; }
        public int TransaccionesHoy { get; set; }
        public decimal VentasSemana { get; set; }
        public int TransaccionesSemana { get; set; }
        public decimal VentasMes { get; set; }
        public int TransaccionesMes { get; set; }
        public decimal IngresosTotales { get; set; }
        public int TotalVentas { get; set; }
        public int TotalProductos { get; set; }
        public int TotalCategorias { get; set; }
        public int StockBajoCount { get; set; }
        public int SinStockCount { get; set; }
        public int ClientesRegistrados { get; set; }
        public int ClientesVIP { get; set; }
        public int TrabajadoresActivos { get; set; }
        public int TrabajadoresTotal { get; set; }
    }

    public class ChartPointDTO
    {
        public string Label { get; set; } = null!;
        public decimal Value { get; set; }
        public string? Color { get; set; }
    }

    public class TopProductoDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Categoria { get; set; }
        public int UnidadesVendidas { get; set; }
        public decimal IngresoGenerado { get; set; }
    }

    public class StockAlertDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Categoria { get; set; }
        public int Stock { get; set; }
        public int StockMinimo { get; set; }
        public bool Agotado { get; set; }
    }

    public class UltimaVentaDTO
    {
        public int Id { get; set; }
        public DateTimeOffset Fecha { get; set; }
        public string Cliente { get; set; } = null!;
        public string Trabajador { get; set; } = null!;
        public decimal Total { get; set; }
        public string Estado { get; set; } = null!;
        public string MetodoPago { get; set; } = null!;
        public int TotalItems { get; set; }
    }

    public class DashboardResponseDTO
    {
        public DashboardSummaryDTO Summary { get; set; } = null!;
        public List<ChartPointDTO> Ventas15Dias { get; set; } = new();
        public List<ChartPointDTO> VentasPorCategoria { get; set; } = new();
        public List<ChartPointDTO> VentasPorMes { get; set; } = new();
        public List<ChartPointDTO> PrediccionVentas { get; set; } = new();
        public List<ChartPointDTO> VentasPorMetodoPago { get; set; } = new();
        public List<ChartPointDTO> VentasPorTrabajador { get; set; } = new();
        public List<TopProductoDTO> TopProductos { get; set; } = new();
        public List<StockAlertDTO> AlertasStock { get; set; } = new();
        public List<UltimaVentaDTO> UltimasVentas { get; set; } = new();
    }
}
