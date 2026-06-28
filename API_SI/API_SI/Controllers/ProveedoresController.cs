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
    public class ProveedoresController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProveedoresController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAll()
        {
            var provs = await _context.Proveedores
                .Include(p => p.ProveedorCategorias)
                .ThenInclude(pc => pc.Categoria)
                .Select(p => new
                {
                    p.Id,
                    p.Nombre,
                    p.Contacto,
                    p.Ruc,
                    p.Email,
                    p.Telefono,
                    p.Direccion,
                    p.CondicionPago,
                    p.Estado,
                    p.CreadoEn,
                    p.ActualizadoEn,
                    Categorias = p.ProveedorCategorias.Select(pc => new
                    {
                        pc.Categoria.Id,
                        pc.Categoria.Nombre
                    }).ToList()
                })
                .ToListAsync();

            return Ok(provs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Proveedor>> GetById(int id)
        {
            var proveedor = await _context.Proveedores
                .Include(p => p.ProveedorCategorias)
                .ThenInclude(pc => pc.Categoria)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (proveedor == null)
            {
                return NotFound(new { Message = "Proveedor no encontrado." });
            }
            return Ok(proveedor);
        }

        [HttpPost]
        public async Task<ActionResult<Proveedor>> Create([FromBody] Proveedor proveedor)
        {
            proveedor.CreadoEn = DateTimeOffset.UtcNow;
            proveedor.ActualizadoEn = DateTimeOffset.UtcNow;

            _context.Proveedores.Add(proveedor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = proveedor.Id }, proveedor);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Proveedor input)
        {
            var proveedor = await _context.Proveedores.FindAsync(id);
            if (proveedor == null)
            {
                return NotFound(new { Message = "Proveedor no encontrado." });
            }

            proveedor.Nombre = input.Nombre;
            proveedor.Contacto = input.Contacto;
            proveedor.Ruc = input.Ruc;
            proveedor.Email = input.Email;
            proveedor.Telefono = input.Telefono;
            proveedor.Direccion = input.Direccion;
            proveedor.CondicionPago = input.CondicionPago;
            proveedor.Estado = input.Estado;
            proveedor.ActualizadoEn = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(proveedor);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var proveedor = await _context.Proveedores.FindAsync(id);
            if (proveedor == null)
            {
                return NotFound(new { Message = "Proveedor no encontrado." });
            }

            _context.Proveedores.Remove(proveedor);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Proveedor eliminado con éxito." });
        }

        [HttpPut("{id}/categorias")]
        public async Task<IActionResult> UpdateCategorias(int id, [FromBody] List<int> idsCategorias)
        {
            var proveedor = await _context.Proveedores
                .Include(p => p.ProveedorCategorias)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (proveedor == null)
            {
                return NotFound(new { Message = "Proveedor no encontrado." });
            }

            // Remove existing categories
            _context.ProveedorCategorias.RemoveRange(proveedor.ProveedorCategorias);
            await _context.SaveChangesAsync();

            // Add new categories
            foreach (var idCat in idsCategorias)
            {
                _context.ProveedorCategorias.Add(new ProveedorCategoria
                {
                    IdProveedor = id,
                    IdCategoria = idCat
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Categorías asociadas actualizadas con éxito." });
        }
    }
}
