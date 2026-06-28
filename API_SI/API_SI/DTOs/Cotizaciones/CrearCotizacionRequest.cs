using System.Collections.Generic;

namespace API_SI.DTOs.Cotizaciones
{
    public class CrearCotizacionRequest
    {
        public int? IdCliente { get; set; }
        public string ClienteNombre { get; set; } = null!;
        public string? ClienteCI { get; set; }
        public string? ClienteTelefono { get; set; }
        public string? ClienteEmail { get; set; }
        public decimal DescuentoGlobal { get; set; }
        public decimal Subtotal { get; set; }
        public decimal MontoDescuento { get; set; }
        public decimal Total { get; set; }
        public int DiasValidez { get; set; }
        public string Plantilla { get; set; } = null!; // "T1","T2","T3","T4","T5","T6"
        public string? Notas { get; set; }
        public List<CotizacionDetalleDto> Detalles { get; set; } = new List<CotizacionDetalleDto>();
    }
}
