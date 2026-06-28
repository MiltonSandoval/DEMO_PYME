namespace API_SI.DTOs.Pendientes
{
    public class CerrarPeriodoRequest
    {
        public string Periodo { get; set; } = null!; // "yyyy-MM" format
        public string Etiqueta { get; set; } = null!;
        public string? Notas { get; set; }
    }
}
