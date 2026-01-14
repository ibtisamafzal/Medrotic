using System;
using System.ComponentModel.DataAnnotations;

namespace Medrotic.API.DTOs
{
    public class RegisterUserDto
    {
        [Required(ErrorMessage = "Full name is required.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Confirm password is required.")]
        [Compare("Password", ErrorMessage = "Passwords do not match.")]
        public string ConfirmPassword { get; set; } = string.Empty;  // New

        [Required(ErrorMessage = "Role is required.")]
        [RegularExpression("^(Admin|Doctor)$", ErrorMessage = "Role must be 'Admin' or 'Doctor'.")]
        public string Role { get; set; } = string.Empty;

        public string? Specialty { get; set; }  // Required for Doctor

        public int? ExperienceYears { get; set; }  // Required for Doctor

        public string? City { get; set; }  // Optional

        public string? Province { get; set; }  // Optional

        [Phone(ErrorMessage = "Invalid phone number format.")]
        public string? PhoneNumber { get; set; }  // New: Optional

        public DateTime? DateOfBirth { get; set; }  // New: Optional

        [RegularExpression("^(Male|Female|Other)$", ErrorMessage = "Gender must be 'Male', 'Female', or 'Other'.")]
        public string? Gender { get; set; }  // New: Optional
    }
}