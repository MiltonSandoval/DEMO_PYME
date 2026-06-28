namespace API_SI.DTOs.SesionCaja
{
    public class CerrarCajaRequest
    {
        public decimal MontoCierre { get; set; }
        public string? ConteoEfectivo { get; set; } // JSON list/object of bills/coins count
        public string? Notas { get; set; }
    }
}
