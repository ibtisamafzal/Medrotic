using System;

namespace Medrotic.Api.Models
{
    public class MedicalRecord
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string PatientId { get; set; } = string.Empty;
        public string? DoctorId { get; set; }  
        public DateTime RecordDate { get; set; } = DateTime.UtcNow;
        public string Diagnosis { get; set; } = string.Empty;
        public string Treatment { get; set; } = string.Empty;
        public string CreatedByRole { get; set; } = string.Empty;

        public string DoctorName { get; set; } = string.Empty;
        public string HospitalName { get; set; } = string.Empty;
        public string Disease { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ReportFilePath { get; set; }

        public ApplicationUser Patient { get; set; } = null!;
        public ApplicationUser? Doctor { get; set; } 
    }
}