using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.DTOs.Cotizaciones;
using API_SI.Models;
using API_SI.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace API_SI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CotizacionesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CotizacionesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll(
            [FromQuery] int? page,
            [FromQuery] int pageSize = 15,
            [FromQuery] string? estado = null,
            [FromQuery] string? search = null)
        {
            var query = _context.Cotizaciones
                .Include(c => c.Cliente)
                .Include(c => c.Trabajador)
                .AsQueryable();

            if (!string.IsNullOrEmpty(estado))
            {
                query = query.Where(c => c.Estado.ToLower() == estado.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var sq = search.ToLower();
                query = query.Where(c =>
                    c.ClienteNombre.ToLower().Contains(sq) ||
                    c.Numero.ToLower().Contains(sq) ||
                    (c.ClienteTelefono != null && c.ClienteTelefono.Contains(sq)));
            }

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var orderedQuery = query
                .OrderByDescending(c => c.FechaCreacion)
                .Select(c => new
                {
                    c.Id,
                    c.Numero,
                    c.ClienteNombre,
                    ClienteTelefono = c.ClienteTelefono,
                    c.Total,
                    c.TotalMonedaLocal,
                    c.MonedaLocal,
                    c.FechaVencimiento,
                    DiasValidez = c.DiasValidez,
                    c.Estado,
                    FechaCreacion = c.FechaCreacion,
                    Trabajador = c.Trabajador.Nombre,
                    Vencida = c.FechaVencimiento < today && c.Estado == "pendiente"
                });

            // Paginación opcional
            if (page.HasValue)
            {
                int pg = page.Value < 1 ? 1 : page.Value;
                int ps = pageSize < 1 ? 15 : (pageSize > 100 ? 100 : pageSize);
                var totalItems = await orderedQuery.CountAsync();
                var totalPages = totalItems == 0 ? 1 : (int)Math.Ceiling((double)totalItems / ps);
                var items = await orderedQuery.Skip((pg - 1) * ps).Take(ps).ToListAsync();
                return Ok(new { items, totalItems, totalPages, page = pg, pageSize = ps });
            }

            var cotizaciones = await orderedQuery.ToListAsync();
            return Ok(cotizaciones);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetById(int id)
        {
            var cotizacion = await _context.Cotizaciones
                .Include(c => c.Cliente)
                .Include(c => c.Trabajador)
                .Include(c => c.CotizacionDetalles)
                .ThenInclude(cd => cd.Producto)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cotizacion == null)
            {
                return NotFound(new { Message = "Cotización no encontrada." });
            }

            var result = new
            {
                cotizacion.Id,
                cotizacion.Numero,
                cotizacion.ClienteNombre,
                cotizacion.ClienteCI,
                cotizacion.ClienteTelefono,
                cotizacion.ClienteEmail,
                cotizacion.DescuentoGlobal,
                cotizacion.Subtotal,
                cotizacion.MontoDescuento,
                cotizacion.Total,
                cotizacion.TotalMonedaLocal,
                cotizacion.TipoCambio,
                cotizacion.MonedaLocal,
                cotizacion.DiasValidez,
                cotizacion.FechaVencimiento,
                cotizacion.Notas,
                cotizacion.Estado,
                cotizacion.Plantilla,
                cotizacion.HashQR,
                cotizacion.FechaCreacion,
                cotizacion.CreadoEn,
                Cliente = cotizacion.Cliente != null ? new
                {
                    cotizacion.Cliente.Id,
                    cotizacion.Cliente.Nombre
                } : null,
                Trabajador = new
                {
                    cotizacion.Trabajador.Id,
                    cotizacion.Trabajador.Nombre
                },
                Detalles = cotizacion.CotizacionDetalles.Select(cd => new
                {
                    cd.Id,
                    cd.Cantidad,
                    cd.PrecioUnitario,
                    cd.Descuento,
                    cd.Subtotal,
                    Producto = new
                    {
                        cd.Producto.Id,
                        cd.Producto.Codigo,
                        cd.Producto.Nombre,
                        cd.Producto.Unidad
                    }
                }).ToList()
            };

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CrearCotizacionRequest request)
        {
            if (request == null || request.Detalles == null || !request.Detalles.Any())
            {
                return BadRequest(new { Message = "La cotización debe contener al menos un producto." });
            }

            var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int idTrabajador))
            {
                return Unauthorized(new { Message = "Trabajador no autorizado." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Obtener configuración global para tasa de cambio
                var config = await _context.Configuraciones.FirstOrDefaultAsync(c => c.Id == 1);
                if (config == null)
                {
                    return BadRequest(new { Message = "Configuración del sistema no encontrada." });
                }

                // Incrementar secuencial de cotizaciones
                string numeroCotizacion = $"{config.PrefijoFactura}COT-{config.SecuencialCotizacion:D6}";
                config.SecuencialCotizacion += 1;

                decimal totalMonedaLocal = request.Total * config.TipoCambio;

                var cotizacion = new Cotizacion
                {
                    Numero = numeroCotizacion,
                    IdCliente = request.IdCliente,
                    ClienteNombre = request.ClienteNombre,
                    ClienteCI = request.ClienteCI,
                    ClienteTelefono = request.ClienteTelefono,
                    ClienteEmail = request.ClienteEmail,
                    DescuentoGlobal = request.DescuentoGlobal,
                    Subtotal = request.Subtotal,
                    MontoDescuento = request.MontoDescuento,
                    Total = request.Total,
                    TotalMonedaLocal = totalMonedaLocal,
                    TipoCambio = config.TipoCambio,
                    MonedaLocal = config.MonedaVisualizacion,
                    DiasValidez = request.DiasValidez,
                    FechaVencimiento = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(request.DiasValidez)),
                    Notas = request.Notas,
                    Estado = "pendiente",
                    FechaCreacion = DateTimeOffset.UtcNow,
                    IdTrabajador = idTrabajador,
                    Plantilla = request.Plantilla,
                    CreadoEn = DateTimeOffset.UtcNow,
                    ActualizadoEn = DateTimeOffset.UtcNow
                };

                _context.Cotizaciones.Add(cotizacion);
                await _context.SaveChangesAsync(); // Generar ID

                foreach (var detDto in request.Detalles)
                {
                    var detalleSubtotal = detDto.Cantidad * detDto.PrecioUnitario;
                    var descuentoDetalle = (detalleSubtotal * detDto.Descuento) / 100;
                    var subtotalNeto = detalleSubtotal - descuentoDetalle;

                    var detalle = new CotizacionDetalle
                    {
                        IdCotizacion = cotizacion.Id,
                        IdProducto = detDto.IdProducto,
                        Cantidad = detDto.Cantidad,
                        PrecioUnitario = detDto.PrecioUnitario,
                        Descuento = detDto.Descuento,
                        Subtotal = subtotalNeto
                    };
                    _context.CotizacionDetalles.Add(detalle);
                }

                // Generar HashQR para validación pública
                string qrData = $"CotizacionId:{cotizacion.Id}|Total:{cotizacion.Total}|ValidoHasta:{cotizacion.FechaVencimiento}|Fecha:{cotizacion.FechaCreacion.Ticks}";
                using (SHA256 sha256 = SHA256.Create())
                {
                    byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(qrData));
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < hashBytes.Length; i++)
                    {
                        sb.Append(hashBytes[i].ToString("x2"));
                    }
                    cotizacion.HashQR = sb.ToString();
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetById), new { id = cotizacion.Id }, new { Id = cotizacion.Id, Numero = cotizacion.Numero, HashQR = cotizacion.HashQR });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        [HttpPut("{id}/estado")]
        public async Task<IActionResult> UpdateEstado(int id, [FromQuery] string estado)
        {
            var cotizacion = await _context.Cotizaciones.FindAsync(id);
            if (cotizacion == null)
            {
                return NotFound(new { Message = "Cotización no encontrada." });
            }

            var validStates = new[] { "pendiente", "aceptada", "rechazada", "vencida" };
            if (!validStates.Contains(estado.ToLower()))
            {
                return BadRequest(new { Message = "Estado de cotización inválido." });
            }

            cotizacion.Estado = estado.ToLower();
            cotizacion.ActualizadoEn = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Estado de cotización actualizado con éxito." });
        }
    }
}
