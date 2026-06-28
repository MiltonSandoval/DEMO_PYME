using System;

namespace API_SI.Models
{
    public class MovimientoInventario
    {
        public int Id { get; set; }
        public DateTimeOffset Fecha { get; set; }
        public string Tipo { get; set; } = null!; // "entrada","salida","ajuste"
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public string Motivo { get; set; } = null!;
        public int? IdProveedor { get; set; }
        public int IdTrabajador { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public Producto Producto { get; set; } = null!;
        public Proveedor? Proveedor { get; set; }
        public Trabajador Trabajador { get; set; } = null!;
    }
}
