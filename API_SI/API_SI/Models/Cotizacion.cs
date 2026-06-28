using System;
using System.Collections.Generic;

namespace API_SI.Models
{
    public class Cotizacion
    {
        public int Id { get; set; }
        public string Numero { get; set; } = null!;
        public int? IdCliente { get; set; }
        public string ClienteNombre { get; set; } = null!;
        public string? ClienteCI { get; set; }
        public string? ClienteTelefono { get; set; }
        public string? ClienteEmail { get; set; }
        public decimal DescuentoGlobal { get; set; }
        public decimal Subtotal { get; set; }
        public decimal MontoDescuento { get; set; }
        public decimal Total { get; set; }
        public decimal TotalMonedaLocal { get; set; }
        public decimal TipoCambio { get; set; }
        public string MonedaLocal { get; set; } = null!;
        public int DiasValidez { get; set; }
        public DateOnly FechaVencimiento { get; set; }
        public string? Notas { get; set; }
        public string Estado { get; set; } = null!; // "pendiente","aceptada","rechazada","vencida"
        public DateTimeOffset FechaCreacion { get; set; }
        public int IdTrabajador { get; set; }
        public string Plantilla { get; set; } = null!; // "T1","T2","T3","T4","T5","T6"
        public string? HashQR { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset ActualizadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public Cliente? Cliente { get; set; }
        public Trabajador Trabajador { get; set; } = null!;
        public ICollection<CotizacionDetalle> CotizacionDetalles { get; set; } = new List<CotizacionDetalle>();
    }
}
