namespace API_SI.Models
{
    public class ProveedorCategoria
    {
        public int IdProveedor { get; set; }
        public int IdCategoria { get; set; }

        // Navigation
        public Proveedor Proveedor { get; set; } = null!;
        public Categoria Categoria { get; set; } = null!;
    }
}
