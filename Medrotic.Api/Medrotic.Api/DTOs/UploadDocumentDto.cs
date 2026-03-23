using System.ComponentModel.DataAnnotations;

namespace Medrotic.Api.DTOs
{
    public class UploadDocumentDto
    {
        [Required(ErrorMessage = "Document type is required.")]
        [StringLength(50, ErrorMessage = "Document type must be under 50 characters.")]
        public string DocumentType { get; set; } = string.Empty; 

        [Required(ErrorMessage = "File is required.")]
        public IFormFile File { get; set; } = null!;
    }
}