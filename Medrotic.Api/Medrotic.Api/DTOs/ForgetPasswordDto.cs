using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class ForgetPasswordDto
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;
    }
}