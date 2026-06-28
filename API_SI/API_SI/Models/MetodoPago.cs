using System;
using System.Collections.Generic;

namespace API_SI.Models
{
    public class MetodoPago
    {
        public int Id { get; set; }
        public string Clave { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public string? Icono { get; set; }
        public bool Activo { get; set; }
        public string? Banco { get; set; }
        public string? NombreCuenta { get; set; }
        public string? NumeroCuenta { get; set; }
        public string? Titular { get; set; }
        public string? ImagenQR { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset ActualizadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public ICollection<Venta> Ventas { get; set; } = new List<Venta>();
    }
}
