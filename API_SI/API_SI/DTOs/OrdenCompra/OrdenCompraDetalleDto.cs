namespace API_SI.DTOs.OrdenCompra
{
    public class OrdenCompraDetalleDto
    {
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public decimal CostoUnitario { get; set; }
    }
}
