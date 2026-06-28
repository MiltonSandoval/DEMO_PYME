namespace API_SI.Models
{
    public class CotizacionDetalle
    {
        public int Id { get; set; }
        public int IdCotizacion { get; set; }
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Descuento { get; set; }
        public decimal Subtotal { get; set; }

        // Navigation
        public Cotizacion Cotizacion { get; set; } = null!;
        public Producto Producto { get; set; } = null!;
    }
}
