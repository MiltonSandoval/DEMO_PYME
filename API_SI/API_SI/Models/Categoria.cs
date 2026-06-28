using System;
using System.Collections.Generic;

namespace API_SI.Models
{
    public class Categoria
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string Icono { get; set; } = null!;
        public string Color { get; set; } = null!;
        public string? ColorFondo { get; set; }
        public DateTimeOffset CreadoEn { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset ActualizadoEn { get; set; } = DateTimeOffset.UtcNow;

        // Navigation
        public ICollection<Producto> Productos { get; set; } = new List<Producto>();
        public ICollection<ProveedorCategoria> ProveedorCategorias { get; set; } = new List<ProveedorCategoria>();
    }
}
