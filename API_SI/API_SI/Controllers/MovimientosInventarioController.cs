using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.Models;
using API_SI.Extensions;
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
    public class MovimientosInventarioController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MovimientosInventarioController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        // Comentario de control de cambios de paginación
        public async Task<ActionResult> GetAll(
            [FromQuery] int? page,
            [FromQuery] int pageSize = 15,
            [FromQuery] int? idProducto = null,
            [FromQuery] string? tipo = null,
            [FromQuery] string? fechaInicio = null,
            [FromQuery] string? fechaFin = null)
        {
            var query = _context.MovimientosInventario
                .Include(m => m.Producto)
                .Include(m => m.Proveedor)
                .Include(m => m.Trabajador)
                .AsQueryable();

            if (idProducto.HasValue)
            {
                query = query.Where(m => m.IdProducto == idProducto.Value);
            }

            if (!string.IsNullOrEmpty(tipo))
            {
                query = query.Where(m => m.Tipo.ToLower() == tipo.ToLower());
            }

            if (!string.IsNullOrEmpty(fechaInicio) && DateTimeOffset.TryParse(fechaInicio, out var start))
            {
                query = query.Where(m => m.Fecha >= start);
            }

            if (!string.IsNullOrEmpty(fechaFin) && DateTimeOffset.TryParse(fechaFin, out var end))
            {
                query = query.Where(m => m.Fecha <= end);
            }

            var orderedQuery = query
                .OrderByDescending(m => m.Fecha)
                .Select(m => new
                {
                    m.Id,
                    m.Fecha,
                    m.Tipo,
                    m.Cantidad,
                    m.Motivo,
                    Producto = m.Producto.Nombre,
                    CodigoProducto = m.Producto.Codigo,
                    Proveedor = m.Proveedor != null ? m.Proveedor.Nombre : null,
                    Trabajador = m.Trabajador.Nombre
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

            var movimientos = await orderedQuery.ToListAsync();
            return Ok(movimientos);
        }

        [HttpPost]
        public async Task<IActionResult> CreateManualAdjustment([FromBody] MovimientoInventario input)
        {
            var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int idTrabajador))
            {
                return Unauthorized(new { Message = "Trabajador no autorizado." });
            }

            var producto = await _context.Productos.FindAsync(input.IdProducto);
            if (producto == null)
            {
                return BadRequest(new { Message = "Producto no encontrado." });
            }

            if (input.Cantidad <= 0)
            {
                return BadRequest(new { Message = "La cantidad debe ser mayor a cero." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                input.IdTrabajador = idTrabajador;
                input.Fecha = DateTimeOffset.UtcNow;
                input.CreadoEn = DateTimeOffset.UtcNow;

                // Adjust stock based on tipo
                if (input.Tipo == "entrada")
                {
                    producto.Stock += input.Cantidad;
                }
                else if (input.Tipo == "salida")
                {
                    if (producto.Stock < input.Cantidad)
                    {
                        return BadRequest(new { Message = $"Stock insuficiente. Stock actual: {producto.Stock}, Cantidad a descontar: {input.Cantidad}" });
                    }
                    producto.Stock -= input.Cantidad;
                }
                else if (input.Tipo == "ajuste")
                {
                    // Un ajuste manual decrementa el stock por defecto en nuestro POS
                    // o lo establece a un valor absoluto. Pero según DB.sql "entrada", "salida" y "ajuste".
                    // Vamos a tratar "ajuste" como salida o entrada dependiendo del signo o valor de la cantidad.
                    // Si el usuario quiere establecer un stock absoluto, pasamos la diferencia.
                    // Asumiremos que el ajuste manual provisto por el JSON ya indica la cantidad neta a descontar/sumar.
                    // Trataremos el tipo "ajuste" por defecto como salida de stock (merma o pérdida).
                    if (producto.Stock < input.Cantidad)
                    {
                        return BadRequest(new { Message = $"Stock insuficiente para realizar el ajuste. Stock actual: {producto.Stock}, Requerido: {input.Cantidad}" });
                    }
                    producto.Stock -= input.Cantidad;
                }
                else
                {
                    return BadRequest(new { Message = "Tipo de movimiento no válido. Debe ser 'entrada', 'salida' o 'ajuste'." });
                }

                _context.MovimientosInventario.Add(input);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { Message = "Ajuste de inventario realizado con éxito.", StockActual = producto.Stock });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
