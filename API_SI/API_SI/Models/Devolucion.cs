using System;
using System.Collections.Generic;

namespace API_SI.Models
{
    public class Devolucion
    {
        public int Id { get; set; }
        public DateTimeOffset Fecha { get; set; }
        public int IdVenta { get; set; }
        public int IdTrabajador { get; set; }
        public decimal Total { get; set; }
        public string MetodoReembolso { get; set; } = null!; // "efectivo","tarjeta","transferencia"
        public bool Reingreso { get; set; }
        public string Estado { get; set; } = null!;           // "procesada","pendiente"
        public string? Notas { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public Venta Venta { get; set; } = null!;
        public Trabajador Trabajador { get; set; } = null!;
        public ICollection<DevolucionDetalle> DevolucionDetalles { get; set; } = new List<DevolucionDetalle>();
    }
}
