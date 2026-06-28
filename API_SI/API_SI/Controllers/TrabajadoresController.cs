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
    public class TrabajadoresController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TrabajadoresController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Trabajador>>> GetAll()
        {
            return await _context.Trabajadores
                .Include(t => t.Rol)
                .Select(t => new Trabajador
                {
                    Id = t.Id,
                    Nombre = t.Nombre,
                    IdRol = t.IdRol,
                    Email = t.Email,
                    Telefono = t.Telefono,
                    Direccion = t.Direccion,
                    Estado = t.Estado,
                    FechaIngreso = t.FechaIngreso,
                    Salario = t.Salario,
                    Avatar = t.Avatar,
                    ColorAvatar = t.ColorAvatar,
                    CreadoEn = t.CreadoEn,
                    ActualizadoEn = t.ActualizadoEn,
                    Rol = t.Rol
                })
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Trabajador>> GetById(int id)
        {
            var t = await _context.Trabajadores
                .Include(tr => tr.Rol)
                .FirstOrDefaultAsync(tr => tr.Id == id);

            if (t == null)
            {
                return NotFound(new { Message = "Trabajador no encontrado." });
            }

            // Ocultar contraseña
            t.Password = "";
            return Ok(t);
        }

        [HttpPost]
        public async Task<ActionResult<Trabajador>> Create([FromBody] Trabajador t)
        {
            if (string.IsNullOrEmpty(t.Password))
            {
                return BadRequest(new { Message = "La contraseña es obligatoria." });
            }

            // Verificar si el email ya existe
            if (!string.IsNullOrEmpty(t.Email))
            {
                bool emailExists = await _context.Trabajadores.AnyAsync(tr => tr.Email == t.Email);
                if (emailExists)
                {
                    return BadRequest(new { Message = "El correo electrónico ya se encuentra registrado." });
                }
            }

            t.Password = BCrypt.Net.BCrypt.HashPassword(t.Password);
            t.CreadoEn = DateTimeOffset.UtcNow;
            t.ActualizadoEn = DateTimeOffset.UtcNow;

            _context.Trabajadores.Add(t);
            await _context.SaveChangesAsync();

            t.Password = ""; // Ocultar
            return CreatedAtAction(nameof(GetById), new { id = t.Id }, t);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Trabajador input)
        {
            var t = await _context.Trabajadores.FindAsync(id);
            if (t == null)
            {
                return NotFound(new { Message = "Trabajador no encontrado." });
            }

            // Verificar email único si ha cambiado
            if (!string.IsNullOrEmpty(input.Email) && input.Email != t.Email)
            {
                bool emailExists = await _context.Trabajadores.AnyAsync(tr => tr.Email == input.Email && tr.Id != id);
                if (emailExists)
                {
                    return BadRequest(new { Message = "El correo electrónico ya se encuentra registrado por otro usuario." });
                }
                t.Email = input.Email;
            }

            t.Nombre = input.Nombre;
            t.IdRol = input.IdRol;
            t.Telefono = input.Telefono;
            t.Direccion = input.Direccion;
            t.Estado = input.Estado;
            t.FechaIngreso = input.FechaIngreso;
            t.Salario = input.Salario;
            t.Avatar = input.Avatar;
            t.ColorAvatar = input.ColorAvatar;
            t.ActualizadoEn = DateTimeOffset.UtcNow;

            // Actualizar contraseña solo si se provee una nueva
            if (!string.IsNullOrEmpty(input.Password))
            {
                t.Password = BCrypt.Net.BCrypt.HashPassword(input.Password);
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Trabajador actualizado con éxito." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var t = await _context.Trabajadores.FindAsync(id);
            if (t == null)
            {
                return NotFound(new { Message = "Trabajador no encontrado." });
            }

            // El administrador inicial id=1 no se puede borrar
            if (id == 1)
            {
                return BadRequest(new { Message = "No se puede eliminar el usuario administrador inicial del sistema." });
            }

            _context.Trabajadores.Remove(t);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Trabajador eliminado con éxito." });
        }
    }
}
