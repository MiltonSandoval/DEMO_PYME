namespace API_SI.DTOs.Cotizaciones
{
    public class CotizacionDetalleDto
    {
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Descuento { get; set; }
    }
}
