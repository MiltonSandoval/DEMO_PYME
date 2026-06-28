namespace API_SI.Models
{
    public class VentaDetalle
    {
        public int Id { get; set; }
        public int IdVenta { get; set; }
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }

        // Navigation
        public Venta Venta { get; set; } = null!;
        public Producto Producto { get; set; } = null!;
    }
}
