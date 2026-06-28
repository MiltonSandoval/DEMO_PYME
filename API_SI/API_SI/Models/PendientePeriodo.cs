using System;

namespace API_SI.Models
{
    public class PendientePeriodo
    {
        public int Id { get; set; }
        public string Periodo { get; set; } = null!; // "yyyy-MM" format
        public string Etiqueta { get; set; } = null!;
        public decimal IngresoBruto { get; set; }
        public decimal Ahorros { get; set; }
        public decimal Gastos { get; set; }
        public decimal Facturas { get; set; }
        public decimal Alquiler { get; set; }
        public decimal TotalFijo { get; set; }
        public decimal Sobrante { get; set; }
        public string? Notas { get; set; }
        public DateTimeOffset? CerradoEn { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;
    }
}
