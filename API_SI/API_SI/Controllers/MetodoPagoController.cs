using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API_SI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MetodoPagoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MetodoPagoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MetodoPago>>> GetAll()
        {
            return await _context.MetodosPago.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MetodoPago>> GetById(int id)
        {
            var metodo = await _context.MetodosPago.FindAsync(id);
            if (metodo == null)
            {
                return NotFound(new { Message = "Método de pago no encontrado." });
            }
            return Ok(metodo);
        }

        [HttpPost]
        public async Task<ActionResult<MetodoPago>> Create([FromBody] MetodoPago metodo)
        {
            metodo.CreadoEn = DateTimeOffset.UtcNow;
            metodo.ActualizadoEn = DateTimeOffset.UtcNow;

            _context.MetodosPago.Add(metodo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = metodo.Id }, metodo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] MetodoPago input)
        {
            var metodo = await _context.MetodosPago.FindAsync(id);
            if (metodo == null)
            {
                return NotFound(new { Message = "Método de pago no encontrado." });
            }

            metodo.Clave = input.Clave;
            metodo.Nombre = input.Nombre;
            metodo.Icono = input.Icono;
            metodo.Activo = input.Activo;
            metodo.Banco = input.Banco;
            metodo.NombreCuenta = input.NombreCuenta;
            metodo.NumeroCuenta = input.NumeroCuenta;
            metodo.Titular = input.Titular;
            metodo.ImagenQR = input.ImagenQR;
            metodo.ActualizadoEn = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(metodo);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var metodo = await _context.MetodosPago.FindAsync(id);
            if (metodo == null)
            {
                return NotFound(new { Message = "Método de pago no encontrado." });
            }

            _context.MetodosPago.Remove(metodo);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Método de pago eliminado con éxito." });
        }
    }
}
