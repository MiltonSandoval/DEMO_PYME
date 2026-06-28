using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API_SI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CategoriasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll()
        {
            var categorias = await _context.Categorias
                .Select(c => new
                {
                    c.Id,
                    c.Nombre,
                    c.Descripcion,
                    c.Icono,
                    c.Color,
                    c.ColorFondo,
                    c.CreadoEn,
                    c.ActualizadoEn,
                    CantidadProductos = c.Productos.Count()
                })
                .ToListAsync();

            return Ok(categorias);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Categoria>> GetById(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null)
            {
                return NotFound(new { Message = "Categoría no encontrada." });
            }
            return Ok(categoria);
        }

        [HttpPost]
        public async Task<ActionResult<Categoria>> Create([FromBody] Categoria categoria)
        {
            categoria.CreadoEn = DateTimeOffset.UtcNow;
            categoria.ActualizadoEn = DateTimeOffset.UtcNow;

            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = categoria.Id }, categoria);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Categoria input)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null)
            {
                return NotFound(new { Message = "Categoría no encontrada." });
            }

            categoria.Nombre = input.Nombre;
            categoria.Descripcion = input.Descripcion;
            categoria.Icono = input.Icono;
            categoria.Color = input.Color;
            categoria.ColorFondo = input.ColorFondo;
            categoria.ActualizadoEn = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(categoria);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null)
            {
                return NotFound(new { Message = "Categoría no encontrada." });
            }

            // Check if there are products using this category
            bool hasProducts = await _context.Productos.AnyAsync(p => p.IdCategoria == id);
            if (hasProducts)
            {
                return BadRequest(new { Message = "No se puede eliminar la categoría porque contiene productos asociados." });
            }

            _context.Categorias.Remove(categoria);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Categoría eliminada con éxito." });
        }
    }
}
