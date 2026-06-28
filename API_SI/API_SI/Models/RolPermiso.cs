namespace API_SI.Models
{
    public class RolPermiso
    {
        public int Id { get; set; }
        public int IdRol { get; set; }
        public int IdModulo { get; set; }
        public bool Leer { get; set; }
        public bool Crear { get; set; }
        public bool Editar { get; set; }
        public bool Eliminar { get; set; }

        // Navigation
        public Rol? Rol { get; set; }
        public Modulo? Modulo { get; set; }
    }
}
