namespace API_SI.Models
{
    public class OrdenCompraDetalle
    {
        public int Id { get; set; }
        public int IdOrdenCompra { get; set; }
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public decimal CostoUnitario { get; set; }
        public decimal Subtotal { get; set; }

        // Navigation
        public OrdenCompra OrdenCompra { get; set; } = null!;
        public Producto Producto { get; set; } = null!;
    }
}
