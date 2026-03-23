using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.Models
{
    public class Hospital
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        [Required]
        public string City { get; set; } = string.Empty;

        [Required]
        public string Province { get; set; } = string.Empty;

        [Required]
        public string ContactNumber { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        public ICollection<ApplicationUser> Staff { get; set; } = new List<ApplicationUser>();
    }
}