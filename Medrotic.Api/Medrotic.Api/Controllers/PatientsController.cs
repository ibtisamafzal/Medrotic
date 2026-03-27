using Medrotic.Api.Data;
using Medrotic.Api.DTOs;
using Medrotic.Api.Middleware;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Medrotic.Api.Controllers
{
    [Route("api/patients")]
    [ApiController]
    [ApiKey] // Only accessible with the X-API-KEY header
    public class PatientsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public PatientsController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET /api/patients/{patientId}/history
        // This is specifically formatted for RAG context extraction.
        [HttpGet("{patientId}/history")]
        public async Task<IActionResult> GetPatientHistory([FromRoute] string patientId)
        {
            var id = patientId;

            var patient = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == "Patient");

            if (patient == null)
            {
                // Fallback: check if id is a CNIC (since it's common in our app).
                patient = await _context.Users
                    .FirstOrDefaultAsync(u => u.CNIC == id && u.Role == "Patient");
                
                if (patient == null)
                {
                    // Integration contract for AI/RAG:
                    // Always return HTTP 200 with an empty JSON object (never 404).
                    var emptyResponse = new
                    {
                        PatientDetails = new
                        {
                            Id = (string?)id,
                            FullName = (string?)null,
                            CNIC = (string?)null,
                            Age = (int?)null,
                            Gender = (string?)null,
                            City = (string?)null,
                            Province = (string?)null
                        },
                        HistoryCount = 0,
                        MedicalHistory = new object[] { },
                        SupportingDocuments = new object[] { },
                        ContextSummary = "Patient not found. No medical history available."
                    };

                    return Ok(emptyResponse);
                }
            }

            var records = await _context.MedicalRecords
                .Where(r => r.PatientId == patient.Id)
                .OrderByDescending(r => r.RecordDate)
                .Select(r => new
                {
                    r.Id,
                    Date = r.RecordDate.ToString("yyyy-MM-dd"),
                    r.Diagnosis,
                    r.Treatment,
                    r.Disease,
                    r.Description,
                    r.DoctorName,
                    r.HospitalName,
                    // Heuristic: identify report type by extension if needed.
                    ReportType = string.IsNullOrEmpty(r.ReportFilePath) ? "Text Only" : 
                                 r.ReportFilePath.EndsWith(".pdf") ? "PDF Prescription/Lab" : "Image/X-Ray"
                })
                .ToListAsync();

            var documents = await _context.Documents
                .Where(d => d.PatientId == patient.Id)
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new 
                {
                    d.Id,
                    Date = d.UploadedAt.ToString("yyyy-MM-dd"),
                    d.DocumentType, 
                    d.CurrentState,
                    d.FilePath
                })
                .ToListAsync();

            var enrichedHistory = records.Cast<object>().ToList();
            var derivedDocumentCount = 0;
            var derivedMetricCount = 0;
            if (enrichedHistory.Count == 0)
            {
                // Enrich sparse histories with existing patient artifacts so the AI service
                // receives clinically useful context even before formal record entry.
                var documentHistory = documents.Select(d => (object)new
                {
                    d.Id,
                    d.Date,
                    Diagnosis = string.Empty,
                    Treatment = string.Empty,
                    Disease = string.Empty,
                    Description = $"Document uploaded ({d.DocumentType}). Status: {d.CurrentState}.",
                    DoctorName = string.Empty,
                    HospitalName = string.Empty,
                    ReportType = d.DocumentType,
                    Type = "Document"
                });
                enrichedHistory.AddRange(documentHistory);
                derivedDocumentCount = documents.Count;

                var metrics = LoadPatientMetrics(patient.Id);
                var metricsHistory = metrics
                    .OrderByDescending(m => m.Date)
                    .Select(m => (object)new
                    {
                        Id = string.IsNullOrWhiteSpace(m.Id) ? $"metric-{m.Date:yyyyMMddHHmmss}" : m.Id!,
                        Date = m.Date.ToString("yyyy-MM-dd"),
                        Diagnosis = string.Empty,
                        Treatment = string.Empty,
                        Disease = string.Empty,
                        Description = BuildMetricSummary(m),
                        DoctorName = string.Empty,
                        HospitalName = string.Empty,
                        ReportType = "Health Metrics",
                        Type = "Metric"
                    });
                var metricsHistoryList = metricsHistory.ToList();
                enrichedHistory.AddRange(metricsHistoryList);
                derivedMetricCount = metricsHistoryList.Count;
            }

            // Format suitable for RAG ingestion: clean text-based history.
            var response = new
            {
                PatientDetails = new
                {
                    patient.Id,
                    patient.FullName,
                    patient.CNIC,
                    Age = (System.DateTime.UtcNow.Year - patient.DateOfBirth.Year),
                    patient.Gender,
                    patient.City,
                    patient.Province
                },
                HistoryCount = enrichedHistory.Count,
                MedicalHistory = enrichedHistory,
                SupportingDocuments = documents,
                ContextSummary = $"Patient {patient.FullName} has {enrichedHistory.Count} total history entries ({records.Count} medical records, {derivedDocumentCount} derived from documents, {derivedMetricCount} derived from metrics) and {documents.Count} supporting documents."
            };

            return Ok(response);
        }

        private List<HealthMetricDto> LoadPatientMetrics(string patientId)
        {
            try
            {
                var metricsPath = Path.Combine(_environment.ContentRootPath, "metrics_store.json");
                if (!System.IO.File.Exists(metricsPath))
                    return new List<HealthMetricDto>();

                var json = System.IO.File.ReadAllText(metricsPath);
                var store = JsonSerializer.Deserialize<Dictionary<string, List<HealthMetricDto>>>(json);
                if (store == null || !store.TryGetValue(patientId, out var metrics) || metrics == null)
                    return new List<HealthMetricDto>();

                return metrics;
            }
            catch
            {
                // Never fail the endpoint if metrics persistence is unavailable/corrupt.
                return new List<HealthMetricDto>();
            }
        }

        private static string BuildMetricSummary(HealthMetricDto metric)
        {
            var parts = new List<string>();

            if (!string.IsNullOrWhiteSpace(metric.BloodPressure))
                parts.Add($"BP {metric.BloodPressure}");
            if (metric.HeartRate.HasValue)
                parts.Add($"HR {metric.HeartRate.Value}");
            if (metric.Temperature.HasValue)
                parts.Add($"Temp {metric.Temperature.Value:0.##} C");
            if (metric.BloodSugar.HasValue)
                parts.Add($"Blood Sugar {metric.BloodSugar.Value:0.##}");
            if (metric.Weight.HasValue)
                parts.Add($"Weight {metric.Weight.Value:0.##} kg");
            if (metric.Height.HasValue)
                parts.Add($"Height {metric.Height.Value:0.##} cm");
            if (!string.IsNullOrWhiteSpace(metric.Symptoms))
                parts.Add($"Symptoms: {metric.Symptoms}");
            if (!string.IsNullOrWhiteSpace(metric.Notes))
                parts.Add($"Notes: {metric.Notes}");

            return parts.Count == 0 ? "Health metrics entry recorded." : string.Join("; ", parts);
        }
    }
}
