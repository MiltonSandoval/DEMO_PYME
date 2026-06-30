using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.DTOs.Ventas;
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
    public class VentasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VentasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll(
            [FromQuery] int? page,
            [FromQuery] int pageSize = 15,
            [FromQuery] string? fechaInicio = null,
            [FromQuery] string? fechaFin = null,
            [FromQuery] int? idCliente = null,
            [FromQuery] string? estado = null,
            [FromQuery] string? search = null)
        {
            var query = _context.Ventas
                .Include(v => v.Cliente)
                .Include(v => v.Trabajador)
                .Include(v => v.MetodoPago)
                .AsQueryable();

            if (!string.IsNullOrEmpty(fechaInicio) && DateTimeOffset.TryParse(fechaInicio, out var start))
            {
                query = query.Where(v => v.Fecha >= start);
            }

            if (!string.IsNullOrEmpty(fechaFin) && DateTimeOffset.TryParse(fechaFin, out var end))
            {
                query = query.Where(v => v.Fecha <= end);
            }

            if (idCliente.HasValue)
            {
                query = query.Where(v => v.IdCliente == idCliente.Value);
            }

            if (!string.IsNullOrEmpty(estado))
            {
                query = query.Where(v => v.Estado.ToLower() == estado.ToLower());
            }

            // Búsqueda por nombre de cliente o trabajador
            if (!string.IsNullOrWhiteSpace(search))
            {
                var sq = search.ToLower();
                query = query.Where(v =>
                    v.Cliente.Nombre.ToLower().Contains(sq) ||
                    v.Trabajador.Nombre.ToLower().Contains(sq) ||
                    v.Id.ToString().Contains(sq));
            }

            // Ordenamiento estable
            var orderedQuery = query
                .OrderByDescending(v => v.Fecha)
                .Select(v => new
                {
                    v.Id,
                    v.Fecha,
                    v.Subtotal,
                    v.Descuento,
                    v.MontoDescuento,
                    v.Impuesto,
                    v.Total,
                    v.Estado,
                    Cliente = v.Cliente.Nombre,
                    Trabajador = v.Trabajador.Nombre,
                    MetodoPago = v.MetodoPago.Nombre
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

            var ventas = await orderedQuery.ToListAsync();
            return Ok(ventas);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetById(int id)
        {
            var venta = await _context.Ventas
                .Include(v => v.Cliente)
                .Include(v => v.Trabajador)
                .Include(v => v.MetodoPago)
                .Include(v => v.VentaDetalles)
                .ThenInclude(vd => vd.Producto)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (venta == null)
            {
                return NotFound(new { Message = "Venta no encontrada." });
            }

            var result = new
            {
                venta.Id,
                venta.Fecha,
                venta.Subtotal,
                venta.Descuento,
                venta.MontoDescuento,
                venta.Impuesto,
                venta.Total,
                venta.EfectivoRecibido,
                venta.DireccionEnvio,
                venta.Estado,
                venta.HashQR,
                venta.CreadoEn,
                Cliente = new
                {
                    venta.Cliente.Id,
                    venta.Cliente.Nombre,
                    venta.Cliente.CI,
                    venta.Cliente.Telefono,
                    venta.Cliente.Direccion
                },
                Trabajador = new
                {
                    venta.Trabajador.Id,
                    venta.Trabajador.Nombre
                },
                MetodoPago = new
                {
                    venta.MetodoPago.Id,
                    venta.MetodoPago.Nombre,
                    venta.MetodoPago.Clave
                },
                Detalles = venta.VentaDetalles.Select(vd => new
                {
                    vd.Id,
                    vd.Cantidad,
                    vd.PrecioUnitario,
                    vd.Subtotal,
                    Producto = new
                    {
                        vd.Producto.Id,
                        vd.Producto.Codigo,
                        vd.Producto.Nombre,
                        vd.Producto.Unidad
                    }
                }).ToList()
            };

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CrearVentaRequest request)
        {
            if (request == null || request.Detalles == null || !request.Detalles.Any())
            {
                return BadRequest(new { Message = "La venta debe contener al menos un detalle de producto." });
            }

            // Obtener el ID del trabajador logueado
            var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int idTrabajador))
            {
                return Unauthorized(new { Message = "Trabajador no autorizado." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Validar que la caja esté abierta para este trabajador
                var sesionCaja = await _context.SesionesCaja
                    .FirstOrDefaultAsync(s => s.IdTrabajador == idTrabajador && s.Estado == "abierta");

                if (sesionCaja == null)
                {
                    return BadRequest(new { Message = "Debe abrir una sesión de caja antes de realizar una venta." });
                }

                // 2. Validar Cliente
                var cliente = await _context.Clientes.FindAsync(request.IdCliente);
                if (cliente == null)
                {
                    return BadRequest(new { Message = "Cliente no encontrado." });
                }

                // 3. Validar Método de Pago
                var metodo = await _context.MetodosPago.FindAsync(request.IdMetodoPago);
                if (metodo == null)
                {
                    return BadRequest(new { Message = "Método de pago no encontrado o inactivo." });
                }

                // 4. Crear registro Venta
                var venta = new Venta
                {
                    Fecha = DateTimeOffset.UtcNow,
                    IdCliente = request.IdCliente,
                    IdTrabajador = idTrabajador,
                    IdMetodoPago = request.IdMetodoPago,
                    Subtotal = request.Subtotal,
                    Descuento = request.Descuento,
                    MontoDescuento = request.MontoDescuento,
                    Impuesto = request.Impuesto,
                    Total = request.Total,
                    EfectivoRecibido = request.EfectivoRecibido,
                    DireccionEnvio = request.DireccionEnvio,
                    Estado = "completada",
                    CreadoEn = DateTimeOffset.UtcNow
                };

                _context.Ventas.Add(venta);
                await _context.SaveChangesAsync(); // Generar ID de venta

                decimal subtotalCalculado = 0;

                // 5. Procesar Detalles y Stock
                foreach (var detDto in request.Detalles)
                {
                    var producto = await _context.Productos.FindAsync(detDto.IdProducto);
                    if (producto == null)
                    {
                        return BadRequest(new { Message = $"Producto con ID {detDto.IdProducto} no encontrado." });
                    }

                    if (producto.Estado != "activo")
                    {
                        return BadRequest(new { Message = $"El producto '{producto.Nombre}' no está activo." });
                    }

                    if (producto.Stock < detDto.Cantidad)
                    {
                        return BadRequest(new { Message = $"Stock insuficiente para el producto '{producto.Nombre}'. Disponible: {producto.Stock}, Solicitado: {detDto.Cantidad}" });
                    }

                    // Descontar stock e incrementar ventas
                    producto.Stock -= detDto.Cantidad;
                    producto.UnidadesVendidas += detDto.Cantidad;

                    decimal detalleSubtotal = detDto.Cantidad * detDto.PrecioUnitario;
                    subtotalCalculado += detalleSubtotal;

                    var detalle = new VentaDetalle
                    {
                        IdVenta = venta.Id,
                        IdProducto = detDto.IdProducto,
                        Cantidad = detDto.Cantidad,
                        PrecioUnitario = detDto.PrecioUnitario,
                        Subtotal = detalleSubtotal
                    };

                    _context.VentaDetalles.Add(detalle);

                    // Registrar Movimiento de Inventario
                    var movimiento = new MovimientoInventario
                    {
                        Fecha = DateTimeOffset.UtcNow,
                        Tipo = "salida",
                        IdProducto = detDto.IdProducto,
                        Cantidad = detDto.Cantidad,
                        Motivo = $"Venta POS #{venta.Id}",
                        IdTrabajador = idTrabajador,
                        CreadoEn = DateTimeOffset.UtcNow
                    };

                    _context.MovimientosInventario.Add(movimiento);
                }

                // 6. Actualizar totales del Cliente y acumular puntos
                cliente.TotalCompras += 1;
                cliente.TotalGastado += venta.Total;
                // Sistema simple: 1 punto por cada $10 gastados completos
                cliente.Puntos += (int)(venta.Total / 10);

                // 7. Generar HashQR para validación de recibo
                string qrData = $"VentaId:{venta.Id}|Total:{venta.Total}|ClienteCI:{cliente.CI ?? "N/A"}|Fecha:{venta.Fecha.Ticks}";
                using (SHA256 sha256 = SHA256.Create())
                {
                    byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(qrData));
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < hashBytes.Length; i++)
                    {
                        sb.Append(hashBytes[i].ToString("x2"));
                    }
                    venta.HashQR = sb.ToString();
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetById), new { id = venta.Id }, new { Id = venta.Id, HashQR = venta.HashQR });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        [HttpPut("{id}/cancelar")]
        public async Task<IActionResult> Cancelar(int id)
        {
            var venta = await _context.Ventas
                .Include(v => v.VentaDetalles)
                .Include(v => v.Cliente)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (venta == null)
            {
                return NotFound(new { Message = "Venta no encontrada." });
            }

            if (venta.Estado == "cancelada")
            {
                return BadRequest(new { Message = "La venta ya se encuentra cancelada." });
            }

            var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int idTrabajador))
            {
                return Unauthorized(new { Message = "Trabajador no autorizado." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                venta.Estado = "cancelada";

                // Revertir el Stock de los productos
                foreach (var detalle in venta.VentaDetalles)
                {
                    var producto = await _context.Productos.FindAsync(detalle.IdProducto);
                    if (producto != null)
                    {
                        producto.Stock += detalle.Cantidad;
                        producto.UnidadesVendidas = Math.Max(0, producto.UnidadesVendidas - detalle.Cantidad);

                        // Registrar Movimiento de Inventario de Ajuste
                        var movimiento = new MovimientoInventario
                        {
                            Fecha = DateTimeOffset.UtcNow,
                            Tipo = "entrada",
                            IdProducto = detalle.IdProducto,
                            Cantidad = detalle.Cantidad,
                            Motivo = $"Devolución por cancelación de Venta #{venta.Id}",
                            IdTrabajador = idTrabajador,
                            CreadoEn = DateTimeOffset.UtcNow
                        };

                        _context.MovimientosInventario.Add(movimiento);
                    }
                }

                // Ajustar estadísticas del cliente
                venta.Cliente.TotalCompras = Math.Max(0, venta.Cliente.TotalCompras - 1);
                venta.Cliente.TotalGastado = Math.Max(0, venta.Cliente.TotalGastado - venta.Total);
                venta.Cliente.Puntos = Math.Max(0, venta.Cliente.Puntos - (int)(venta.Total / 10));

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { Message = "Venta cancelada con éxito y stock restituido." });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
