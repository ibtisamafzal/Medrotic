namespace Medrotic.Api.DTOs
{
    public class ChatbotMessageDto
    {
        public string Query { get; set; } = string.Empty;

        // Arbitrary client context (timestamp, form data, etc.)
        public object? Context { get; set; }
    }
}

