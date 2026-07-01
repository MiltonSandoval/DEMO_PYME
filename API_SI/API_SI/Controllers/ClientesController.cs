using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.Models;
using API_SI.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API_SI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClientesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClientesController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/clientes
        /// Si se incluye el parámetro "page", devuelve PagedResult paginado.
        /// Si NO se incluye, devuelve la lista completa (retrocompatibilidad con POS).
        /// </summary>
        [HttpGet]
        // Comentario de control de cambios de paginación
        public async Task<ActionResult> GetAll(
            [FromQuery] int? page,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null)
        {
            var query = _context.Clientes.AsQueryable();

            // Filtrado en servidor
            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                query = query.Where(c =>
                    (c.Nombre != null && c.Nombre.ToLower().Contains(q)) ||
                    (c.CI != null && c.CI.Contains(q)) ||
                    (c.Telefono != null && c.Telefono.Contains(q)) ||
                    (c.Email != null && c.Email.ToLower().Contains(q)));
            }

            // Ordenamiento estable
            query = query.OrderBy(c => c.Nombre);

            // Paginación opcional
            if (page.HasValue)
            {
                var paged = await query.ToPagedResultAsync(page.Value, pageSize);
                return Ok(paged);
            }

            return Ok(await query.ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Cliente>> GetById(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
            {
                return NotFound(new { Message = "Cliente no encontrado." });
            }
            return Ok(cliente);
        }

        [HttpGet("buscar")]
        public async Task<ActionResult<IEnumerable<Cliente>>> Buscar([FromQuery] string q)
        {
            if (string.IsNullOrEmpty(q))
            {
                return Ok(await _context.Clientes.OrderBy(c => c.Nombre).ToListAsync());
            }

            var resultados = await _context.Clientes
                .Where(c => (c.Nombre != null && c.Nombre.ToLower().Contains(q.ToLower())) ||
                            (c.CI != null && c.CI.Contains(q)) ||
                            (c.Telefono != null && c.Telefono.Contains(q)))
                .Take(10)
                .ToListAsync();

            return Ok(resultados);
        }

        [HttpPost]
        public async Task<ActionResult<Cliente>> Create([FromBody] Cliente cliente)
        {
            if (string.IsNullOrEmpty(cliente.Tipo))
            {
                cliente.Tipo = "normal";
            }
            cliente.FechaRegistro = DateOnly.FromDateTime(DateTime.UtcNow);
            cliente.CreadoEn = DateTimeOffset.UtcNow;
            cliente.ActualizadoEn = DateTimeOffset.UtcNow;
            cliente.TotalCompras = 0;
            cliente.TotalGastado = 0;

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = cliente.Id }, cliente);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Cliente input)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
            {
                return NotFound(new { Message = "Cliente no encontrado." });
            }

            cliente.Nombre = input.Nombre;
            cliente.Email = input.Email;
            cliente.Telefono = input.Telefono;
            cliente.CI = input.CI;
            cliente.Direccion = input.Direccion;
            cliente.Tipo = string.IsNullOrEmpty(input.Tipo) ? "normal" : input.Tipo;
            cliente.Puntos = input.Puntos;
            cliente.ActualizadoEn = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(cliente);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
            {
                return NotFound(new { Message = "Cliente no encontrado." });
            }

            // Check if there are sales registered to this client
            bool hasSales = await _context.Ventas.AnyAsync(v => v.IdCliente == id);
            if (hasSales)
            {
                return BadRequest(new { Message = "No se puede eliminar el cliente porque posee historial de compras." });
            }

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cliente eliminado con éxito." });
        }
    }
}
