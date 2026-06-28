using System;
using System.Collections.Generic;

namespace API_SI.Models
{
    public class Cliente
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public string? CI { get; set; }
        public string? Direccion { get; set; }
        public string? Tipo { get; set; } // "normal","frecuente","vip"
        public int Puntos { get; set; }
        public int TotalCompras { get; set; }
        public decimal TotalGastado { get; set; }
        public DateOnly FechaRegistro { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset ActualizadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public ICollection<Venta> Ventas { get; set; } = new List<Venta>();
        public ICollection<Cotizacion> Cotizaciones { get; set; } = new List<Cotizacion>();
    }
}
