using System.Collections.Generic;

namespace API_SI.DTOs.Ventas
{
    public class CrearVentaRequest
    {
        public int IdCliente { get; set; }
        public int IdMetodoPago { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Descuento { get; set; }
        public decimal MontoDescuento { get; set; }
        public decimal Impuesto { get; set; }
        public decimal Total { get; set; }
        public decimal? EfectivoRecibido { get; set; }
        public string? DireccionEnvio { get; set; }
        public List<VentaDetalleDto> Detalles { get; set; } = new List<VentaDetalleDto>();
    }
}
