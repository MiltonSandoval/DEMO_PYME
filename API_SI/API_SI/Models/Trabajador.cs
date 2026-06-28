using System;
using System.Collections.Generic;

namespace API_SI.Models
{
    public class Trabajador
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public int IdRol { get; set; }
        public string? Email { get; set; }
        public string Password { get; set; } = null!;
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string Estado { get; set; } = null!; // "activo","inactivo"
        public DateOnly FechaIngreso { get; set; }
        public decimal Salario { get; set; }
        public string? Avatar { get; set; }
        public string? ColorAvatar { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset ActualizadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public Rol? Rol { get; set; }
        public ICollection<HistorialTipoCambio> HistorialTipoCambios { get; set; } = new List<HistorialTipoCambio>();
        public ICollection<Venta> Ventas { get; set; } = new List<Venta>();
        public ICollection<SesionCaja> SesionesCaja { get; set; } = new List<SesionCaja>();
        public ICollection<OrdenCompra> OrdenesCompra { get; set; } = new List<OrdenCompra>();
        public ICollection<Devolucion> Devoluciones { get; set; } = new List<Devolucion>();
        public ICollection<MovimientoInventario> MovimientosInventario { get; set; } = new List<MovimientoInventario>();
        public ICollection<Cotizacion> Cotizaciones { get; set; } = new List<Cotizacion>();
    }
}
