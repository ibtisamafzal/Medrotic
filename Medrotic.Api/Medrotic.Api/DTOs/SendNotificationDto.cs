using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class SendNotificationDto
    {
        [Required(ErrorMessage = "Medical record ID is required.")]
        public string MedicalRecordId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Message is required.")]
        [StringLength(500, ErrorMessage = "Message under 500 chars.")]
        public string Message { get; set; } = string.Empty;

        [Required(ErrorMessage = "Channel is required.")]
        [RegularExpression("^(Push|Email|SMS)$", ErrorMessage = "Channel must be Push, Email, or SMS.")]
        public string Channel { get; set; } = string.Empty;
    }
}