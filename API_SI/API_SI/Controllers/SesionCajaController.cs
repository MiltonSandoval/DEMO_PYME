using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.DTOs.SesionCaja;
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
    public class SesionCajaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SesionCajaController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetHistorial()
        {
            var sesiones = await _context.SesionesCaja
                .Include(s => s.Trabajador)
                .OrderByDescending(s => s.FechaApertura)
                .Select(s => new
                {
                    s.Id,
                    s.FechaApertura,
                    s.FechaCierre,
                    s.MontoApertura,
                    s.MontoCierre,
                    s.MontoEsperado,
                    s.Diferencia,
                    s.Estado,
                    s.Notas,
                    Trabajador = s.Trabajador.Nombre
                })
                .ToListAsync();

            return Ok(sesiones);
        }

        [HttpGet("actual")]
        public async Task<IActionResult> GetActual()
        {
            var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int idTrabajador))
            {
                return Unauthorized(new { Message = "Trabajador no autorizado." });
            }

            var sesion = await _context.SesionesCaja
                .FirstOrDefaultAsync(s => s.IdTrabajador == idTrabajador && s.Estado == "abierta");

            if (sesion == null)
            {
                return Ok(new { Abierta = false });
            }

            // Calcular ingresos en efectivo actuales acumulados
            var totalEfectivoVentas = await _context.Ventas
                .Where(v => v.IdTrabajador == idTrabajador && v.Estado.ToLower() == "completada" && v.Fecha >= sesion.FechaApertura && v.MetodoPago.Clave.ToLower() == "efectivo")
                .SumAsync(v => (decimal?)v.Total) ?? 0;

            var totalReembolsosEfectivo = await _context.Devoluciones
                .Where(d => d.IdTrabajador == idTrabajador && d.Estado.ToLower() == "procesada" && d.Fecha >= sesion.FechaApertura && d.MetodoReembolso.ToLower() == "efectivo")
                .SumAsync(d => (decimal?)d.Total) ?? 0;

            decimal esperadoActual = sesion.MontoApertura + totalEfectivoVentas - totalReembolsosEfectivo;

            return Ok(new
            {
                Abierta = true,
                sesion.Id,
                sesion.FechaApertura,
                sesion.MontoApertura,
                TotalVentasEfectivo = totalEfectivoVentas,
                TotalReembolsosEfectivo = totalReembolsosEfectivo,
                MontoEsperadoActual = esperadoActual
            });
        }

        [HttpPost("abrir")]
        public async Task<IActionResult> Abrir([FromBody] AbrirCajaRequest request)
        {
            var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int idTrabajador))
            {
                return Unauthorized(new { Message = "Trabajador no autorizado." });
            }

            // Verificar si ya tiene una sesión abierta
            bool yaAbierta = await _context.SesionesCaja
                .AnyAsync(s => s.IdTrabajador == idTrabajador && s.Estado == "abierta");

            if (yaAbierta)
            {
                return BadRequest(new { Message = "Ya tiene una sesión de caja abierta." });
            }

            var sesion = new SesionCaja
            {
                IdTrabajador = idTrabajador,
                FechaApertura = DateTimeOffset.UtcNow,
                MontoApertura = request.MontoApertura,
                Estado = "abierta",
                CreadoEn = DateTimeOffset.UtcNow
            };

            _context.SesionesCaja.Add(sesion);
            await _context.SaveChangesAsync();

            return Ok(sesion);
        }

        [HttpPut("{id}/cerrar")]
        public async Task<IActionResult> Cerrar(int id, [FromBody] CerrarCajaRequest request)
        {
            var sesion = await _context.SesionesCaja.FindAsync(id);
            if (sesion == null)
            {
                return NotFound(new { Message = "Sesión de caja no encontrada." });
            }

            if (sesion.Estado == "cerrada")
            {
                return BadRequest(new { Message = "La sesión de caja ya se encuentra cerrada." });
            }

            // Calcular ingresos en efectivo acumulados durante la sesión
            var totalEfectivoVentas = await _context.Ventas
                .Where(v => v.IdTrabajador == sesion.IdTrabajador && v.Estado.ToLower() == "completada" && v.Fecha >= sesion.FechaApertura && v.MetodoPago.Clave.ToLower() == "efectivo")
                .SumAsync(v => (decimal?)v.Total) ?? 0;

            var totalReembolsosEfectivo = await _context.Devoluciones
                .Where(d => d.IdTrabajador == sesion.IdTrabajador && d.Estado.ToLower() == "procesada" && d.Fecha >= sesion.FechaApertura && d.MetodoReembolso.ToLower() == "efectivo")
                .SumAsync(d => (decimal?)d.Total) ?? 0;

            decimal esperado = sesion.MontoApertura + totalEfectivoVentas - totalReembolsosEfectivo;
            decimal diferencia = request.MontoCierre - esperado;

            sesion.FechaCierre = DateTimeOffset.UtcNow;
            sesion.MontoCierre = request.MontoCierre;
            sesion.MontoEsperado = esperado;
            sesion.Diferencia = diferencia;
            sesion.ConteoEfectivo = request.ConteoEfectivo; // JSON de billetes
            sesion.Estado = "cerrada";
            sesion.Notas = request.Notas;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Caja cerrada con éxito.",
                MontoEsperado = esperado,
                Diferencia = diferencia,
                Detalle = sesion
            });
        }
    }
}
// Note: JSON serialization/deserialization of ConteoEfectivo will be managed by client side.
