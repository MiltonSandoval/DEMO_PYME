using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.DTOs.OrdenCompra;
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
    public class OrdenCompraController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdenCompraController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll()
        {
            var ordenes = await _context.OrdenesCompra
                .Include(o => o.Proveedor)
                .Include(o => o.Trabajador)
                .OrderByDescending(o => o.Fecha)
                .Select(o => new
                {
                    o.Id,
                    o.Fecha,
                    o.Subtotal,
                    o.Impuesto,
                    o.Total,
                    o.Estado,
                    o.FechaEsperada,
                    o.FechaRecepcion,
                    Proveedor = o.Proveedor.Nombre,
                    Trabajador = o.Trabajador.Nombre
                })
                .ToListAsync();

            return Ok(ordenes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetById(int id)
        {
            var orden = await _context.OrdenesCompra
                .Include(o => o.Proveedor)
                .Include(o => o.Trabajador)
                .Include(o => o.OrdenCompraDetalles)
                .ThenInclude(od => od.Producto)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (orden == null)
            {
                return NotFound(new { Message = "Orden de compra no encontrada." });
            }

            var result = new
            {
                orden.Id,
                orden.Fecha,
                orden.Subtotal,
                orden.Impuesto,
                orden.Total,
                orden.Estado,
                orden.FechaEsperada,
                orden.FechaRecepcion,
                orden.Notas,
                Proveedor = new
                {
                    orden.Proveedor.Id,
                    orden.Proveedor.Nombre,
                    orden.Proveedor.Contacto,
                    orden.Proveedor.Telefono
                },
                Trabajador = new
                {
                    orden.Trabajador.Id,
                    orden.Trabajador.Nombre
                },
                Detalles = orden.OrdenCompraDetalles.Select(od => new
                {
                    od.Id,
                    od.Cantidad,
                    od.CostoUnitario,
                    od.Subtotal,
                    Producto = new
                    {
                        od.Producto.Id,
                        od.Producto.Codigo,
                        od.Producto.Nombre,
                        od.Producto.Unidad
                    }
                }).ToList()
            };

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CrearOrdenCompraRequest request)
        {
            if (request == null || request.Detalles == null || !request.Detalles.Any())
            {
                return BadRequest(new { Message = "La orden de compra debe contener al menos un detalle." });
            }

            var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int idTrabajador))
            {
                return Unauthorized(new { Message = "Trabajador no autorizado." });
            }

            var orden = new OrdenCompra
            {
                Fecha = DateOnly.FromDateTime(DateTime.UtcNow),
                IdProveedor = request.IdProveedor,
                IdTrabajador = idTrabajador,
                Subtotal = request.Subtotal,
                Impuesto = request.Impuesto,
                Total = request.Total,
                Estado = "pendiente",
                FechaEsperada = request.FechaEsperada,
                Notas = request.Notas,
                CreadoEn = DateTimeOffset.UtcNow,
                ActualizadoEn = DateTimeOffset.UtcNow
            };

            _context.OrdenesCompra.Add(orden);
            await _context.SaveChangesAsync(); // Generar ID

            foreach (var detDto in request.Detalles)
            {
                var detalle = new OrdenCompraDetalle
                {
                    IdOrdenCompra = orden.Id,
                    IdProducto = detDto.IdProducto,
                    Cantidad = detDto.Cantidad,
                    CostoUnitario = detDto.CostoUnitario,
                    Subtotal = detDto.Cantidad * detDto.CostoUnitario
                };
                _context.OrdenCompraDetalles.Add(detalle);
            }

            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = orden.Id }, new { Id = orden.Id });
        }

        [HttpPut("{id}/recibir")]
        public async Task<IActionResult> Recibir(int id)
        {
            var orden = await _context.OrdenesCompra
                .Include(o => o.OrdenCompraDetalles)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (orden == null)
            {
                return NotFound(new { Message = "Orden de compra no encontrada." });
            }

            if (orden.Estado == "recibida")
            {
                return BadRequest(new { Message = "La orden de compra ya ha sido recibida anteriormente." });
            }

            var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int idTrabajador))
            {
                return Unauthorized(new { Message = "Trabajador no autorizado." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                orden.Estado = "recibida";
                orden.FechaRecepcion = DateOnly.FromDateTime(DateTime.UtcNow);
                orden.ActualizadoEn = DateTimeOffset.UtcNow;

                foreach (var detalle in orden.OrdenCompraDetalles)
                {
                    var producto = await _context.Productos.FindAsync(detalle.IdProducto);
                    if (producto != null)
                    {
                        // Actualizar stock de producto y registrar costo de compra
                        producto.Stock += detalle.Cantidad;
                        producto.PrecioCompra = detalle.CostoUnitario; // Actualizar costo promedio / último costo

                        // Registrar entrada en Kardex
                        var movimiento = new MovimientoInventario
                        {
                            Fecha = DateTimeOffset.UtcNow,
                            Tipo = "entrada",
                            IdProducto = detalle.IdProducto,
                            Cantidad = detalle.Cantidad,
                            Motivo = $"Recepción Orden Compra #{orden.Id}",
                            IdProveedor = orden.IdProveedor,
                            IdTrabajador = idTrabajador,
                            CreadoEn = DateTimeOffset.UtcNow
                        };

                        _context.MovimientosInventario.Add(movimiento);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { Message = "Orden de compra marcada como recibida y stock de inventario actualizado." });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
// Note: If Orden is cancelled/deleted it's regular EF Core operations.
