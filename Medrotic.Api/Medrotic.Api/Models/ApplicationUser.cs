using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace Medrotic.API.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public string CNIC { get; set; } = string.Empty; // Standardized
        public string Role { get; set; } = string.Empty;
        public string? Specialty { get; set; }
        public int? ExperienceYears { get; set; }
        public string City { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; } = string.Empty;

        // Navigation for OTPs
        public ICollection<Otp> Otps { get; set; } = new List<Otp>();
    }
}