using System.Collections.Generic;

namespace Medrotic.Api.DTOs
{
    public class ChatbotResponseDto
    {
        public string Response { get; set; } = string.Empty;
        public List<string>? Suggestions { get; set; }
    }
}

