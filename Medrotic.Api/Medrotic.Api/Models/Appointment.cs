using System;

namespace Medrotic.Api.Models
{
    public class Appointment
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string PatientId { get; set; } = string.Empty;
        public string DoctorId { get; set; } = string.Empty;
        public DateTime AppointmentDate { get; set; }
        public string Status { get; set; } = "Scheduled";  // Scheduled, Completed, Cancelled
        public string Notes { get; set; } = string.Empty;

        public ApplicationUser Patient { get; set; } = null!;
        public ApplicationUser Doctor { get; set; } = null!;
    }
}