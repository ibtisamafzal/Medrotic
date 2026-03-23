using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class VerifyCnicDto
    {
        [Required(ErrorMessage = "CNIC is required.")]
        public string Cnic { get; set; } = string.Empty;
    }
}

