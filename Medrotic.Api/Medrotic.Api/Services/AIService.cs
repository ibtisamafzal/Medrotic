using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace Medrotic.Api.Services
{
    public interface IAIService
    {
        Task<object?> AnalyzeDocumentAsync(string relativeFilePath, string documentType, string patientId);
    }

    public class AIService : IAIService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public AIService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["AIService:ApiKey"] ?? string.Empty;
            
            var baseUrl = configuration["AIService:Url"] ?? "http://localhost:8000";
            _httpClient.BaseAddress = new System.Uri(baseUrl);
            
            // Shared secret header for FastAPI security
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", _apiKey);
        }

        public async Task<object?> AnalyzeDocumentAsync(string relativeFilePath, string documentType, string patientId)
        {
            // Heuristic for AI processing based on document type
            var endpoint = documentType.ToLower().Contains("prescription") ? "/ocr/prescription" : "/ocr/document";
            
            var payload = new 
            {
                file_path = relativeFilePath,
                patient_id = patientId,
                type = documentType
            };

            try
            {
                var response = await _httpClient.PostAsJsonAsync(endpoint, payload);
                if (response.IsSuccessStatusCode)
                {
                    return await response.Content.ReadFromJsonAsync<object>();
                }
                return new { Error = $"AI Service returned {response.StatusCode}" };
            }
            catch (System.Exception ex)
            {
                return new { Error = $"Connection to AI Service failed: {ex.Message}" };
            }
        }
    }
}
