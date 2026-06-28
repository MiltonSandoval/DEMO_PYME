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
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RolesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Rol>>> GetAll()
        {
            return await _context.Roles.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Rol>> GetById(int id)
        {
            var rol = await _context.Roles.FindAsync(id);
            if (rol == null)
            {
                return NotFound(new { Message = "Rol no encontrado." });
            }
            return Ok(rol);
        }

        [HttpPost]
        public async Task<ActionResult<Rol>> Create([FromBody] Rol rol)
        {
            rol.CreadoEn = DateTimeOffset.UtcNow;
            rol.ActualizadoEn = DateTimeOffset.UtcNow;
            rol.EsSistema = false; // Los creados por usuario no son del sistema por defecto

            _context.Roles.Add(rol);
            await _context.SaveChangesAsync();

            // Seed empty permissions for all modules for this new role
            var modulos = await _context.Modulos.ToListAsync();
            foreach (var modulo in modulos)
            {
                _context.RolPermisos.Add(new RolPermiso
                {
                    IdRol = rol.Id,
                    IdModulo = modulo.Id,
                    Leer = false,
                    Crear = false,
                    Editar = false,
                    Eliminar = false
                });
            }
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = rol.Id }, rol);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Rol input)
        {
            var rol = await _context.Roles.FindAsync(id);
            if (rol == null)
            {
                return NotFound(new { Message = "Rol no encontrado." });
            }

            rol.Nombre = input.Nombre;
            rol.Descripcion = input.Descripcion;
            rol.Color = input.Color;
            rol.ActualizadoEn = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(rol);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var rol = await _context.Roles.FindAsync(id);
            if (rol == null)
            {
                return NotFound(new { Message = "Rol no encontrado." });
            }

            if (rol.EsSistema)
            {
                return BadRequest(new { Message = "No se puede eliminar un rol del sistema." });
            }

            _context.Roles.Remove(rol);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Rol eliminado con éxito." });
        }

        [HttpGet("{id}/permisos")]
        public async Task<ActionResult<IEnumerable<object>>> GetPermisos(int id)
        {
            var rol = await _context.Roles.FindAsync(id);
            if (rol == null)
            {
                return NotFound(new { Message = "Rol no encontrado." });
            }

            var permisos = await _context.RolPermisos
                .Where(rp => rp.IdRol == id)
                .Select(rp => new
                {
                    rp.Id,
                    rp.IdRol,
                    rp.IdModulo,
                    rp.Leer,
                    rp.Crear,
                    rp.Editar,
                    rp.Eliminar
                })
                .ToListAsync();

            return Ok(permisos);
        }

        [HttpPut("{id}/permisos")]
        public async Task<IActionResult> UpdatePermisos(int id, [FromBody] List<RolPermiso> permisosInput)
        {
            var rol = await _context.Roles.FindAsync(id);
            if (rol == null)
            {
                return NotFound(new { Message = "Rol no encontrado." });
            }

            var permisosExistentes = await _context.RolPermisos
                .Where(rp => rp.IdRol == id)
                .ToListAsync();

            foreach (var input in permisosInput)
            {
                var existente = permisosExistentes.FirstOrDefault(p => p.IdModulo == input.IdModulo);
                if (existente != null)
                {
                    existente.Leer = input.Leer;
                    existente.Crear = input.Crear;
                    existente.Editar = input.Editar;
                    existente.Eliminar = input.Eliminar;
                }
                else
                {
                    _context.RolPermisos.Add(new RolPermiso
                    {
                        IdRol = id,
                        IdModulo = input.IdModulo,
                        Leer = input.Leer,
                        Crear = input.Crear,
                        Editar = input.Editar,
                        Eliminar = input.Eliminar
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Permisos actualizados con éxito." });
        }
    }
}
