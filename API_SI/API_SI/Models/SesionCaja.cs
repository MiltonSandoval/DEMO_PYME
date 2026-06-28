using System;

namespace API_SI.Models
{
    public class SesionCaja
    {
        public int Id { get; set; }
        public int IdTrabajador { get; set; }
        public DateTimeOffset FechaApertura { get; set; }
        public DateTimeOffset? FechaCierre { get; set; }
        public decimal MontoApertura { get; set; }
        public string? ConteoEfectivo { get; set; } // JSON format representation
        public decimal? MontoCierre { get; set; }
        public decimal? MontoEsperado { get; set; }
        public decimal? Diferencia { get; set; }
        public string Estado { get; set; } = null!; // "abierta","cerrada"
        public string? Notas { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public Trabajador Trabajador { get; set; } = null!;
    }
}
