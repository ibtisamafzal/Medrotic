using System;
using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class RegisterUserDto
    {
        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Full name must be between 3 and 100 characters.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{6,}$", ErrorMessage = "Password must contain uppercase, lowercase, digit, and special character.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "CNIC is required.")]
        [RegularExpression(@"^\d{13}$", ErrorMessage = "CNIC must be exactly 13 digits.")]
        public string CNIC { get; set; } = string.Empty;

        [Required(ErrorMessage = "Role is required.")]
        [RegularExpression("^(Admin|Doctor)$", ErrorMessage = "Role must be 'Admin' or 'Doctor'.")]
        public string Role { get; set; } = string.Empty;

        [RequiredIf("Role", "Doctor", ErrorMessage = "Specialty is required for doctors.")]
        public string? Specialty { get; set; }

        [RequiredIf("Role", "Doctor", ErrorMessage = "Experience years is required for doctors.")]
        [Range(0, 50, ErrorMessage = "Experience must be between 0 and 50 years.")]
        public int? ExperienceYears { get; set; }

        [Required(ErrorMessage = "City is required.")]
        public string City { get; set; } = string.Empty;

        [Required(ErrorMessage = "Province is required.")]
        public string Province { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required.")]
        [Phone(ErrorMessage = "Invalid phone number format.")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Date of birth is required.")]
        [DataType(DataType.Date)]
        public DateTime? DateOfBirth { get; set; }

        [Required(ErrorMessage = "Gender is required.")]
        [RegularExpression("^(Male|Female|Other)$", ErrorMessage = "Gender must be 'Male', 'Female', or 'Other'.")]
        public string? Gender { get; set; }

        public string? HospitalId { get; set; }  // Optional

        // Custom validation attribute
        public class RequiredIfAttribute : ValidationAttribute
        {
            private readonly string _property;
            private readonly string _value;

            public RequiredIfAttribute(string property, string value)
            {
                _property = property;
                _value = value;
            }

            protected override ValidationResult IsValid(object value, ValidationContext context)
            {
                var instance = context.ObjectInstance;
                var propertyValue = instance.GetType().GetProperty(_property)?.GetValue(instance)?.ToString();

                if (propertyValue == _value && value == null)
                    return new ValidationResult(ErrorMessage);

                return ValidationResult.Success;
            }
        }
    }
}