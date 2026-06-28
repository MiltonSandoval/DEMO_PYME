using System;

namespace API_SI.Models
{
    public class HistorialTipoCambio
    {
        public int Id { get; set; }
        public decimal TipoCambioAnterior { get; set; }
        public decimal TipoCambioNuevo { get; set; }
        public DateTimeOffset Fecha { get; set; } = DateTimeOffset.UtcNow;
        public int? IdTrabajador { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public Trabajador? Trabajador { get; set; }
    }
}
