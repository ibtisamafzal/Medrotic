using Medrotic.Api.Data;
using Medrotic.Api.DTOs;
using Medrotic.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Medrotic.Api.Controllers
{
    [Route("api/doctor")]
    [ApiController]
    [Authorize(Roles = "Doctor")]
    public class DoctorController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IWebHostEnvironment _environment;

        public DoctorController(AppDbContext context, UserManager<ApplicationUser> userManager, IWebHostEnvironment environment)
        {
            _context = context;
            _userManager = userManager;
            _environment = environment;
        }

        private string GetCurrentDoctorId()
        {
            var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return string.IsNullOrEmpty(doctorId) ? string.Empty : doctorId;
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

        private long? TryGetFileSize(string? filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath)) return null;
            try
            {
                var relative = filePath.TrimStart('/', '\\').Replace('/', Path.DirectorySeparatorChar);
                var fullPath = Path.Combine(_environment.WebRootPath, relative);
                if (!System.IO.File.Exists(fullPath)) return null;
                return new System.IO.FileInfo(fullPath).Length;
            }
            catch
            {
                return null;
            }
        }

        private static string NormalizeDocumentType(string? documentType)
        {
            var t = (documentType ?? string.Empty).ToLowerInvariant();
            if (t.Contains("xray")) return "xray";
            if (t.Contains("lab")) return "lab-report";
            if (t.Contains("prescription")) return "prescription";
            if (t.Contains("medical")) return "medical-record";
            return "other";
        }

        private static string NormalizeVerificationStatus(string? currentState)
        {
            var s = (currentState ?? string.Empty).ToLowerInvariant();
            if (s.Contains("rejected")) return "rejected";
            if (s.Contains("verified")) return "verified";
            return "pending";
        }

        private static string NormalizeCnic(string? cnic)
        {
            if (string.IsNullOrWhiteSpace(cnic)) return string.Empty;
            return Regex.Replace(cnic, @"\D", "");
        }

        private async Task<ApplicationUser?> ResolvePatientByIdentifierAsync(string patientIdentifier)
        {
            if (string.IsNullOrWhiteSpace(patientIdentifier)) return null;

            var normalizedCnic = NormalizeCnic(patientIdentifier);
            if (!string.IsNullOrWhiteSpace(normalizedCnic) && normalizedCnic.Length == 13)
            {
                var byCnic = await _context.Users.FirstOrDefaultAsync(u => u.Role == "Patient" && u.CNIC == normalizedCnic);
                if (byCnic != null) return byCnic;
            }

            return await _userManager.FindByIdAsync(patientIdentifier);
        }

        public sealed class UpsertPatientByCnicRequest
        {
            public string FullName { get; set; } = string.Empty;
            public string CNIC { get; set; } = string.Empty;
            public string? Email { get; set; }
            public string? PhoneNumber { get; set; }
            public DateTime? DateOfBirth { get; set; }
            public string? Gender { get; set; }
            public string? City { get; set; }
            public string? Province { get; set; }
            public bool CreatePortalAccount { get; set; } = false;
            public string? Password { get; set; }
        }

        // Profile Management - View Profile
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var doctor = await _userManager.FindByIdAsync(doctorId);
                if (doctor == null)
                    return NotFound(new { Message = "Doctor profile not found." });

                return Ok(new { Message = "Doctor profile retrieved successfully.", Data = doctor });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving doctor profile.", Error = ex.Message });
            }
        }

        // Profile Management - Update Profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var doctor = await _userManager.FindByIdAsync(doctorId);
                if (doctor == null)
                    return NotFound(new { Message = "Doctor profile not found." });

                if (dto.FullName != null) doctor.FullName = dto.FullName;
                if (dto.Specialty != null) doctor.Specialty = dto.Specialty;
                if (dto.ExperienceYears.HasValue) doctor.ExperienceYears = dto.ExperienceYears;
                if (dto.PhoneNumber != null) doctor.PhoneNumber = dto.PhoneNumber;
                if (dto.City != null) doctor.City = dto.City;
                if (dto.Province != null) doctor.Province = dto.Province;
                if (dto.DateOfBirth.HasValue) doctor.DateOfBirth = dto.DateOfBirth.Value;
                if (dto.Gender != null) doctor.Gender = dto.Gender;

                var result = await _userManager.UpdateAsync(doctor);
                if (!result.Succeeded)
                    return BadRequest(new { Message = "Doctor profile update failed.", Errors = result.Errors.Select(e => e.Description) });

                return Ok(new { Message = "Doctor profile updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while updating doctor profile.", Error = ex.Message });
            }
        }

        // Add Patient Medical Data/History
        [HttpGet("patients")]
        public async Task<IActionResult> GetPatients([FromQuery] string? search = null, int page = 1, int pageSize = 50)
        {
            try
            {
                var doctorId = GetCurrentDoctorId();
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var query = _context.Users
                    .Where(u => u.Role == "Patient")
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var term = search.Trim();
                    var normalizedTerm = NormalizeCnic(term);
                    query = query.Where(p =>
                        p.FullName.Contains(term) ||
                        (p.Email != null && p.Email.Contains(term)) ||
                        p.CNIC.Contains(term) ||
                        (!string.IsNullOrWhiteSpace(normalizedTerm) && p.CNIC == normalizedTerm));
                }

                var total = await query.CountAsync();
                var patients = await query
                    .OrderByDescending(p => p.LastActivity)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new
                    {
                        id = p.Id,
                        name = p.FullName,
                        email = p.Email,
                        phone = p.PhoneNumber,
                        cnic = p.CNIC,
                        dateOfBirth = p.DateOfBirth,
                        gender = p.Gender,
                        status = "active",
                        createdAt = p.LastActivity,
                        updatedAt = p.LastActivity
                    })
                    .ToListAsync();

                return Ok(new { Message = "Patients retrieved successfully.", Data = patients, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving patients.", Error = ex.Message });
            }
        }

        [HttpGet("patients/lookup-by-cnic/{cnic}")]
        public async Task<IActionResult> LookupPatientByCnic(string cnic)
        {
            var doctorId = GetCurrentDoctorId();
            if (string.IsNullOrEmpty(doctorId))
                return Unauthorized(new { Message = "Invalid authentication token." });

            var normalizedCnic = NormalizeCnic(cnic);
            if (normalizedCnic.Length != 13)
                return BadRequest(new { Message = "CNIC must be exactly 13 digits." });

            var patient = await _context.Users.FirstOrDefaultAsync(u => u.Role == "Patient" && u.CNIC == normalizedCnic);
            if (patient == null)
                return Ok(new { Message = "Patient not found for this CNIC.", Exists = false });

            return Ok(new
            {
                Message = "Patient found.",
                Exists = true,
                Data = new
                {
                    id = patient.Id,
                    cnic = patient.CNIC,
                    name = patient.FullName,
                    fullName = patient.FullName,
                    email = patient.Email,
                    phone = patient.PhoneNumber,
                    dateOfBirth = patient.DateOfBirth,
                    gender = patient.Gender,
                    city = patient.City,
                    province = patient.Province,
                    status = "active",
                    hasPortalAccount = !string.IsNullOrWhiteSpace(patient.Email) && !patient.Email.EndsWith("@noaccount.medrotic.local")
                }
            });
        }

        [HttpPost("patients/upsert-by-cnic")]
        public async Task<IActionResult> UpsertPatientByCnic([FromBody] UpsertPatientByCnicRequest dto)
        {
            if (dto == null) return BadRequest(new { Message = "Payload is required." });
            if (string.IsNullOrWhiteSpace(dto.FullName)) return BadRequest(new { Message = "Full name is required." });

            var doctorId = GetCurrentDoctorId();
            if (string.IsNullOrEmpty(doctorId))
                return Unauthorized(new { Message = "Invalid authentication token." });

            var normalizedCnic = NormalizeCnic(dto.CNIC);
            if (normalizedCnic.Length != 13)
                return BadRequest(new { Message = "CNIC must be exactly 13 digits." });

            var existingPatient = await _context.Users.FirstOrDefaultAsync(u => u.Role == "Patient" && u.CNIC == normalizedCnic);
            if (existingPatient != null)
            {
                return Ok(new
                {
                    Message = "Existing patient selected by CNIC.",
                    Created = false,
                    Data = new
                    {
                        id = existingPatient.Id,
                        cnic = existingPatient.CNIC,
                        name = existingPatient.FullName,
                        email = existingPatient.Email,
                        phone = existingPatient.PhoneNumber
                    }
                });
            }

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var emailExists = await _userManager.FindByEmailAsync(dto.Email);
                if (emailExists != null)
                    return BadRequest(new { Message = "Email is already linked to another account." });
            }

            var placeholderEmail = $"{normalizedCnic}@noaccount.medrotic.local";
            var emailToUse = dto.CreatePortalAccount ? (dto.Email ?? string.Empty).Trim() : placeholderEmail;
            if (dto.CreatePortalAccount && string.IsNullOrWhiteSpace(emailToUse))
                return BadRequest(new { Message = "Email is required when creating a portal account." });

            var newPatient = new ApplicationUser
            {
                Id = normalizedCnic,
                UserName = emailToUse,
                Email = emailToUse,
                FullName = dto.FullName.Trim(),
                CNIC = normalizedCnic,
                Role = "Patient",
                PhoneNumber = dto.PhoneNumber ?? string.Empty,
                DateOfBirth = dto.DateOfBirth ?? DateTime.UtcNow.AddYears(-25),
                Gender = string.IsNullOrWhiteSpace(dto.Gender) ? "Not Specified" : dto.Gender!,
                City = dto.City ?? string.Empty,
                Province = dto.Province ?? string.Empty
            };

            var password = dto.CreatePortalAccount
                ? (string.IsNullOrWhiteSpace(dto.Password) ? "Patient@123" : dto.Password)
                : $"NoAcc@{normalizedCnic.Substring(0, 5)}!";

            var createResult = await _userManager.CreateAsync(newPatient, password);
            if (!createResult.Succeeded)
                return BadRequest(new { Message = "Patient creation failed.", Errors = createResult.Errors.Select(e => e.Description) });

            await _userManager.AddToRoleAsync(newPatient, "Patient");

            if (!dto.CreatePortalAccount)
            {
                await _userManager.SetLockoutEnabledAsync(newPatient, true);
                await _userManager.SetLockoutEndDateAsync(newPatient, DateTimeOffset.MaxValue);
            }

            return Ok(new
            {
                Message = dto.CreatePortalAccount
                    ? "Patient created and can access portal."
                    : "Patient added without portal account. Doctor can continue record workflows.",
                Created = true,
                Data = new
                {
                    id = newPatient.Id,
                    cnic = newPatient.CNIC,
                    name = newPatient.FullName,
                    email = newPatient.Email,
                    phone = newPatient.PhoneNumber,
                    hasPortalAccount = dto.CreatePortalAccount
                }
            });
        }

        // Add Patient Medical Data/History
        [HttpPost("patients/{patientId}/records")]
        public async Task<IActionResult> AddPatientRecord(string patientId, [FromForm] AddPatientRecordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var patient = await ResolvePatientByIdentifierAsync(patientId);
                if (patient == null || patient.Role != "Patient")
                    return NotFound(new { Message = "Patient not found or invalid role." });

                var record = new MedicalRecord
                {
                    PatientId = patient.Id,
                    DoctorId = doctorId,
                    RecordDate = dto.RecordDate,
                    Diagnosis = dto.Diagnosis,
                    Treatment = dto.Treatment,
                    Disease = dto.Disease,
                    Description = dto.Description,
                    CreatedByRole = "Doctor"
                };

                if (dto.ReportFile != null)
                {
                    if (dto.ReportFile.Length > 5 * 1024 * 1024)
                        return BadRequest(new { Message = "File size exceeds 5MB limit." });
                    var ext = Path.GetExtension(dto.ReportFile.FileName).ToLower();
                    if (!new[] { ".jpg", ".jpeg", ".png", ".webp", ".pdf" }.Contains(ext))
                        return BadRequest(new { Message = "Invalid file type. Only JPG, PNG, WebP, PDF allowed." });

                    var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
                    Directory.CreateDirectory(uploadsFolder);
                    var fileName = Guid.NewGuid() + ext;
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.ReportFile.CopyToAsync(stream);
                    }

                    record.ReportFilePath = $"/uploads/{fileName}";
                }

                _context.MedicalRecords.Add(record);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Patient medical data/history added successfully.", RecordId = record.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while adding patient medical data.", Error = ex.Message });
            }
        }

        // View Patient Medical Data/History
        [HttpGet("patients/{patientId}/records")]
        public async Task<IActionResult> GetPatientRecords(string patientId, int page = 1, int pageSize = 10)
        {
            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var patient = await ResolvePatientByIdentifierAsync(patientId);
                if (patient == null || patient.Role != "Patient")
                    return NotFound(new { Message = "Patient not found or invalid role." });

                var query = _context.MedicalRecords.Where(r => r.PatientId == patient.Id);
                var total = await query.CountAsync();
                var records = await query.OrderByDescending(r => r.RecordDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

                if (records.Count == 0)
                    return Ok(new { Message = "No medical data/history found for this patient.", Data = records, Total = total });

                return Ok(new { Message = "Patient medical data/history retrieved successfully.", Data = records, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving patient medical data.", Error = ex.Message });
            }
        }

        // Update Patient Medical Data/History
        [HttpPut("patients/{patientId}/records/{recordId}")]
        public async Task<IActionResult> UpdatePatientRecord(string patientId, string recordId, [FromBody] AddPatientRecordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var patient = await ResolvePatientByIdentifierAsync(patientId);
                if (patient == null || patient.Role != "Patient")
                    return NotFound(new { Message = "Patient not found or invalid role." });

                var record = await _context.MedicalRecords.FirstOrDefaultAsync(r => r.Id == recordId && r.PatientId == patient.Id);
                if (record == null)
                    return NotFound(new { Message = "Medical record not found for this patient." });

                record.Diagnosis = dto.Diagnosis ?? record.Diagnosis;
                record.Treatment = dto.Treatment ?? record.Treatment;
                record.Disease = dto.Disease ?? record.Disease;
                record.Description = dto.Description ?? record.Description;
                record.RecordDate = dto.RecordDate;

                await _context.SaveChangesAsync();

                return Ok(new { Message = "Patient medical data/history updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while updating patient medical data.", Error = ex.Message });
            }
        }

        // Delete Patient Medical Data/History
        [HttpDelete("patients/{patientId}/records/{recordId}")]
        public async Task<IActionResult> DeletePatientRecord(string patientId, string recordId)
        {
            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var patient = await ResolvePatientByIdentifierAsync(patientId);
                if (patient == null || patient.Role != "Patient")
                    return NotFound(new { Message = "Patient not found or invalid role." });

                var record = await _context.MedicalRecords.FirstOrDefaultAsync(r => r.Id == recordId && r.PatientId == patient.Id);
                if (record == null)
                    return NotFound(new { Message = "Medical record not found for this patient." });

                _context.MedicalRecords.Remove(record);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Patient medical data/history deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while deleting patient medical data.", Error = ex.Message });
            }
        }

        // Approve AI Result
        [HttpPut("ai-results/{id}/approve")]
        public async Task<IActionResult> ApproveAIResult(string id)
        {
            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var aiResult = await _context.AIResults.FirstOrDefaultAsync(a => a.Id == id);
                if (aiResult == null)
                    return NotFound(new { Message = "AI result not found." });

                aiResult.IsApproved = true;
                aiResult.ApprovedByDoctorId = doctorId;
                aiResult.ApprovedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { Message = "AI result approved successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while approving AI result.", Error = ex.Message });
            }
        }

        // Send Notification to Patient
        [HttpPost("patients/{patientId}/notifications")]
        public async Task<IActionResult> SendNotification(string patientId, [FromBody] SendNotificationDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var patient = await ResolvePatientByIdentifierAsync(patientId);
                if (patient == null || patient.Role != "Patient")
                    return NotFound(new { Message = "Patient not found or invalid role." });

                var notification = new Notification
                {
                    MedicalRecordId = dto.MedicalRecordId,
                    Message = dto.Message,
                    Channel = dto.Channel
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Notification sent to patient successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while sending notification.", Error = ex.Message });
            }
        }

        // Doctor Analytics
        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });
                var doctor = await _userManager.FindByIdAsync(doctorId);
                var doctorName = doctor?.FullName ?? string.Empty;

                var analytics = new
                {
                    TotalPatients = await _context.MedicalRecords.Where(r => r.DoctorName == doctorName).Select(r => r.PatientId).Distinct().CountAsync(),
                    TotalRecords = await _context.MedicalRecords.Where(r => r.DoctorName == doctorName).CountAsync(),
                    TotalAIApprovals = await _context.AIResults.Where(a => a.ApprovedByDoctorId == doctorId).CountAsync()
                };

                return Ok(new { Message = "Doctor analytics retrieved successfully.", Data = analytics });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving doctor analytics.", Error = ex.Message });
            }
        }

        // Appointments - Add
        [HttpPost("appointments")]
        public async Task<IActionResult> AddAppointment([FromBody] AddAppointmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var patient = await _userManager.FindByIdAsync(dto.PatientId);
                if (patient == null || patient.Role != "Patient")
                    return NotFound(new { Message = "Patient not found or invalid role." });

                var appointment = new Appointment
                {
                    PatientId = dto.PatientId,
                    DoctorId = doctorId,
                    AppointmentDate = dto.AppointmentDate,
                    Notes = dto.Notes
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Appointment added successfully.", AppointmentId = appointment.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while adding appointment.", Error = ex.Message });
            }
        }

        // Appointments - View
        [HttpGet("appointments")]
        public async Task<IActionResult> GetAppointments(int page = 1, int pageSize = 10)
        {
            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var query = _context.Appointments.Where(a => a.DoctorId == doctorId);
                var total = await query.CountAsync();
                var appointments = await query.OrderByDescending(a => a.AppointmentDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

                if (appointments.Count == 0)
                    return Ok(new { Message = "No appointments found.", Data = appointments, Total = total });

                return Ok(new { Message = "Appointments retrieved successfully.", Data = appointments, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving appointments.", Error = ex.Message });
            }
        }

        // Appointments - Update
        [HttpPut("appointments/{id}")]
        public async Task<IActionResult> UpdateAppointment(string id, [FromBody] AddAppointmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.DoctorId == doctorId);
                if (appointment == null)
                    return NotFound(new { Message = "Appointment not found or not owned by you." });

                appointment.AppointmentDate = dto.AppointmentDate;
                appointment.Notes = dto.Notes;

                await _context.SaveChangesAsync();

                return Ok(new { Message = "Appointment updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while updating appointment.", Error = ex.Message });
            }
        }

        // Appointments - Delete
        [HttpDelete("appointments/{id}")]
        public async Task<IActionResult> DeleteAppointment(string id)
        {
            try
            {
                var doctorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.DoctorId == doctorId);
                if (appointment == null)
                    return NotFound(new { Message = "Appointment not found or not owned by you." });

                _context.Appointments.Remove(appointment);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Appointment deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while deleting appointment.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // Doctor Portal - Prescriptions & X-Rays (aggregate)
        // ────────────────────────────────────────────────

        [HttpGet("prescriptions")]
        public async Task<IActionResult> GetPrescriptions(int page = 1, int pageSize = 20)
        {
            try
            {
                var doctorId = GetCurrentDoctorId();
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var doctor = await _userManager.FindByIdAsync(doctorId);
                var doctorName = doctor?.FullName ?? string.Empty;

                var query = _context.MedicalRecords
                    .Where(r =>
                        r.DoctorName == doctorName &&
                        r.ReportFilePath != null &&
                        r.ReportFilePath.ToLower().EndsWith(".pdf"))
                    .OrderByDescending(r => r.RecordDate);

                var total = await query.CountAsync();
                var records = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

                var data = records.Select(r => new
                {
                    id = r.Id,
                    patientId = r.PatientId,
                    doctorId = doctorId,
                    doctorName = r.DoctorName,
                    date = r.RecordDate.ToString("o"),
                    medications = new[]
                    {
                        new { name = r.Diagnosis, dosage = "", frequency = "", duration = "" }
                    },
                    instructions = r.Treatment,
                    createdAt = r.RecordDate.ToString("o")
                }).ToList();

                return Ok(new { Message = "Prescriptions retrieved successfully.", Data = data, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving prescriptions.", Error = ex.Message });
            }
        }

        [HttpGet("xrays")]
        public async Task<IActionResult> GetXrays(int page = 1, int pageSize = 20)
        {
            try
            {
                var doctorId = GetCurrentDoctorId();
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var doctor = await _userManager.FindByIdAsync(doctorId);
                var doctorName = doctor?.FullName ?? string.Empty;

                var query = _context.MedicalRecords
                    .Where(r =>
                        r.DoctorName == doctorName &&
                        r.ReportFilePath != null &&
                        (
                            r.ReportFilePath.ToLower().EndsWith(".jpg") ||
                            r.ReportFilePath.ToLower().EndsWith(".jpeg") ||
                            r.ReportFilePath.ToLower().EndsWith(".png") ||
                            r.ReportFilePath.ToLower().EndsWith(".webp")
                        ))
                    .OrderByDescending(r => r.RecordDate);

                var total = await query.CountAsync();
                var records = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

                var data = records.Select(r => new
                {
                    id = r.Id,
                    patientId = r.PatientId,
                    doctorId = doctorId,
                    doctorName = r.DoctorName,
                    fileName = r.ReportFilePath != null ? Path.GetFileName(r.ReportFilePath) : string.Empty,
                    fileUrl = r.ReportFilePath,
                    analysis = r.Description,
                    uploadedAt = r.RecordDate.ToString("o"),
                    createdAt = r.RecordDate.ToString("o")
                }).ToList();

                return Ok(new { Message = "X-rays retrieved successfully.", Data = data, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving x-rays.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // Doctor Portal - Inbox / Messages
        // ────────────────────────────────────────────────

        [HttpGet("messages")]
        public async Task<IActionResult> GetMessages([FromQuery] string? patientId, int page = 1, int pageSize = 50)
        {
            try
            {
                var doctorId = GetCurrentDoctorId();
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });
                var doctor = await _userManager.FindByIdAsync(doctorId);
                var doctorName = doctor?.FullName ?? string.Empty;

                var query = _context.Notifications
                    .Include(n => n.MedicalRecord)
                    .Where(n => n.MedicalRecord.DoctorName == doctorName);

                if (!string.IsNullOrWhiteSpace(patientId))
                    query = query.Where(n => n.MedicalRecord.PatientId == patientId);

                var total = await query.CountAsync();
                var messages = await query
                    .OrderByDescending(n => n.SentAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(n => new
                    {
                        id = n.Id,
                        to = n.MedicalRecord.PatientId,
                        from = doctorId,
                        content = n.Message,
                        medicalRecordId = n.MedicalRecordId,
                        channel = n.Channel,
                        timestamp = n.SentAt,
                        read = n.IsRead
                    })
                    .ToListAsync();

                return Ok(new { Message = "Messages retrieved successfully.", Data = messages, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving messages.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // Doctor Portal - Documents
        // ────────────────────────────────────────────────

        [HttpGet("documents")]
        public async Task<IActionResult> GetDocuments([FromQuery] string? patientId, int page = 1, int pageSize = 50)
        {
            try
            {
                var doctorId = GetCurrentDoctorId();
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });
                var doctor = await _userManager.FindByIdAsync(doctorId);
                var doctorName = doctor?.FullName ?? string.Empty;

                var patientIdsQuery = _context.MedicalRecords
                    .Where(r => r.DoctorName == doctorName)
                    .Select(r => r.PatientId)
                    .Distinct();

                var query = _context.Documents
                    .Where(d => patientIdsQuery.Contains(d.PatientId));

                if (!string.IsNullOrWhiteSpace(patientId))
                    query = query.Where(d => d.PatientId == patientId);

                query = query.OrderByDescending(d => d.UploadedAt);

                var total = await query.CountAsync();
                var docsRaw = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

                var docs = docsRaw.Select(d => new
                {
                    id = d.Id,
                    patientId = d.PatientId,
                    doctorId = d.UploadedByRole == "Doctor" ? d.UploadedById : null,
                    name = Path.GetFileName(d.FilePath),
                    type = NormalizeDocumentType(d.DocumentType),
                    fileName = Path.GetFileName(d.FilePath),
                    fileUrl = d.FilePath,
                    size = TryGetFileSize(d.FilePath),
                    uploadedAt = d.UploadedAt,
                    createdAt = d.UploadedAt,
                    verificationStatus = NormalizeVerificationStatus(d.CurrentState),
                    verifiedBy = (string?)null,
                    verifiedAt = (DateTime?)null,
                    currentState = d.CurrentState
                }).ToList();

                return Ok(new { Message = "Documents retrieved successfully.", Data = docs, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving documents.", Error = ex.Message });
            }
        }

        [HttpDelete("documents/{id}")]
        public async Task<IActionResult> DeleteDocument(string id)
        {
            try
            {
                var doctorId = GetCurrentDoctorId();
                if (string.IsNullOrEmpty(doctorId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id);
                if (document == null) return NotFound(new { Message = "Document not found." });

                _context.Documents.Remove(document);
                await _context.SaveChangesAsync();

                // Best-effort cleanup (ignore failures).
                try
                {
                    if (!string.IsNullOrWhiteSpace(document.FilePath))
                    {
                        var relative = document.FilePath.TrimStart('/', '\\').Replace('/', Path.DirectorySeparatorChar);
                        var fullPath = Path.Combine(_environment.WebRootPath, relative);
                        if (System.IO.File.Exists(fullPath))
                            System.IO.File.Delete(fullPath);
                    }
                }
                catch
                {
                    // ignore
                }

                return Ok(new { Message = "Document deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while deleting document.", Error = ex.Message });
            }
        }
    }
}