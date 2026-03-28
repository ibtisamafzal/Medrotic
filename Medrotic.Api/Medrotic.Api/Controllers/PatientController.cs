using Medrotic.Api.Data;
using Medrotic.Api.DTOs;
using Medrotic.Api.Models;
using Medrotic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Concurrent;
using System.IO;
using System.Text;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using System.Text.Json;
using System.Threading.Tasks;

namespace Medrotic.Api.Controllers
{
    [Route("api/patient")]
    [ApiController]
    [Authorize(Roles = "Patient")]
    public class PatientController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IWebHostEnvironment _environment;

        // In-memory store to keep the UI working without requiring a DB migration.
        // Keyed by patient user id (NameIdentifier claim).
        private static readonly ConcurrentDictionary<string, List<HealthMetricDto>> MetricsStore = new();

        private static readonly object MetricsLock = new();

        private static readonly object MetricsFileLock = new();
        private static bool MetricsLoadedFromFile = false;
        private static string? MetricsFilePath = null;

        private void EnsureMetricsLoaded()
        {
            if (MetricsLoadedFromFile) return;

            lock (MetricsFileLock)
            {
                if (MetricsLoadedFromFile) return;

                // Persist metrics on disk so hard restart doesn't wipe them.
                MetricsFilePath ??= Path.Combine(_environment.ContentRootPath, "metrics_store.json");

                if (System.IO.File.Exists(MetricsFilePath))
                {
                    try
                    {
                        var json = System.IO.File.ReadAllText(MetricsFilePath);
                        var data = JsonSerializer.Deserialize<Dictionary<string, List<HealthMetricDto>>>(json);

                        if (data != null)
                        {
                            foreach (var kvp in data)
                                MetricsStore[kvp.Key] = kvp.Value ?? new List<HealthMetricDto>();
                        }
                    }
                    catch
                    {
                        // If persistence file is corrupted, fall back to empty store.
                    }
                }

                MetricsLoadedFromFile = true;
            }
        }

        private void PersistMetricsToFile()
        {
            MetricsFilePath ??= Path.Combine(_environment.ContentRootPath, "metrics_store.json");

            lock (MetricsFileLock)
            {
                var snapshot = MetricsStore.ToDictionary(k => k.Key, v => v.Value);
                var json = JsonSerializer.Serialize(snapshot);
                System.IO.File.WriteAllText(MetricsFilePath, json);
            }
        }

        private readonly IAIService _aiService;

        public PatientController(AppDbContext context, UserManager<ApplicationUser> userManager, IWebHostEnvironment environment, IAIService aiService)
        {
            _context = context;
            _userManager = userManager;
            _environment = environment;
            _aiService = aiService;
        }

        private string GetCurrentPatientId()
        {
            var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return string.IsNullOrEmpty(patientId) ? string.Empty : patientId;
        }

        private static string NormalizeCnic(string cnic)
        {
            if (string.IsNullOrWhiteSpace(cnic)) return string.Empty;
            // Supports both digit-only and formatted values (e.g., "35202-1234567-1").
            return Regex.Replace(cnic, @"\D", "");
        }

        private static bool IsPdf(string? filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath)) return false;
            return Path.GetExtension(filePath).Equals(".pdf", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsImage(string? filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath)) return false;
            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            return ext is ".jpg" or ".jpeg" or ".png" or ".webp";
        }

        private static string EscapePdfString(string? text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            // Keep PDF content stream ASCII-only.
            var normalized = Regex.Replace(text, @"[^\x20-\x7E]", "?");
            return normalized
                .Replace("\\", "\\\\")
                .Replace("(", "\\(")
                .Replace(")", "\\)");
        }

        // Minimal PDF generator for plain text export.
        // This is intentionally lightweight to avoid adding new dependencies.
        private static byte[] CreateSimplePdf(string text)
        {
            var safeText = Regex.Replace(text ?? string.Empty, @"[^\x20-\x7E]", "?");
            var lines = safeText.Replace("\r\n", "\n").Split('\n');

            var content = new StringBuilder();
            content.AppendLine("BT");
            content.AppendLine("/F1 12 Tf");
            content.AppendLine("50 750 Td");

            var lineCount = 0;
            foreach (var line in lines)
            {
                if (lineCount >= 40) break;
                if (lineCount > 0)
                    content.AppendLine("0 -14 Td");
                content.AppendLine($"({EscapePdfString(line)}) Tj");
                lineCount++;
            }

            content.AppendLine("ET");
            var contentBytes = Encoding.ASCII.GetBytes(content.ToString());
            var contentLength = contentBytes.Length;

            var header = Encoding.ASCII.GetBytes("%PDF-1.3\n");

            var obj1 = Encoding.ASCII.GetBytes("1 0 obj<< /Type /Catalog /Pages 2 0 R>>\nendobj\n");
            var obj2 = Encoding.ASCII.GetBytes("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n");
            var obj3 = Encoding.ASCII.GetBytes("3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R>>>>>>\nendobj\n");
            var obj4 = Encoding.ASCII.GetBytes($"4 0 obj<< /Length {contentLength} >>\nstream\n" + content.ToString() + "\nendstream\nendobj\n");
            var obj5 = Encoding.ASCII.GetBytes("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica>>\nendobj\n");

            var objects = new[] { obj1, obj2, obj3, obj4, obj5 };
            var offsets = new int[6]; // object 0 unused

            var currentOffset = header.Length;
            for (var i = 0; i < objects.Length; i++)
            {
                offsets[i + 1] = currentOffset;
                currentOffset += objects[i].Length;
            }

            var xrefOffset = currentOffset;
            var xref = new StringBuilder();
            xref.AppendLine("xref");
            xref.AppendLine("0 6");
            xref.AppendLine("0000000000 65535 f ");
            for (var i = 1; i < 6; i++)
            {
                xref.AppendLine($"{offsets[i].ToString("D10")} 00000 n ");
            }

            var trailer =
                "trailer\n" +
                "<< /Size 6 /Root 1 0 R>>\n" +
                "startxref\n" +
                xrefOffset.ToString() +
                "\n%%EOF\n";

            using var ms = new MemoryStream();
            ms.Write(header, 0, header.Length);
            foreach (var obj in objects)
                ms.Write(obj, 0, obj.Length);
            var xrefBytes = Encoding.ASCII.GetBytes(xref.ToString() + trailer);
            ms.Write(xrefBytes, 0, xrefBytes.Length);
            return ms.ToArray();
        }

        // 1. Get Current Patient Profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            var patient = await _userManager.FindByIdAsync(patientId);
            if (patient == null) return NotFound(new { Message = "Patient not found." });

            return Ok(new
            {
                Message = "Profile retrieved successfully.",
                Data = new
                {
                    patient.FullName,
                    patient.Email,
                    patient.CNIC,
                    patient.PhoneNumber,
                    patient.City,
                    patient.Province,
                    patient.DateOfBirth,
                    patient.Gender
                }
            });
        }

        // 2. Update Profile (Patient can edit own data)
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            var patient = await _userManager.FindByIdAsync(patientId);
            if (patient == null) return NotFound(new { Message = "Patient not found." });

            if (dto.FullName != null) patient.FullName = dto.FullName;
            if (dto.PhoneNumber != null) patient.PhoneNumber = dto.PhoneNumber;
            if (dto.City != null) patient.City = dto.City;
            if (dto.Province != null) patient.Province = dto.Province;
            if (dto.DateOfBirth.HasValue) patient.DateOfBirth = dto.DateOfBirth.Value;
            if (dto.Gender != null) patient.Gender = dto.Gender;

            var result = await _userManager.UpdateAsync(patient);
            if (!result.Succeeded)
                return BadRequest(new { Message = "Profile update failed.", Errors = result.Errors.Select(e => e.Description) });

            return Ok(new { Message = "Profile updated successfully." });
        }

        // 3. Upload Medical History (Your Main Request)
        [HttpPost("upload-history")]
        public async Task<IActionResult> UploadMedicalHistory([FromForm] UploadMedicalDataDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            var record = new MedicalRecord
            {
                PatientId = patientId,
                RecordDate = dto.RecordDate,
                DoctorName = dto.DoctorName,
                HospitalName = dto.HospitalName,
                Disease = dto.Disease,
                Description = dto.Description,
                CreatedByRole = "Patient"
            };

            // Handle report/image upload
            if (dto.ReportFile != null)
            {
                if (dto.ReportFile.Length > 5 * 1024 * 1024) return BadRequest(new { Message = "File size must be less than 5MB." });
                var ext = Path.GetExtension(dto.ReportFile.FileName).ToLower();
                if (!new[] { ".jpg", ".jpeg", ".png", ".pdf" }.Contains(ext))
                    return BadRequest(new { Message = "Only JPG, PNG, PDF files allowed." });

                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "patient-history");
                Directory.CreateDirectory(uploadsFolder);
                var fileName = Guid.NewGuid() + ext;
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.ReportFile.CopyToAsync(stream);
                }

                record.ReportFilePath = $"/uploads/patient-history/{fileName}";
            }

            _context.MedicalRecords.Add(record);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Medical history uploaded successfully and stored against your CNIC for lifetime access.", RecordId = record.Id });
        }

        // 4. View My Medical Records
        [HttpGet("records")]
        public async Task<IActionResult> GetMyRecords(int page = 1, int pageSize = 10)
        {
            var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            var query = _context.MedicalRecords.Where(r => r.PatientId == patientId);
            var total = await query.CountAsync();
            var records = await query.OrderByDescending(r => r.RecordDate)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.RecordDate,
                    r.DoctorName,
                    r.HospitalName,
                    r.Disease,
                    r.Description,
                    r.ReportFilePath
                }).ToListAsync();

            return Ok(new { Message = "Medical records retrieved successfully.", Data = records, Total = total });
        }

        // 5. Upload Document for AI Processing
        [HttpPost("upload-document")]
        public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            if (dto.File == null) return BadRequest(new { Message = "File is required." });

            // Same file validation as history
            if (dto.File.Length > 5 * 1024 * 1024) return BadRequest(new { Message = "File size must be less than 5MB." });
            var ext = Path.GetExtension(dto.File.FileName).ToLower();
            if (!new[] { ".jpg", ".jpeg", ".png", ".pdf" }.Contains(ext))
                return BadRequest(new { Message = "Only JPG, PNG, PDF files allowed." });

            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "documents");
            Directory.CreateDirectory(uploadsFolder);
            var fileName = Guid.NewGuid() + ext;
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.File.CopyToAsync(stream);
            }

            var document = new Document
            {
                PatientId = patientId,
                FilePath = $"/uploads/documents/{fileName}",
                DocumentType = dto.DocumentType,
                UploadedByRole = "Patient",
                UploadedById = patientId,
                CurrentState = "Uploaded - Awaiting AI Analysis"
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            // Fire and forget AI analysis (real implementation would use a background worker)
            _ = Task.Run(async () => {
                try {
                    await _aiService.AnalyzeDocumentAsync(document.FilePath, document.DocumentType, patientId);
                } catch { /* Silent log */ }
            });

            return Ok(new { Message = "Document uploaded successfully. AI analysis has been initiated.", DocumentId = document.Id });
        }

        // 6. View My Documents
        [HttpGet("documents")]
        public async Task<IActionResult> GetMyDocuments(int page = 1, int pageSize = 10)
        {
            var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            var query = _context.Documents.Where(d => d.PatientId == patientId);
            var total = await query.CountAsync();
            var docsRaw = await query.OrderByDescending(d => d.UploadedAt)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(d => new
                {
                    d.Id,
                    d.PatientId,
                    d.DocumentType,
                    d.FilePath,
                    d.UploadedAt,
                    d.CurrentState,
                    d.UploadedById,
                    d.UploadedByRole
                })
                .ToListAsync();

            // Map into a shape that both patient and doctor UI components can render.
            var docs = docsRaw.Select(d => new
            {
                d.Id,
                patientId = d.PatientId,
                // FilePath may be null in the DB for some legacy rows; avoid crashing with Path.GetFileName(null).
                name = string.IsNullOrWhiteSpace(d.FilePath) ? string.Empty : Path.GetFileName(d.FilePath),
                type = d.DocumentType,
                d.DocumentType,
                d.FilePath,
                fileName = string.IsNullOrWhiteSpace(d.FilePath) ? string.Empty : Path.GetFileName(d.FilePath),
                fileUrl = d.FilePath ?? string.Empty,
                size = (long?)null,
                uploadedAt = d.UploadedAt,
                createdAt = d.UploadedAt,
                // No verification workflow data is persisted yet; default to pending.
                verificationStatus = "pending",
                verifiedBy = (string?)null,
                verifiedAt = (string?)null,
                d.CurrentState
            }).ToList();

            return Ok(new { Message = "Documents retrieved successfully.", Data = docs, Total = total });
        }

        // 7. View My Notifications
        [HttpGet("notifications")]
        public async Task<IActionResult> GetMyNotifications(int page = 1, int pageSize = 10)
        {
            var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            var query = _context.Notifications.Where(n => n.MedicalRecord.PatientId == patientId);
            var total = await query.CountAsync();
            var notifications = await query.OrderByDescending(n => n.SentAt)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(n => new { n.Id, n.Message, n.Channel, n.SentAt, n.IsRead })
                .ToListAsync();

            return Ok(new { Message = "Notifications retrieved successfully.", Data = notifications, Total = total });
        }

        // 8. Mark Notification as Read
        [HttpPut("notifications/{id}/read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.MedicalRecord.PatientId == patientId);

            if (notification == null) return NotFound(new { Message = "Notification not found or not yours." });

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Notification marked as read." });
        }

        // 9. Personal Analytics
        [HttpGet("analytics")]
        public async Task<IActionResult> GetPersonalAnalytics()
        {
            var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            var analytics = new PersonalAnalyticsDto
            {
                TotalRecords = await _context.MedicalRecords.CountAsync(r => r.PatientId == patientId),
                TotalDocuments = await _context.Documents.CountAsync(d => d.PatientId == patientId),
                TotalNotifications = await _context.Notifications.CountAsync(n => n.MedicalRecord.PatientId == patientId),
                UnreadNotifications = await _context.Notifications.CountAsync(n => n.MedicalRecord.PatientId == patientId && !n.IsRead)
            };

            return Ok(new { Message = "Personal analytics retrieved successfully.", Data = analytics });
        }

        [HttpGet("appointments")]
        public async Task<IActionResult> GetMyAppointments(int page = 1, int pageSize = 20)
        {
            var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            try
            {
                var query = _context.Appointments.Where(a => a.PatientId == patientId);
                var total = await query.CountAsync();
                var rows = await query
                    .Include(a => a.Doctor)
                    .OrderByDescending(a => a.AppointmentDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var data = rows.Select(a => new
                {
                    a.Id,
                    a.PatientId,
                    a.DoctorId,
                    doctorName = a.Doctor != null ? a.Doctor.FullName : string.Empty,
                    appointmentDate = a.AppointmentDate,
                    a.Status,
                    a.Notes
                }).ToList();

                if (data.Count == 0)
                    return Ok(new { Message = "No appointments found.", Data = data, Total = total });

                return Ok(new { Message = "Appointments retrieved successfully.", Data = data, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving appointments.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // Patient Portal - Health Metrics
        // ────────────────────────────────────────────────

        [HttpGet("metrics")]
        public async Task<IActionResult> GetMetrics()
        {
            EnsureMetricsLoaded();
            var patientId = GetCurrentPatientId();
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            List<HealthMetricDto> metrics;
            if (!MetricsStore.TryGetValue(patientId, out metrics!))
                metrics = new List<HealthMetricDto>();

            // Latest first for UI.
            var data = metrics
                .OrderByDescending(m => m.Date)
                .ToList();

            return Ok(new { Message = "Metrics retrieved successfully.", Data = data, Total = data.Count });
        }

        [HttpPost("metrics")]
        public async Task<IActionResult> AddMetrics([FromBody] HealthMetricDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            EnsureMetricsLoaded();
            var patientId = GetCurrentPatientId();
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            if (dto == null) return BadRequest(new { Message = "Metrics payload is required." });

            var stored = new HealthMetricDto
            {
                Id = Guid.NewGuid().ToString(),
                // Frontend sends only a date (YYYY-MM-DD). When multiple metrics are added
                // on the same day, sorting by Date would otherwise keep the first entry.
                // Preserve the selected date but stamp server time for deterministic "latest".
                Date = dto.Date == default ? DateTime.UtcNow : dto.Date.Date + DateTime.UtcNow.TimeOfDay,
                BloodPressure = dto.BloodPressure,
                HeartRate = dto.HeartRate,
                Temperature = dto.Temperature,
                Weight = dto.Weight,
                Height = dto.Height,
                BloodSugar = dto.BloodSugar,
                Symptoms = dto.Symptoms,
                Notes = dto.Notes
            };

            lock (MetricsLock)
            {
                if (!MetricsStore.TryGetValue(patientId, out var list))
                {
                    list = new List<HealthMetricDto>();
                    MetricsStore[patientId] = list;
                }

                list.Add(stored);

                // Keep store bounded to prevent runaway memory usage.
                if (list.Count > 100)
                {
                    list.Sort((a, b) => b.Date.CompareTo(a.Date));
                    list.RemoveRange(100, list.Count - 100);
                }
            }

            PersistMetricsToFile();
            return Ok(stored);
        }

        // ────────────────────────────────────────────────
        // Patient Portal - AI Chatbot
        // ────────────────────────────────────────────────

        [HttpPost("chatbot")]
        public async Task<IActionResult> Chatbot([FromBody] ChatbotMessageDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Query))
                return BadRequest(new { Message = "Query is required." });

            var query = dto.Query.Trim();
            var lower = query.ToLowerInvariant();

            string response;
            var suggestions = new System.Collections.Generic.List<string>();

            if (lower.Contains("blood pressure") || lower.Contains("bp") || lower.Contains("hypertension"))
            {
                response = "For blood pressure concerns, consider monitoring regularly, reducing salt intake, staying active, and following your clinician's plan. If you have chest pain, severe headache, or shortness of breath, seek urgent care.";
                suggestions.AddRange(new[]
                {
                    "How do I measure blood pressure correctly?",
                    "What foods help lower blood pressure?",
                    "When should I contact my doctor?"
                });
            }
            else if (lower.Contains("diabetes") || lower.Contains("sugar"))
            {
                response = "For diabetes or blood sugar concerns, focus on consistent meal timing, tracking your readings, staying active, and following medication advice. If your readings are dangerously high or you feel unwell, contact your healthcare provider.";
                suggestions.AddRange(new[]
                {
                    "What is a safe blood sugar range?",
                    "How can I manage cravings?",
                    "Tips for meal planning"
                });
            }
            else if (lower.Contains("fever") || lower.Contains("temperature"))
            {
                response = "For fever, rest, hydrate, and monitor your temperature. Use appropriate fever guidance and watch for red flags like persistent high fever, severe symptoms, or dehydration.";
                suggestions.AddRange(new[]
                {
                    "When is a fever considered dangerous?",
                    "How much water should I drink?",
                    "What are safe home-care steps?"
                });
            }
            else
            {
                response = $"Thanks for your question. Based on what you shared (" + query + "), consider reviewing your recent metrics and symptoms, and discuss results with a clinician for personalized guidance.";
                suggestions.AddRange(new[]
                {
                    "Explain possible causes",
                    "What should I monitor next?",
                    "When to seek medical help?"
                });
            }

            var result = new ChatbotResponseDto
            {
                Response = response,
                Suggestions = suggestions
            };

            return Ok(result);
        }

        // ────────────────────────────────────────────────
        // Patient Portal - Doctor Search
        // ────────────────────────────────────────────────

        [HttpGet("doctors")]
        public async Task<IActionResult> SearchDoctors(
            [FromQuery] string? city,
            [FromQuery] string? specialty,
            [FromQuery] string? disease,
            [FromQuery] int? experience)
        {
            var patientId = GetCurrentPatientId();
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            var query = _context.Users.Where(u => u.Role == "Doctor").Include(u => u.Hospital).AsQueryable();

            if (!string.IsNullOrWhiteSpace(city))
                query = query.Where(d => d.City != null && d.City.Contains(city));

            if (!string.IsNullOrWhiteSpace(specialty))
                query = query.Where(d => d.Specialty != null && d.Specialty.Contains(specialty));

            if (experience.HasValue)
                query = query.Where(d => d.ExperienceYears.HasValue && d.ExperienceYears.Value >= experience.Value);

            if (!string.IsNullOrWhiteSpace(disease))
            {
                // DB schema can be behind the EF model (e.g., missing `DoctorId` column).
                // If that happens, skip the disease->doctor mapping instead of crashing.
                try
                {
                    var doctorIds = await _context.MedicalRecords
                        .Where(r => !string.IsNullOrEmpty(r.Disease) && r.Disease.Contains(disease))
                        .Select(r => r.DoctorId!)
                        .Where(id => !string.IsNullOrEmpty(id))
                        .Distinct()
                        .ToListAsync();

                    if (doctorIds.Count == 0)
                        return Ok(new { Message = "No doctors found.", Data = new object[0], Total = 0 });

                    query = query.Where(d => doctorIds.Contains(d.Id));
                }
                catch (Exception ex) when (ex.Message.Contains("DoctorId", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine($"[WARN] /api/patient/doctors disease filter skipped due to DB mismatch: {ex.Message}");
                }
            }

            var doctors = await query
                .Select(d => new
                {
                    d.Id,
                    name = d.FullName,
                    specialty = d.Specialty,
                    experience = d.ExperienceYears ?? 0,
                    city = d.City,
                    hospital = d.Hospital != null ? d.Hospital.Name : "Not Assigned",
                    phone = d.PhoneNumber,
                    email = d.Email,
                    qualifications = (string[]?)null,
                    rating = (double?)null
                })
                .ToListAsync();

            return Ok(new { Message = "Doctors retrieved successfully.", Data = doctors, Total = doctors.Count });
        }

        // ────────────────────────────────────────────────
        // Patient Portal - Prescriptions & X-Rays
        // (Derived from MedicalRecords file uploads)
        // ────────────────────────────────────────────────

        [HttpGet("prescriptions")]
        public async Task<IActionResult> GetPrescriptions(int page = 1, int pageSize = 10)
        {
            var patientId = GetCurrentPatientId();
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            // NOTE:
            // Your DB schema may not yet contain the FK column `DoctorId`.
            // Avoid loading full `MedicalRecord` entities (which would select `DoctorId`)
            // and avoid `Include(r => r.Doctor)` for the patient portal endpoints.
            // Instead project only the columns you need.
            var query = _context.MedicalRecords
                .Where(r => r.PatientId == patientId)
                // Heuristic: prescriptions are typically uploaded as PDF.
                .Where(r => r.ReportFilePath != null && r.ReportFilePath.ToLower().EndsWith(".pdf"))
                .OrderByDescending(r => r.RecordDate);

            var total = await query.CountAsync();

            var pageItems = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.PatientId,
                    r.DoctorName,
                    r.RecordDate,
                    r.Diagnosis,
                    r.Treatment
                })
                .ToListAsync();

            var data = pageItems.Select(r => new
            {
                id = r.Id,
                patientId = r.PatientId,
                doctorId = string.Empty, // DoctorId column may not exist in DB yet.
                doctorName = r.DoctorName,
                date = r.RecordDate.ToString("o"),
                medications = new[]
                {
                    new
                    {
                        name = r.Diagnosis,
                        dosage = string.Empty,
                        frequency = string.Empty,
                        duration = string.Empty
                    }
                },
                instructions = r.Treatment,
                createdAt = r.RecordDate.ToString("o")
            }).ToList();

            return Ok(new { Message = "Prescriptions retrieved successfully.", Data = data, Total = total });
        }

        [HttpGet("xrays")]
        public async Task<IActionResult> GetXrays(int page = 1, int pageSize = 10)
        {
            var patientId = GetCurrentPatientId();
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            // Same DB-schema safety as prescriptions endpoint: avoid selecting full entity
            // (which can include missing `DoctorId`) and avoid navigation include.
            var query = _context.MedicalRecords
                .Where(r => r.PatientId == patientId)
                // Heuristic: X-rays are typically images (jpg/png/webp).
                .Where(r => r.ReportFilePath != null && (
                    r.ReportFilePath.ToLower().EndsWith(".jpg") ||
                    r.ReportFilePath.ToLower().EndsWith(".jpeg") ||
                    r.ReportFilePath.ToLower().EndsWith(".png") ||
                    r.ReportFilePath.ToLower().EndsWith(".webp")
                ))
                .OrderByDescending(r => r.RecordDate);

            var total = await query.CountAsync();

            var pageItems = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.PatientId,
                    r.DoctorName,
                    r.ReportFilePath,
                    r.RecordDate,
                    r.Description
                })
                .ToListAsync();

            var data = pageItems.Select(r => new
            {
                id = r.Id,
                patientId = r.PatientId,
                doctorId = string.Empty, // DoctorId column may not exist in DB yet.
                doctorName = r.DoctorName,
                fileName = !string.IsNullOrWhiteSpace(r.ReportFilePath) ? Path.GetFileName(r.ReportFilePath) : string.Empty,
                fileUrl = r.ReportFilePath ?? string.Empty,
                analysis = r.Description,
                uploadedAt = r.RecordDate.ToString("o"),
                createdAt = r.RecordDate.ToString("o")
            }).ToList();

            return Ok(new { Message = "X-rays retrieved successfully.", Data = data, Total = total });
        }

        [HttpGet("records/export")]
        public async Task<IActionResult> ExportRecords([FromQuery] string format = "pdf")
        {
            var patientId = GetCurrentPatientId();
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            var records = await _context.MedicalRecords
                .Where(r => r.PatientId == patientId)
                .OrderByDescending(r => r.RecordDate)
                .Include(r => r.Doctor)
                .ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("Id,RecordDate,DoctorName,Diagnosis,Treatment,Disease,Description,ReportFilePath");
            foreach (var r in records)
            {
                csv.AppendLine(string.Join(",",
                    new[]
                    {
                        r.Id,
                        r.RecordDate.ToString("o"),
                        (r.Doctor?.FullName ?? r.DoctorName ?? string.Empty).Replace(",", " "),
                        r.Diagnosis.Replace(",", " "),
                        r.Treatment.Replace(",", " "),
                        r.Disease.Replace(",", " "),
                        r.Description.Replace(",", " "),
                        (r.ReportFilePath ?? string.Empty).Replace(",", " ")
                    }));
            }

            if (string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
            {
                var bytes = Encoding.UTF8.GetBytes(csv.ToString());
                return File(bytes, "text/csv", $"records_{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
            }

            // Default to pdf (best-effort: lightweight text export).
            var pdfBytes = CreateSimplePdf(csv.ToString());
            return File(pdfBytes, "application/pdf", $"records_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf");
        }

        [HttpPost("verify-cnic")]
        public async Task<IActionResult> VerifyCnic([FromBody] VerifyCnicDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var patientId = GetCurrentPatientId();
            if (string.IsNullOrEmpty(patientId)) return Unauthorized(new { Message = "Invalid token." });

            var patient = await _userManager.FindByIdAsync(patientId);
            if (patient == null || patient.Role != "Patient") return NotFound(new { Message = "Patient not found." });

            var input = NormalizeCnic(dto?.Cnic ?? string.Empty);
            var stored = NormalizeCnic(patient.CNIC);

            var verified = !string.IsNullOrEmpty(input) && !string.IsNullOrEmpty(stored) && input == stored;
            return Ok(new
            {
                verified,
                message = verified ? "CNIC verification successful." : "CNIC verification failed."
            });
        }
    }
}