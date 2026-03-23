using System;

namespace Medrotic.Api.Models
{
    public class Notification
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string MedicalRecordId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Channel { get; set; } = string.Empty;  // Push, Email, SMS
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;

        public MedicalRecord MedicalRecord { get; set; } = null!;
    }
}