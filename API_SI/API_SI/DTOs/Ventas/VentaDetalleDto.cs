namespace API_SI.DTOs.Ventas
{
    public class VentaDetalleDto
    {
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
    }
}
