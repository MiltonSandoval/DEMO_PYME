using System;
using System.Collections.Generic;

namespace API_SI.Models
{
    public class Venta
    {
        public int Id { get; set; }
        public DateTimeOffset Fecha { get; set; }
        public int IdCliente { get; set; }
        public int IdTrabajador { get; set; }
        public int IdMetodoPago { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Descuento { get; set; }
        public decimal MontoDescuento { get; set; }
        public decimal Impuesto { get; set; }
        public decimal Total { get; set; }
        public decimal? EfectivoRecibido { get; set; }
        public string? DireccionEnvio { get; set; }
        public string Estado { get; set; } = null!; // "completada","cancelada"
        public string? HashQR { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public Cliente Cliente { get; set; } = null!;
        public Trabajador Trabajador { get; set; } = null!;
        public MetodoPago MetodoPago { get; set; } = null!;
        public ICollection<VentaDetalle> VentaDetalles { get; set; } = new List<VentaDetalle>();
        public ICollection<Devolucion> Devoluciones { get; set; } = new List<Devolucion>();
    }
}
