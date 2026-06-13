using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class RepositoryItemUpdateDto
    {
        [StringLength(200, ErrorMessage = "Name must be 200 characters or fewer.")]
        public string? Name { get; set; }

        [StringLength(50, ErrorMessage = "Type must be 50 characters or fewer.")]
        public string? Type { get; set; }
    }
}
