using System;
using System.Collections.Generic;

namespace API_SI.Models
{
    public class Proveedor
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Contacto { get; set; }
        public string? Ruc { get; set; }
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string CondicionPago { get; set; } = null!; // "7 días","15 días","30 días","45 días","60 días","Contado"
        public string Estado { get; set; } = null!;        // "activo","inactivo"
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset ActualizadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public ICollection<ProveedorCategoria> ProveedorCategorias { get; set; } = new List<ProveedorCategoria>();
        public ICollection<Producto> Productos { get; set; } = new List<Producto>();
        public ICollection<OrdenCompra> OrdenesCompra { get; set; } = new List<OrdenCompra>();
        public ICollection<MovimientoInventario> MovimientosInventario { get; set; } = new List<MovimientoInventario>();
    }
}
