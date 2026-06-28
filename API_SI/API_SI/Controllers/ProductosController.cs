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
    public class ProductosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Producto>>> GetAll()
        {
            return await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Proveedor)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Producto>> GetById(int id)
        {
            var producto = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Proveedor)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (producto == null)
            {
                return NotFound(new { Message = "Producto no encontrado." });
            }
            return Ok(producto);
        }

        [HttpGet("buscar")]
        public async Task<ActionResult<IEnumerable<Producto>>> Buscar([FromQuery] string q)
        {
            if (string.IsNullOrEmpty(q))
            {
                return await GetAll();
            }

            var resultados = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Proveedor)
                .Where(p => p.Nombre.ToLower().Contains(q.ToLower()) ||
                            p.Codigo.Contains(q))
                .Take(15)
                .ToListAsync();

            return Ok(resultados);
        }

        [HttpGet("alertas-stock")]
        public async Task<ActionResult<IEnumerable<Producto>>> GetAlertasStock()
        {
            var alertas = await _context.Productos
                .Include(p => p.Categoria)
                .Where(p => p.Stock <= p.StockMinimo)
                .ToListAsync();

            return Ok(alertas);
        }

        [HttpPost]
        public async Task<ActionResult<Producto>> Create([FromBody] Producto producto)
        {
            // Validar código único
            bool codigoExists = await _context.Productos.AnyAsync(p => p.Codigo == producto.Codigo);
            if (codigoExists)
            {
                return BadRequest(new { Message = "El código de barra ya se encuentra registrado." });
            }

            producto.UnidadesVendidas = 0;
            producto.CreadoEn = DateTimeOffset.UtcNow;
            producto.ActualizadoEn = DateTimeOffset.UtcNow;

            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = producto.Id }, producto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Producto input)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null)
            {
                return NotFound(new { Message = "Producto no encontrado." });
            }

            // Validar código único si ha cambiado
            if (input.Codigo != producto.Codigo)
            {
                bool codigoExists = await _context.Productos.AnyAsync(p => p.Codigo == input.Codigo && p.Id != id);
                if (codigoExists)
                {
                    return BadRequest(new { Message = "El código de barra ya se encuentra registrado por otro producto." });
                }
                producto.Codigo = input.Codigo;
            }

            producto.Nombre = input.Nombre;
            producto.IdCategoria = input.IdCategoria;
            producto.PrecioCompra = input.PrecioCompra;
            producto.PrecioVenta = input.PrecioVenta;
            producto.Stock = input.Stock;
            producto.StockMinimo = input.StockMinimo;
            producto.Unidad = input.Unidad;
            producto.Estado = input.Estado;
            producto.IdProveedor = input.IdProveedor;
            producto.Imagen = input.Imagen;
            producto.ActualizadoEn = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(producto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null)
            {
                return NotFound(new { Message = "Producto no encontrado." });
            }

            // Check if there are sales details referencing this product
            bool hasSales = await _context.VentaDetalles.AnyAsync(vd => vd.IdProducto == id);
            if (hasSales)
            {
                return BadRequest(new { Message = "No se puede eliminar el producto porque tiene ventas asociadas." });
            }

            _context.Productos.Remove(producto);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Producto eliminado con éxito." });
        }
    }
}
