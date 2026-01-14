using System.ComponentModel.DataAnnotations;

namespace Medrotic.API.Models
{
    public class Otp
    {
        [Key]
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty; // Foreign key to ApplicationUser.Id
        public string Code { get; set; } = string.Empty; // OTP code
        public DateTime Expiry { get; set; } // Expiration time
        public bool IsUsed { get; set; } = false; // To prevent reuse
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Timestamp

        // Navigation property
        public ApplicationUser User { get; set; } = null!;
    }
}