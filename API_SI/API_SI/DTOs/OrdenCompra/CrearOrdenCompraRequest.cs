using System;
using System.Collections.Generic;

namespace API_SI.DTOs.OrdenCompra
{
    public class CrearOrdenCompraRequest
    {
        public int IdProveedor { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Impuesto { get; set; }
        public decimal Total { get; set; }
        public DateOnly FechaEsperada { get; set; }
        public string? Notas { get; set; }
        public List<OrdenCompraDetalleDto> Detalles { get; set; } = new List<OrdenCompraDetalleDto>();
    }
}
