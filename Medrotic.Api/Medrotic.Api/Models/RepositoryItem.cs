using System;

namespace Medrotic.Api.Models
{
    public class RepositoryItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "document";
        public long Size { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string UploadedBy { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
    }
}
