using System.Collections.Generic;

namespace API_SI.DTOs.Auth
{
    public class LoginResponse
    {
        public string Token { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Rol { get; set; } = null!;
        public List<ModuloPermisoDto> Permisos { get; set; } = new List<ModuloPermisoDto>();
    }

    public class ModuloPermisoDto
    {
        public string ModuloClave { get; set; } = null!;
        public bool Leer { get; set; }
        public bool Crear { get; set; }
        public bool Editar { get; set; }
        public bool Eliminar { get; set; }
    }
}
