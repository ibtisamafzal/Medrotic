namespace Medrotic.Api.DTOs
{
    public class AnalyticsDto
    {
        public int TotalPatients { get; set; }
        public int TotalDoctors { get; set; }
        public int TotalAdmins { get; set; }  // Added
        public int TotalHospitals { get; set; }
        public int TotalMedicalRecords { get; set; }
        public int TotalDocuments { get; set; }
        public int TotalAIResults { get; set; }  // Added
        public int TotalNotifications { get; set; }  // Added
        public int ActiveUsersLastMonth { get; set; }  // Added for analytics module
    }
}