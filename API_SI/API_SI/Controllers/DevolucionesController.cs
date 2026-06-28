using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.DTOs.Devoluciones;
using API_SI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace API_SI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DevolucionesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DevolucionesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll()
        {
            var devs = await _context.Devoluciones
                .Include(d => d.Venta)
                .Include(d => d.Trabajador)
                .OrderByDescending(d => d.Fecha)
                .Select(d => new
                {
                    d.Id,
                    d.Fecha,
                    d.Total,
                    d.MetodoReembolso,
                    d.Reingreso,
                    d.Estado,
                    IdVenta = d.IdVenta,
                    Trabajador = d.Trabajador.Nombre,
                    ProductoNombre = d.DevolucionDetalles.Select(dd => dd.Producto.Nombre).FirstOrDefault() ?? "Varios",
                    Cantidad = d.DevolucionDetalles.Sum(dd => dd.Cantidad),
                    Motivo = d.DevolucionDetalles.Select(dd => dd.Motivo).FirstOrDefault() ?? d.Notas,
                    Tipo = d.Reingreso ? "Devolucion" : "Merma"
                })
                .ToListAsync();

            return Ok(devs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetById(int id)
        {
            var dev = await _context.Devoluciones
                .Include(d => d.Venta)
                .Include(d => d.Trabajador)
                .Include(d => d.DevolucionDetalles)
                .ThenInclude(dd => dd.Producto)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (dev == null)
            {
                return NotFound(new { Message = "Devolución no encontrada." });
            }

            var result = new
            {
                dev.Id,
                dev.Fecha,
                dev.Total,
                dev.MetodoReembolso,
                dev.Reingreso,
                dev.Estado,
                dev.Notas,
                dev.CreadoEn,
                IdVenta = dev.IdVenta,
                Trabajador = new
                {
                    dev.Trabajador.Id,
                    dev.Trabajador.Nombre
                },
                Detalles = dev.DevolucionDetalles.Select(dd => new
                {
                    dd.Id,
                    dd.Cantidad,
                    dd.PrecioUnitario,
                    dd.Subtotal,
                    dd.Motivo,
                    Producto = new
                    {
                        dd.Producto.Id,
                        dd.Producto.Codigo,
                        dd.Producto.Nombre,
                        dd.Producto.Unidad
                    }
                }).ToList()
            };

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CrearDevolucionRequest request)
        {
            if (request == null || request.Detalles == null || !request.Detalles.Any())
            {
                return BadRequest(new { Message = "La devolución debe contener al menos un producto." });
            }

            var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int idTrabajador))
            {
                return Unauthorized(new { Message = "Trabajador no autorizado." });
            }

            // Validar la venta de referencia
            var venta = await _context.Ventas
                .Include(v => v.VentaDetalles)
                .Include(v => v.Cliente)
                .FirstOrDefaultAsync(v => v.Id == request.IdVenta);

            if (venta == null)
            {
                return BadRequest(new { Message = "Venta de referencia no encontrada." });
            }

            if (venta.Estado == "cancelada")
            {
                return BadRequest(new { Message = "No se pueden procesar devoluciones sobre una venta cancelada." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Crear cabecera devolución
                var devolucion = new Devolucion
                {
                    Fecha = DateTimeOffset.UtcNow,
                    IdVenta = request.IdVenta,
                    IdTrabajador = idTrabajador,
                    Total = request.Total,
                    MetodoReembolso = request.MetodoReembolso,
                    Reingreso = request.Reingreso,
                    Estado = "procesada",
                    Notas = request.Notas,
                    CreadoEn = DateTimeOffset.UtcNow
                };

                _context.Devoluciones.Add(devolucion);
                await _context.SaveChangesAsync(); // Generar ID

                foreach (var detDto in request.Detalles)
                {
                    // Validar si el producto estaba en la venta original y validar las cantidades máximas
                    var ventaDetalle = venta.VentaDetalles.FirstOrDefault(vd => vd.IdProducto == detDto.IdProducto);
                    if (ventaDetalle == null)
                    {
                        return BadRequest(new { Message = $"El producto con ID {detDto.IdProducto} no pertenece a la venta original." });
                    }

                    // Sumar devoluciones previas para verificar que no supere la compra
                    var devueltasAnteriormente = await _context.DevolucionDetalles
                        .Where(dd => dd.Devolucion.IdVenta == venta.Id && dd.IdProducto == detDto.IdProducto)
                        .SumAsync(dd => dd.Cantidad);

                    if (devueltasAnteriormente + detDto.Cantidad > ventaDetalle.Cantidad)
                    {
                        return BadRequest(new { Message = $"La cantidad a devolver de '{ventaDetalle.Producto?.Nombre ?? "producto"}' supera el saldo disponible. Comprado: {ventaDetalle.Cantidad}, Devuelto anteriormente: {devueltasAnteriormente}, Solicitado ahora: {detDto.Cantidad}" });
                    }

                    var producto = await _context.Productos.FindAsync(detDto.IdProducto);
                    if (producto == null)
                    {
                        return BadRequest(new { Message = $"Producto con ID {detDto.IdProducto} no encontrado." });
                    }

                    // Crear detalle devolución
                    var detalle = new DevolucionDetalle
                    {
                        IdDevolucion = devolucion.Id,
                        IdProducto = detDto.IdProducto,
                        Cantidad = detDto.Cantidad,
                        PrecioUnitario = detDto.PrecioUnitario,
                        Subtotal = detDto.Cantidad * detDto.PrecioUnitario,
                        Motivo = detDto.Motivo
                    };
                    _context.DevolucionDetalles.Add(detalle);

                    // Si reingresa a stock físico, restituir
                    if (request.Reingreso)
                    {
                        producto.Stock += detDto.Cantidad;

                        // Registrar entrada en el Kardex
                        var movimiento = new MovimientoInventario
                        {
                            Fecha = DateTimeOffset.UtcNow,
                            Tipo = "entrada",
                            IdProducto = detDto.IdProducto,
                            Cantidad = detDto.Cantidad,
                            Motivo = $"Devolución Cliente (Venta #{venta.Id}) - Reingreso OK",
                            IdTrabajador = idTrabajador,
                            CreadoEn = DateTimeOffset.UtcNow
                        };
                        _context.MovimientosInventario.Add(movimiento);
                    }
                    else
                    {
                        // Si no reingresa (producto dañado / scrap), registrar como salida por merma (ajuste)
                        var movimiento = new MovimientoInventario
                        {
                            Fecha = DateTimeOffset.UtcNow,
                            Tipo = "salida",
                            IdProducto = detDto.IdProducto,
                            Cantidad = detDto.Cantidad,
                            Motivo = $"Devolución Cliente (Venta #{venta.Id}) - Merma (Motivo: {detDto.Motivo})",
                            IdTrabajador = idTrabajador,
                            CreadoEn = DateTimeOffset.UtcNow
                        };
                        _context.MovimientosInventario.Add(movimiento);
                    }
                }

                // Descontar puntos de fidelidad del cliente de acuerdo al total reembolsado
                venta.Cliente.TotalGastado = Math.Max(0, venta.Cliente.TotalGastado - devolucion.Total);
                venta.Cliente.Puntos = Math.Max(0, venta.Cliente.Puntos - (int)(devolucion.Total / 10));

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetById), new { id = devolucion.Id }, new { Id = devolucion.Id });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
