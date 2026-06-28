namespace API_SI.DTOs.Devoluciones
{
    public class DevolucionDetalleDto
    {
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public string Motivo { get; set; } = null!;
    }
}
