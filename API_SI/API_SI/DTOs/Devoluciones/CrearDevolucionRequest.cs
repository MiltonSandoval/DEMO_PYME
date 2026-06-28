using System.Collections.Generic;

namespace API_SI.DTOs.Devoluciones
{
    public class CrearDevolucionRequest
    {
        public int IdVenta { get; set; }
        public decimal Total { get; set; }
        public string MetodoReembolso { get; set; } = null!; // "efectivo","tarjeta","transferencia"
        public bool Reingreso { get; set; }
        public string? Notas { get; set; }
        public List<DevolucionDetalleDto> Detalles { get; set; } = new List<DevolucionDetalleDto>();
    }
}
