using System;
using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class UpdateUserDto
    {
        public string Id { get; set; } = string.Empty;

        [StringLength(100, MinimumLength = 3, ErrorMessage = "Full name must be between 3 and 100 characters.")]
        public string FullName { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        [RegularExpression(@"^\d{13}$", ErrorMessage = "CNIC must be exactly 13 digits.")]
        public string CNIC { get; set; } = string.Empty;

        public string? Specialty { get; set; }

        [Range(0, 50, ErrorMessage = "Experience must be between 0 and 50 years.")]
        public int? ExperienceYears { get; set; }

        public string City { get; set; } = string.Empty;

        public string Province { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid phone number format.")]
        public string PhoneNumber { get; set; } = string.Empty;

        [DataType(DataType.Date)]
        public DateTime DateOfBirth { get; set; }

        [RegularExpression("^(Male|Female|Other)$", ErrorMessage = "Gender must be 'Male', 'Female', or 'Other'.")]
        public string Gender { get; set; } = string.Empty;

        public string? HospitalId { get; set; }
    }
}