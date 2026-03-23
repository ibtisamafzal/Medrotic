namespace Medrotic.Api.DTOs
{
    public class PersonalAnalyticsDto
    {
        public int TotalRecords { get; set; }
        public int TotalDocuments { get; set; }
        public int TotalNotifications { get; set; }
        public int UnreadNotifications { get; set; }
    }
}