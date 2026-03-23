using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class AddPatientRecordDto
    {
        [Required(ErrorMessage = "Diagnosis is required.")]
        [StringLength(500, ErrorMessage = "Diagnosis under 500 chars.")]
        public string Diagnosis { get; set; } = string.Empty;

        [Required(ErrorMessage = "Treatment is required.")]
        [StringLength(500, ErrorMessage = "Treatment under 500 chars.")]
        public string Treatment { get; set; } = string.Empty;

        [Required(ErrorMessage = "Disease is required.")]
        [StringLength(200, ErrorMessage = "Disease under 200 chars.")]
        public string Disease { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required.")]
        [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description 10-1000 chars.")]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Record date is required.")]
        [DataType(DataType.Date, ErrorMessage = "Invalid date format.")]
        public DateTime RecordDate { get; set; } = DateTime.UtcNow;

        public IFormFile? ReportFile { get; set; }  // Validated in code
    }
}