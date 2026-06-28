using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using API_SI.Data;
using API_SI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace API_SI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ModulosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ModulosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Modulo>>> GetAll()
        {
            return await _context.Modulos.OrderBy(m => m.Orden).ToListAsync();
        }
    }
}
