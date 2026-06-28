using System;

namespace API_SI.Models
{
    public class PendienteConfiguracion
    {
        public int Id { get; set; } = 1;
        public decimal Ahorros { get; set; }
        public decimal Gastos { get; set; }
        public decimal Facturas { get; set; }
        public decimal Alquiler { get; set; }
        public DateTimeOffset ActualizadoEn { get; set; } = DateTimeOffset.UtcNow;
    }
}
// Note: This entity was renamed from "PendienteConfiguracion" to "PendienteConfiguracion" (as in DB.sql line 493).
