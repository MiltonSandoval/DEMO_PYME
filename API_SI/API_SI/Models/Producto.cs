using System;
using System.Collections.Generic;

namespace API_SI.Models
{
    public class Producto
    {
        public int Id { get; set; }
        public string Codigo { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public int IdCategoria { get; set; }
        public decimal PrecioCompra { get; set; }
        public decimal PrecioVenta { get; set; }
        public int Stock { get; set; }
        public int StockMinimo { get; set; }
        public string Unidad { get; set; } = null!;       // "und","kg","lt","gr"
        public string Estado { get; set; } = null!;        // "activo","inactivo"
        public int? IdProveedor { get; set; }
        public int UnidadesVendidas { get; set; }
        public string? Imagen { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset ActualizadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public Categoria? Categoria { get; set; }
        public Proveedor? Proveedor { get; set; }
        public ICollection<VentaDetalle> VentaDetalles { get; set; } = new List<VentaDetalle>();
        public ICollection<OrdenCompraDetalle> OrdenCompraDetalles { get; set; } = new List<OrdenCompraDetalle>();
        public ICollection<DevolucionDetalle> DevolucionDetalles { get; set; } = new List<DevolucionDetalle>();
        public ICollection<MovimientoInventario> MovimientosInventario { get; set; } = new List<MovimientoInventario>();
        public ICollection<CotizacionDetalle> CotizacionDetalles { get; set; } = new List<CotizacionDetalle>();
    }
}
