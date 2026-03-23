using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class UploadMedicalDataDto
    {
        [Required(ErrorMessage = "Doctor name is required.")]
        [StringLength(100, ErrorMessage = "Doctor name must be under 100 characters.")]
        public string DoctorName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Hospital name is required.")]
        [StringLength(100, ErrorMessage = "Hospital name must be under 100 characters.")]
        public string HospitalName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Disease is required.")]
        [StringLength(200, ErrorMessage = "Disease must be under 200 characters.")]
        public string Disease { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required.")]
        [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description must be 10-1000 characters.")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Record date is required.")]
        public DateTime RecordDate { get; set; } = DateTime.UtcNow;

        public IFormFile? ReportFile { get; set; }  
    }
}