namespace API_SI.DTOs.Configuracion
{
    public class ConfiguracionUpdateDto
    {
        public string Nombre { get; set; } = null!;
        public string? RazonSocial { get; set; }
        public string? Ruc { get; set; }
        public string? Direccion { get; set; }
        public string? Ciudad { get; set; }
        public string? Pais { get; set; }
        public string? Telefono { get; set; }
        public string? Celular { get; set; }
        public string? Email { get; set; }
        public string? SitioWeb { get; set; }
        public string? RegimenTributario { get; set; }
        public string? LogoImagen { get; set; }
        public decimal Iva { get; set; }
        public string PrefijoFactura { get; set; } = null!;
        public int SecuencialFactura { get; set; }
        public int SecuencialCotizacion { get; set; }
        public string MonedaBase { get; set; } = null!;
        public string SimboloMoneda { get; set; } = null!;
        public string MonedaVisualizacion { get; set; } = null!;
        public decimal TipoCambio { get; set; }
        public string? MensajeRecibo { get; set; }
        public string? PieFactura { get; set; }
        public string PlantillaRecibo { get; set; } = null!;
        public string PlantillaCotizacion { get; set; } = null!;
        public string CodigoPaisWhatsapp { get; set; } = null!;
        public string? MensajeWhatsapp { get; set; }
        public string? ClaveFirmaDigital { get; set; }
    }
}
