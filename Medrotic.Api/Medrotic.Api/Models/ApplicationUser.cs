using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        public string CNIC { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = string.Empty;  // "Admin", "Doctor", "Patient"

        public string? Specialty { get; set; }
        public int? ExperienceYears { get; set; }

        [Required]
        public string City { get; set; } = string.Empty;

        [Required]
        public string Province { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        public string Gender { get; set; } = string.Empty;

        public string? HospitalId { get; set; }
        public Hospital? Hospital { get; set; }

        public DateTime LastActivity { get; set; } = DateTime.UtcNow;  // Added for analytics

        public ICollection<Otp> Otps { get; set; } = new List<Otp>();
    }
}