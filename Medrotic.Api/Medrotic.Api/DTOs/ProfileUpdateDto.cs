using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class ProfileUpdateDto
    {
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Full name must be 3-100 characters.")]
        public string? FullName { get; set; }

        [StringLength(50, ErrorMessage = "Specialty must be under 50 characters.")]
        public string? Specialty { get; set; }

        [Range(0, 50, ErrorMessage = "Experience years must be 0-50.")]
        public int? ExperienceYears { get; set; }

        [Phone(ErrorMessage = "Invalid phone format.")]
        public string? PhoneNumber { get; set; }

        [StringLength(50, ErrorMessage = "City must be under 50 characters.")]
        public string? City { get; set; }

        [StringLength(50, ErrorMessage = "Province must be under 50 characters.")]
        public string? Province { get; set; }

        [DataType(DataType.Date, ErrorMessage = "Invalid date format.")]
        public DateTime? DateOfBirth { get; set; }

        [RegularExpression("^(Male|Female|Other)$", ErrorMessage = "Gender must be Male, Female, or Other.")]
        public string? Gender { get; set; }
    }
}