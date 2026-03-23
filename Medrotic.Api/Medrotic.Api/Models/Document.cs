using System;

namespace Medrotic.Api.Models
{
    public class Document
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string PatientId { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;  // e.g., Azure Blob URL
        public string DocumentType { get; set; } = string.Empty;  // XRay, LabReport, Prescription
        public string UploadedByRole { get; set; } = string.Empty;
        public string UploadedById { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string CurrentState { get; set; } = "Uploaded";

        public ApplicationUser Patient { get; set; } = null!;
    }
}