using System;

namespace Medrotic.Api.DTOs
{
    public class HealthMetricDto
    {
        // Client-side treats this as optional; backend can generate on insert.
        public string? Id { get; set; }

        public DateTime Date { get; set; } = DateTime.UtcNow;

        public string? BloodPressure { get; set; }
        public int? HeartRate { get; set; }
        public double? Temperature { get; set; }
        public double? Weight { get; set; }
        public double? Height { get; set; }
        public double? BloodSugar { get; set; }
        public string? Symptoms { get; set; }
        public string? Notes { get; set; }
    }
}

