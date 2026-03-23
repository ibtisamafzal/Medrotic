using System;

namespace Medrotic.Api.Models
{
    public class AIResult
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string DocumentId { get; set; } = string.Empty;
        public string ExtractedText { get; set; } = string.Empty;
        public decimal ConfidenceScore { get; set; }
        public string Findings { get; set; } = string.Empty;
        public bool IsApproved { get; set; } = false;
        public string? ApprovedByDoctorId { get; set; }
        public DateTime? ApprovedAt { get; set; }

        public Document Document { get; set; } = null!;
    }
}