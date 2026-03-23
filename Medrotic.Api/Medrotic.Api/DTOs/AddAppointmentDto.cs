using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class AddAppointmentDto
    {
        [Required(ErrorMessage = "Patient ID is required.")]
        public string PatientId { get; set; } = string.Empty;

        [Required(ErrorMessage = "Appointment date is required.")]
        [DataType(DataType.DateTime, ErrorMessage = "Invalid datetime format.")]
        public DateTime AppointmentDate { get; set; }

        [StringLength(500, ErrorMessage = "Notes under 500 chars.")]
        public string Notes { get; set; } = string.Empty;
    }
}