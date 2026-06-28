using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.DTOs.Configuracion;
using API_SI.Models;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace API_SI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ConfiguracionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ConfiguracionController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<Configuracion>> Get()
        {
            var config = await _context.Configuraciones.FirstOrDefaultAsync(c => c.Id == 1);
            if (config == null)
            {
                return NotFound(new { Message = "No se encontró la configuración del sistema." });
            }
            return Ok(config);
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] ConfiguracionUpdateDto dto)
        {
            var config = await _context.Configuraciones.FirstOrDefaultAsync(c => c.Id == 1);
            if (config == null)
            {
                return NotFound(new { Message = "No se encontró la configuración del sistema." });
            }

            decimal tipoCambioAnterior = config.TipoCambio;
            bool tipoCambioCambio = tipoCambioAnterior != dto.TipoCambio;

            config.Nombre = dto.Nombre;
            config.RazonSocial = dto.RazonSocial;
            config.Ruc = dto.Ruc;
            config.Direccion = dto.Direccion;
            config.Ciudad = dto.Ciudad;
            config.Pais = dto.Pais;
            config.Telefono = dto.Telefono;
            config.Celular = dto.Celular;
            config.Email = dto.Email;
            config.SitioWeb = dto.SitioWeb;
            config.RegimenTributario = dto.RegimenTributario;
            config.LogoImagen = dto.LogoImagen;
            config.Iva = dto.Iva;
            config.PrefijoFactura = dto.PrefijoFactura;
            config.SecuencialFactura = dto.SecuencialFactura;
            config.SecuencialCotizacion = dto.SecuencialCotizacion;
            config.MonedaBase = dto.MonedaBase;
            config.SimboloMoneda = dto.SimboloMoneda;
            config.MonedaVisualizacion = dto.MonedaVisualizacion;
            config.TipoCambio = dto.TipoCambio;
            config.MensajeRecibo = dto.MensajeRecibo;
            config.PieFactura = dto.PieFactura;
            config.PlantillaRecibo = dto.PlantillaRecibo;
            config.PlantillaCotizacion = dto.PlantillaCotizacion;
            config.CodigoPaisWhatsapp = dto.CodigoPaisWhatsapp;
            config.MensajeWhatsapp = dto.MensajeWhatsapp;
            config.ClaveFirmaDigital = dto.ClaveFirmaDigital;
            config.ActualizadoEn = DateTimeOffset.UtcNow;

            if (tipoCambioCambio)
            {
                int? idTrabajador = null;
                var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(claimId, out int parsedId))
                {
                    idTrabajador = parsedId;
                }

                var historial = new HistorialTipoCambio
                {
                    TipoCambioAnterior = tipoCambioAnterior,
                    TipoCambioNuevo = dto.TipoCambio,
                    Fecha = DateTimeOffset.UtcNow,
                    IdTrabajador = idTrabajador,
                    CreadoEn = DateTimeOffset.UtcNow
                };

                _context.HistorialTiposCambio.Add(historial);
            }

            await _context.SaveChangesAsync();
            return Ok(config);
        }

        [HttpGet("historial-tipo-cambio")]
        public async Task<IActionResult> GetHistorial()
        {
            var historial = await _context.HistorialTiposCambio
                .Include(h => h.Trabajador)
                .OrderByDescending(h => h.Fecha)
                .ToListAsync();

            return Ok(historial);
        }
    }
}
