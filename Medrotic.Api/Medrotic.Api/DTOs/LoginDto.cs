using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class LoginDto
    {
        // Supports email / CNIC / phone as login identifier.
        [Required(ErrorMessage = "Login identifier is required.")]
        public string Identifier { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        public string Password { get; set; } = string.Empty;
    }
}