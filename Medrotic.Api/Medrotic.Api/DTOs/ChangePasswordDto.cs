using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class ChangePasswordDto
    {
        [Required(ErrorMessage = "Current password is required.")]
        public string OldPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password is required.")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "New password must be at least 8 characters.")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
