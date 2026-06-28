using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using API_SI.Data;
using API_SI.DTOs.Auth;
using API_SI.Models;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace API_SI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            var trabajador = await _context.Trabajadores
                .Include(t => t.Rol)
                .ThenInclude(r => r.RolPermisos)
                .ThenInclude(rp => rp.Modulo)
                .FirstOrDefaultAsync(t => t.Email == request.Email);

            if (trabajador == null)
            {
                return Unauthorized(new { Message = "Correo electrónico o contraseña incorrectos." });
            }

            if (trabajador.Estado != "activo")
            {
                return BadRequest(new { Message = "El usuario se encuentra inactivo." });
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, trabajador.Password);
            if (!isPasswordValid)
            {
                return Unauthorized(new { Message = "Correo electrónico o contraseña incorrectos." });
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Secret"] ?? "ElectroShopPOSSuperSecretKey2026!ForAuthentication");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, trabajador.Id.ToString()),
                new Claim(ClaimTypes.Name, trabajador.Nombre),
                new Claim(ClaimTypes.Email, trabajador.Email ?? ""),
                new Claim(ClaimTypes.Role, trabajador.Rol.Nombre),
                new Claim("IdRol", trabajador.IdRol.ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "1440")),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            var permisos = new List<ModuloPermisoDto>();
            foreach (var rp in trabajador.Rol.RolPermisos)
            {
                permisos.Add(new ModuloPermisoDto
                {
                    ModuloClave = rp.Modulo.Clave,
                    Leer = rp.Leer,
                    Crear = rp.Crear,
                    Editar = rp.Editar,
                    Eliminar = rp.Eliminar
                });
            }

            return Ok(new LoginResponse
            {
                Token = tokenString,
                Nombre = trabajador.Nombre,
                Email = trabajador.Email ?? "",
                Rol = trabajador.Rol.Nombre,
                Permisos = permisos
            });
        }
    }
}
