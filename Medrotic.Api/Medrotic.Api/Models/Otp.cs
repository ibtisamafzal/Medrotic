using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.Models
{
    public class Otp
    {
        [Key]
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public DateTime Expiry { get; set; }
        public bool IsUsed { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ApplicationUser User { get; set; } = null!;
    }
}