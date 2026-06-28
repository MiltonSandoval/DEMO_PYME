namespace API_SI.Models
{
    public class DevolucionDetalle
    {
        public int Id { get; set; }
        public int IdDevolucion { get; set; }
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
        public string Motivo { get; set; } = null!; // "Producto vencido", "Producto en mal estado", etc.

        // Navigation
        public Devolucion Devolucion { get; set; } = null!;
        public Producto Producto { get; set; } = null!;
    }
}
