using System;
using System.Collections.Generic;

namespace API_SI.Models
{
    public class OrdenCompra
    {
        public int Id { get; set; }
        public DateOnly Fecha { get; set; }
        public int IdProveedor { get; set; }
        public int IdTrabajador { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Impuesto { get; set; }
        public decimal Total { get; set; }
        public string Estado { get; set; } = null!; // "pendiente","enviada","recibida"
        public DateOnly FechaEsperada { get; set; }
        public DateOnly? FechaRecepcion { get; set; }
        public string? Notas { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset ActualizadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public Proveedor Proveedor { get; set; } = null!;
        public Trabajador Trabajador { get; set; } = null!;
        public ICollection<OrdenCompraDetalle> OrdenCompraDetalles { get; set; } = new List<OrdenCompraDetalle>();
    }
}
