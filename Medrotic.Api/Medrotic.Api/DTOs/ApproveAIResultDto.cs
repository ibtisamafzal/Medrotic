using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class ApproveAIResultDto
    {
        [Required(ErrorMessage = "Approved by doctor ID is required.")]
        public string ApprovedByDoctorId { get; set; } = string.Empty;
    }
}