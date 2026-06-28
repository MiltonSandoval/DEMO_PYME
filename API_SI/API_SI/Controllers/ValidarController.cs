using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using System.Linq;
using System.Threading.Tasks;

namespace API_SI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ValidarController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ValidarController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Validar([FromQuery] string qr)
        {
            if (string.IsNullOrEmpty(qr))
            {
                return BadRequest(new { Message = "El parámetro 'qr' (hash) es requerido." });
            }

            // 1. Buscar en Ventas
            var venta = await _context.Ventas
                .Include(v => v.Cliente)
                .Include(v => v.Trabajador)
                .Include(v => v.MetodoPago)
                .Include(v => v.VentaDetalles)
                .ThenInclude(vd => vd.Producto)
                .FirstOrDefaultAsync(v => v.HashQR == qr);

            if (venta != null)
            {
                return Ok(new
                {
                    Tipo = "venta",
                    Id = venta.Id,
                    Fecha = venta.Fecha,
                    Subtotal = venta.Subtotal,
                    Descuento = venta.Descuento,
                    MontoDescuento = venta.MontoDescuento,
                    Impuesto = venta.Impuesto,
                    Total = venta.Total,
                    Estado = venta.Estado,
                    Cliente = new
                    {
                        venta.Cliente.Nombre,
                        venta.Cliente.CI,
                        venta.Cliente.Telefono
                    },
                    Trabajador = venta.Trabajador.Nombre,
                    MetodoPago = venta.MetodoPago.Nombre,
                    Detalles = venta.VentaDetalles.Select(vd => new
                    {
                        Producto = vd.Producto.Nombre,
                        vd.Cantidad,
                        vd.PrecioUnitario,
                        vd.Subtotal
                    }).ToList()
                });
            }

            // 2. Buscar en Cotizaciones
            var cotizacion = await _context.Cotizaciones
                .Include(c => c.Trabajador)
                .Include(c => c.CotizacionDetalles)
                .ThenInclude(cd => cd.Producto)
                .FirstOrDefaultAsync(c => c.HashQR == qr);

            if (cotizacion != null)
            {
                return Ok(new
                {
                    Tipo = "cotizacion",
                    Id = cotizacion.Id,
                    Numero = cotizacion.Numero,
                    FechaCreacion = cotizacion.FechaCreacion,
                    FechaVencimiento = cotizacion.FechaVencimiento,
                    Subtotal = cotizacion.Subtotal,
                    DescuentoGlobal = cotizacion.DescuentoGlobal,
                    MontoDescuento = cotizacion.MontoDescuento,
                    Total = cotizacion.Total,
                    TotalMonedaLocal = cotizacion.TotalMonedaLocal,
                    MonedaLocal = cotizacion.MonedaLocal,
                    Estado = cotizacion.Estado,
                    ClienteNombre = cotizacion.ClienteNombre,
                    ClienteCI = cotizacion.ClienteCI,
                    Trabajador = cotizacion.Trabajador.Nombre,
                    Detalles = cotizacion.CotizacionDetalles.Select(cd => new
                    {
                        Producto = cd.Producto.Nombre,
                        cd.Cantidad,
                        cd.PrecioUnitario,
                        cd.Descuento,
                        cd.Subtotal
                    }).ToList()
                });
            }

            return NotFound(new { Authentic = false, Message = "El código de verificación no coincide con ningún documento auténtico en ElectroShop." });
        }
    }
}
// Note: This endpoint is public for validation pages (no Auth required).
