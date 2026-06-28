using System.Collections.Generic;

namespace API_SI.Models
{
    public class Modulo
    {
        public int Id { get; set; }
        public string Clave { get; set; } = null!;
        public string Nombre { get; set; } = null!;
        public short Orden { get; set; }

        // Navigation
        public ICollection<RolPermiso> RolPermisos { get; set; } = new List<RolPermiso>();
    }
}
