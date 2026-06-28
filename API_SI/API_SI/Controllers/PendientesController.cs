using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.DTOs.Pendientes;
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
    public class PendientesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PendientesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("configuracion")]
        public async Task<ActionResult<PendienteConfiguracion>> GetConfiguracion()
        {
            var config = await _context.PendientesConfiguracion.FirstOrDefaultAsync(p => p.Id == 1);
            if (config == null)
            {
                return NotFound(new { Message = "Configuración financiera no encontrada." });
            }
            return Ok(config);
        }

        [HttpPut("configuracion")]
        public async Task<IActionResult> UpdateConfiguracion([FromBody] PendienteConfiguracion input)
        {
            var config = await _context.PendientesConfiguracion.FirstOrDefaultAsync(p => p.Id == 1);
            if (config == null)
            {
                return NotFound(new { Message = "Configuración financiera no encontrada." });
            }

            config.Ahorros = input.Ahorros;
            config.Gastos = input.Gastos;
            config.Facturas = input.Facturas;
            config.Alquiler = input.Alquiler;
            config.ActualizadoEn = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(config);
        }

        [HttpGet("periodos")]
        public async Task<ActionResult<IEnumerable<PendientePeriodo>>> GetPeriodos()
        {
            return await _context.PendientesPeriodo
                .OrderByDescending(p => p.Periodo)
                .ToListAsync();
        }

        [HttpPost("periodos/cerrar")]
        public async Task<IActionResult> CerrarPeriodo([FromBody] CerrarPeriodoRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Periodo))
            {
                return BadRequest(new { Message = "El período es requerido." });
            }

            // Validar formato y ya registrado
            bool yaExiste = await _context.PendientesPeriodo.AnyAsync(p => p.Periodo == request.Periodo);
            if (yaExiste)
            {
                return BadRequest(new { Message = $"El período {request.Periodo} ya se encuentra cerrado." });
            }

            try
            {
                var parts = request.Periodo.Split('-');
                int year = int.Parse(parts[0]);
                int month = int.Parse(parts[1]);

                var startOfMonth = new DateTimeOffset(year, month, 1, 0, 0, 0, TimeSpan.Zero);
                var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

                // Calcular Ingreso Bruto (Ventas completadas)
                decimal ventasTotal = await _context.Ventas
                    .Where(v => v.Estado == "completada" && v.Fecha >= startOfMonth && v.Fecha <= endOfMonth)
                    .SumAsync(v => (decimal?)v.Total) ?? 0;

                // Restar Devoluciones procesadas en el periodo
                decimal devolucionesTotal = await _context.Devoluciones
                    .Where(d => d.Estado == "procesada" && d.Fecha >= startOfMonth && d.Fecha <= endOfMonth)
                    .SumAsync(d => (decimal?)d.Total) ?? 0;

                decimal ingresoBrutoAjustado = ventasTotal - devolucionesTotal;

                // Obtener Gastos Fijos de la configuración
                var config = await _context.PendientesConfiguracion.FirstOrDefaultAsync(p => p.Id == 1);
                decimal alquiler = config?.Alquiler ?? 0;
                decimal facturas = config?.Facturas ?? 0;
                decimal gastos = config?.Gastos ?? 0;
                decimal ahorros = config?.Ahorros ?? 0;

                decimal totalFijo = alquiler + facturas + gastos + ahorros;
                decimal sobrante = ingresoBrutoAjustado - totalFijo;

                var periodo = new PendientePeriodo
                {
                    Periodo = request.Periodo,
                    Etiqueta = request.Etiqueta,
                    IngresoBruto = ingresoBrutoAjustado,
                    Alquiler = alquiler,
                    Facturas = facturas,
                    Gastos = gastos,
                    Ahorros = ahorros,
                    TotalFijo = totalFijo,
                    Sobrante = sobrante,
                    Notas = request.Notas,
                    CerradoEn = DateTimeOffset.UtcNow,
                    CreadoEn = DateTimeOffset.UtcNow
                };

                _context.PendientesPeriodo.Add(periodo);
                await _context.SaveChangesAsync();

                return Ok(periodo);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error al procesar el período: {ex.Message}" });
            }
        }
    }
}
// Note: Period format "yyyy-MM" ensures uniqueness for reports.
