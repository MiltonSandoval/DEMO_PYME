using System.ComponentModel.DataAnnotations;

namespace API_SI.DTOs.Auth
{
    public class LoginRequest
    {
        [Required(ErrorMessage = "El correo electrónico es requerido.")]
        [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "La contraseña es requerida.")]
        public string Password { get; set; } = null!;
    }
}
