using Medrotic.Api.Data;
using Medrotic.Api.DTOs;
using Medrotic.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Linq;
using System.Security.Claims;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Medrotic.Api.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private static string NormalizeCnic(string? cnic)
        {
            if (string.IsNullOrWhiteSpace(cnic)) return string.Empty;
            return Regex.Replace(cnic, @"\D", "");
        }

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _context;

        // Lightweight in-memory stores so "missing API" UI doesn't hard-fail.
        // These are not meant to be authoritative persistence.
        private static readonly ConcurrentDictionary<string, IntegrationItem> IntegrationsStore = new();
        private static readonly ConcurrentDictionary<string, string> UserStatusStore = new();

        public sealed class IntegrationItem
        {
            public string Id { get; set; } = Guid.NewGuid().ToString();
            public string Name { get; set; } = string.Empty;
            public string Type { get; set; } = "api";
            public string Endpoint { get; set; } = string.Empty;
            public string Status { get; set; } = "inactive";
            public DateTime LastSync { get; set; } = DateTime.UtcNow;
        }


        public AdminController(UserManager<ApplicationUser> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        // ────────────────────────────────────────────────
        // 1. DOCTORS MANAGEMENT
        // ────────────────────────────────────────────────
        [HttpGet("doctors")]
        public async Task<IActionResult> GetDoctors(
            int page = 1,
            int pageSize = 10,
            [FromQuery] string? city = null,
            [FromQuery] string? specialty = null,
            [FromQuery] string? disease = null,
            [FromQuery] int? experience = null)
        {
            try
            {
                var query = _context.Users
                    .Where(u => u.Role == "Doctor")
                    .Include(u => u.Hospital)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(city))
                    query = query.Where(d => d.City != null && d.City.Contains(city));

                if (!string.IsNullOrWhiteSpace(specialty))
                    query = query.Where(d => d.Specialty != null && d.Specialty.Contains(specialty));

                if (experience.HasValue)
                    query = query.Where(d => d.ExperienceYears.HasValue && d.ExperienceYears.Value >= experience.Value);

                if (!string.IsNullOrWhiteSpace(disease))
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

                var total = await query.CountAsync();
                var doctorsRaw = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new
                    {
                        id = d.Id,
                        // Fields used by different frontend modules
                        name = d.FullName,
                        email = d.Email,
                        phone = d.PhoneNumber,
                        license = d.CNIC ?? string.Empty,
                        specialization = d.Specialty ?? string.Empty,
                        specialty = d.Specialty ?? string.Empty,
                        experience = d.ExperienceYears ?? 0,
                        city = d.City,
                        province = d.Province,
                        gender = d.Gender,
                        hospital = d.Hospital != null ? d.Hospital.Name : "Not Assigned",
                        qualifications = (string[]?)null,
                        rating = (double?)null,
                        // UI expects a status badge; without a persisted workflow we default to pending.
                        status = "pending",
                        createdAt = d.LastActivity,
                        updatedAt = d.LastActivity,

                        // Keep original fields for compatibility
                        d.Id,
                        d.FullName,
                        d.Email,
                        d.PhoneNumber,
                        d.CNIC,
                        d.Specialty,
                        d.ExperienceYears,
                        d.City,
                        d.Province,
                        d.Gender,
                        d.DateOfBirth,
                        HospitalId = d.HospitalId,
                        HospitalName = d.Hospital != null ? d.Hospital.Name : "Not Assigned"
                    })
                    .ToListAsync();

                // Map in-memory verification status to the `status` badge expected by the frontend.
                // Note: we do this after materialization to avoid LINQ-to-SQL translation issues.
                var doctors = doctorsRaw.Select(d =>
                {
                    var dict = new Dictionary<string, object?>();
                    foreach (var prop in d.GetType().GetProperties())
                        dict[prop.Name] = prop.GetValue(d);

                    var storedStatus = UserStatusStore.TryGetValue(d.id, out var s) ? s : "pending";
                    dict["status"] =
                        storedStatus == "verified" ? "verified" :
                        storedStatus == "rejected" ? "rejected" :
                        "pending";

                    return dict;
                }).ToList();

                return Ok(new { Message = "Doctors retrieved successfully.", Data = doctors, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving doctors.", Error = ex.Message });
            }
        }
        [HttpPost("doctors")]
        public async Task<IActionResult> AddDoctor([FromBody] RegisterUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                if (dto.Role != "Doctor") return BadRequest(new { Message = "This endpoint is only for adding Doctors." });
                if (string.IsNullOrEmpty(dto.Specialty) || !dto.ExperienceYears.HasValue) return BadRequest(new { Message = "Specialty and ExperienceYears are required for doctors." });
                if (await _userManager.FindByEmailAsync(dto.Email) != null) return BadRequest(new { Message = "Email already registered." });
                var normalizedCnic = NormalizeCnic(dto.CNIC);
                if (normalizedCnic.Length != 13) return BadRequest(new { Message = "CNIC must be exactly 13 digits." });
                if (await _context.Users.AnyAsync(u => u.CNIC == normalizedCnic)) return BadRequest(new { Message = "CNIC already registered." });
                if (!string.IsNullOrEmpty(dto.HospitalId) && await _context.Hospitals.FindAsync(dto.HospitalId) == null) return BadRequest(new { Message = "Invalid Hospital ID." });
                var doctor = new ApplicationUser
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    FullName = dto.FullName,
                    CNIC = normalizedCnic,
                    Role = "Doctor",
                    Specialty = dto.Specialty,
                    ExperienceYears = dto.ExperienceYears,
                    City = dto.City,
                    Province = dto.Province,
                    PhoneNumber = dto.PhoneNumber,
                    DateOfBirth = dto.DateOfBirth ?? DateTime.UtcNow.AddYears(-30),
                    Gender = dto.Gender ?? "Not Specified",
                    HospitalId = dto.HospitalId
                };
                var result = await _userManager.CreateAsync(doctor, dto.Password ?? "Doctor@123");
                if (!result.Succeeded) return BadRequest(new { Message = "Doctor creation failed: " + string.Join(", ", result.Errors.Select(e => e.Description)) });
                await _userManager.AddToRoleAsync(doctor, "Doctor");
                return Ok(new { Message = $"Doctor '{doctor.FullName}' created successfully and assigned to hospital ID {doctor.HospitalId ?? "None"}.", DoctorId = doctor.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while adding doctor.", Error = ex.Message });
            }
        }
        [HttpPut("doctors/{id}")]
        public async Task<IActionResult> UpdateDoctor(string id, [FromBody] UpdateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var doctor = await _userManager.FindByIdAsync(id);
                if (doctor == null || doctor.Role != "Doctor") return NotFound(new { Message = "Doctor not found." });
                if (!string.IsNullOrWhiteSpace(dto.Email) && !string.Equals(dto.Email, doctor.Email, StringComparison.OrdinalIgnoreCase))
                {
                    if (await _userManager.FindByEmailAsync(dto.Email) != null) return BadRequest(new { Message = "Email already registered." });
                }
                if (!string.IsNullOrWhiteSpace(dto.CNIC))
                {
                    var normalizedCnic = NormalizeCnic(dto.CNIC);
                    if (normalizedCnic.Length != 13) return BadRequest(new { Message = "CNIC must be exactly 13 digits." });
                    if (await _context.Users.AnyAsync(u => u.Id != doctor.Id && u.CNIC == normalizedCnic)) return BadRequest(new { Message = "CNIC already registered." });
                    dto.CNIC = normalizedCnic;
                }
                if (!string.IsNullOrEmpty(dto.HospitalId) && await _context.Hospitals.FindAsync(dto.HospitalId) == null) return BadRequest(new { Message = "Invalid Hospital ID." });
                doctor.FullName = dto.FullName ?? doctor.FullName;
                doctor.Email = dto.Email ?? doctor.Email;
                doctor.UserName = doctor.Email;
                doctor.CNIC = dto.CNIC ?? doctor.CNIC;
                doctor.Specialty = dto.Specialty ?? doctor.Specialty;
                doctor.ExperienceYears = dto.ExperienceYears ?? doctor.ExperienceYears;
                doctor.City = dto.City ?? doctor.City;
                doctor.Province = dto.Province ?? doctor.Province;
                doctor.PhoneNumber = dto.PhoneNumber ?? doctor.PhoneNumber;
                doctor.DateOfBirth = dto.DateOfBirth;
                doctor.Gender = dto.Gender ?? doctor.Gender;
                doctor.HospitalId = dto.HospitalId ?? doctor.HospitalId;
                var result = await _userManager.UpdateAsync(doctor);
                if (!result.Succeeded) return BadRequest(new { Message = "Doctor update failed: " + string.Join(", ", result.Errors.Select(e => e.Description)) });
                return Ok(new { Message = $"Doctor '{doctor.FullName}' updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while updating doctor.", Error = ex.Message });
            }
        }
        [HttpDelete("doctors/{id}")]
        public async Task<IActionResult> DeleteDoctor(string id)
        {
            try
            {
                var doctor = await _userManager.FindByIdAsync(id);
                if (doctor == null || doctor.Role != "Doctor") return NotFound(new { Message = "Doctor not found." });
                var result = await _userManager.DeleteAsync(doctor);
                if (!result.Succeeded) return BadRequest(new { Message = "Doctor deletion failed: " + string.Join(", ", result.Errors.Select(e => e.Description)) });
                return Ok(new { Message = $"Doctor ID {id} deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while deleting doctor.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // 2. HOSPITALS MANAGEMENT
        // ────────────────────────────────────────────────
        [HttpGet("hospitals")]
        public async Task<IActionResult> GetHospitals(int page = 1, int pageSize = 10)
        {
            try
            {
                var query = _context.Hospitals.Include(h => h.Staff);
                var total = await query.CountAsync();
                var hospitals = await query.Skip((page - 1) * pageSize).Take(pageSize)
                    .Select(h => new
                    {
                        h.Id,
                        h.Name,
                        h.Address,
                        h.City,
                        h.Province,
                        h.ContactNumber,
                        h.Email,
                        DoctorCount = h.Staff.Count(s => s.Role == "Doctor"),
                        AdminCount = h.Staff.Count(s => s.Role == "Admin")
                    }).ToListAsync();
                if (!hospitals.Any()) return Ok(new { Message = "No hospitals found.", Data = hospitals, Total = total });
                return Ok(new { Message = "Hospitals retrieved successfully.", Data = hospitals, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving hospitals.", Error = ex.Message });
            }
        }
        [HttpPost("hospitals")]
        public async Task<IActionResult> AddHospital([FromBody] HospitalDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var hospital = new Hospital
                {
                    Name = dto.Name,
                    Address = dto.Address,
                    City = dto.City,
                    Province = dto.Province,
                    ContactNumber = dto.ContactNumber,
                    Email = dto.Email
                };
                _context.Hospitals.Add(hospital);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetHospital), new { id = hospital.Id }, new { Message = $"Hospital '{hospital.Name}' added successfully.", Hospital = hospital });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while adding hospital.", Error = ex.Message });
            }
        }
        [HttpGet("hospitals/{id}")]
        public async Task<IActionResult> GetHospital(string id)
        {
            try
            {
                var hospital = await _context.Hospitals.FindAsync(id);
                if (hospital == null) return NotFound(new { Message = "Hospital not found." });
                return Ok(new { Message = "Hospital retrieved successfully.", Data = hospital });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving hospital.", Error = ex.Message });
            }
        }
        [HttpPut("hospitals/{id}")]
        public async Task<IActionResult> UpdateHospital(string id, [FromBody] HospitalDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var hospital = await _context.Hospitals.FindAsync(id);
                if (hospital == null) return NotFound(new { Message = "Hospital not found." });
                hospital.Name = dto.Name ?? hospital.Name;
                hospital.Address = dto.Address ?? hospital.Address;
                hospital.City = dto.City ?? hospital.City;
                hospital.Province = dto.Province ?? hospital.Province;
                hospital.ContactNumber = dto.ContactNumber ?? hospital.ContactNumber;
                hospital.Email = dto.Email ?? hospital.Email;
                await _context.SaveChangesAsync();
                return Ok(new { Message = $"Hospital '{hospital.Name}' updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while updating hospital.", Error = ex.Message });
            }
        }
        [HttpDelete("hospitals/{id}")]
        public async Task<IActionResult> DeleteHospital(string id)
        {
            try
            {
                var hospital = await _context.Hospitals.Include(h => h.Staff).FirstOrDefaultAsync(h => h.Id == id);
                if (hospital == null) return NotFound(new { Message = "Hospital not found." });
                if (hospital.Staff.Any()) return BadRequest(new { Message = "Cannot delete hospital with assigned staff. Reassign or remove staff first." });
                _context.Hospitals.Remove(hospital);
                await _context.SaveChangesAsync();
                return Ok(new { Message = $"Hospital ID {id} deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while deleting hospital.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // 3. PATIENTS MANAGEMENT (Added Update/Delete for completeness)
        // ────────────────────────────────────────────────
        [HttpGet("patients")]
        public async Task<IActionResult> GetPatients(int page = 1, int pageSize = 10)
        {
            try
            {
                var query = _userManager.GetUsersInRoleAsync("Patient").Result.AsQueryable();
                var total = query.Count();
                var patientsRaw = query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new
                    {
                        // Frontend expects lowercase/camelCase fields.
                        id = p.Id,
                        name = p.FullName,
                        email = p.Email,
                        phone = p.PhoneNumber,
                        dateOfBirth = p.DateOfBirth.ToString("yyyy-MM-dd"),
                        createdAt = p.LastActivity,
                        updatedAt = p.LastActivity,

                        // Keep original fields for compatibility.
                        p.Id,
                        p.FullName,
                        p.Email,
                        p.PhoneNumber,
                        p.CNIC,
                        p.City,
                        p.Province,
                        p.Gender,
                        p.DateOfBirth
                    })
                    .ToList();

                // Map in-memory approval/rejection into the `status` badge expected by the frontend.
                var patients = patientsRaw.Select(p =>
                {
                    var dict = new Dictionary<string, object?>();
                    foreach (var prop in p.GetType().GetProperties())
                        dict[prop.Name] = prop.GetValue(p);

                    var storedStatus = UserStatusStore.TryGetValue(p.id, out var s) ? s : null;
                    dict["status"] = storedStatus == "rejected" ? "inactive" : "active";
                    return dict;
                }).ToList();

                if (!patients.Any()) return Ok(new { Message = "No patients found.", Data = patients, Total = total });
                return Ok(new { Message = "Patients retrieved successfully.", Data = patients, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving patients.", Error = ex.Message });
            }
        }
        [HttpPut("patients/{id}")]
        public async Task<IActionResult> UpdatePatient(string id, [FromBody] UpdateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var patient = await _userManager.FindByIdAsync(id);
                if (patient == null || patient.Role != "Patient") return NotFound(new { Message = "Patient not found." });
                if (!string.IsNullOrWhiteSpace(dto.Email) && !string.Equals(dto.Email, patient.Email, StringComparison.OrdinalIgnoreCase))
                {
                    if (await _userManager.FindByEmailAsync(dto.Email) != null) return BadRequest(new { Message = "Email already registered." });
                }
                if (!string.IsNullOrWhiteSpace(dto.CNIC))
                {
                    var normalizedCnic = NormalizeCnic(dto.CNIC);
                    if (normalizedCnic.Length != 13) return BadRequest(new { Message = "CNIC must be exactly 13 digits." });
                    if (await _context.Users.AnyAsync(u => u.Id != patient.Id && u.CNIC == normalizedCnic)) return BadRequest(new { Message = "CNIC already registered." });
                    dto.CNIC = normalizedCnic;
                }
                patient.FullName = dto.FullName ?? patient.FullName;
                patient.Email = dto.Email ?? patient.Email;
                patient.UserName = patient.Email;
                patient.CNIC = dto.CNIC ?? patient.CNIC;
                patient.City = dto.City ?? patient.City;
                patient.Province = dto.Province ?? patient.Province;
                patient.PhoneNumber = dto.PhoneNumber ?? patient.PhoneNumber;
                patient.DateOfBirth = dto.DateOfBirth;
                patient.Gender = dto.Gender ?? patient.Gender;
                var result = await _userManager.UpdateAsync(patient);
                if (!result.Succeeded) return BadRequest(new { Message = "Patient update failed: " + string.Join(", ", result.Errors.Select(e => e.Description)) });
                return Ok(new { Message = $"Patient '{patient.FullName}' updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while updating patient.", Error = ex.Message });
            }
        }
        [HttpDelete("patients/{id}")]
        public async Task<IActionResult> DeletePatient(string id)
        {
            try
            {
                var patient = await _userManager.FindByIdAsync(id);
                if (patient == null || patient.Role != "Patient") return NotFound(new { Message = "Patient not found." });
                // Optional: Check if has records/documents before delete
                if (await _context.MedicalRecords.AnyAsync(r => r.PatientId == id)) return BadRequest(new { Message = "Cannot delete patient with existing medical records." });
                var result = await _userManager.DeleteAsync(patient);
                if (!result.Succeeded) return BadRequest(new { Message = "Patient deletion failed: " + string.Join(", ", result.Errors.Select(e => e.Description)) });
                return Ok(new { Message = $"Patient ID {id} deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while deleting patient.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // 4. ADMINS MANAGEMENT (Added for completeness - similar to doctors)
        // ────────────────────────────────────────────────
        [HttpGet("admins")]
        public async Task<IActionResult> GetAdmins(int page = 1, int pageSize = 10)
        {
            try
            {
                var query = _context.Users.Where(u => u.Role == "Admin").Include(u => u.Hospital);
                var total = await query.CountAsync();
                var admins = await query.Skip((page - 1) * pageSize).Take(pageSize)
                    .Select(a => new
                    {
                        a.Id,
                        a.FullName,
                        a.Email,
                        a.PhoneNumber,
                        a.CNIC,
                        a.City,
                        a.Province,
                        a.Gender,
                        a.DateOfBirth,
                        HospitalId = a.HospitalId,
                        HospitalName = a.Hospital != null ? a.Hospital.Name : "Not Assigned"
                    }).ToListAsync();
                if (!admins.Any()) return Ok(new { Message = "No admins found.", Data = admins, Total = total });
                return Ok(new { Message = "Admins retrieved successfully.", Data = admins, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving admins.", Error = ex.Message });
            }
        }
        [HttpPost("admins")]
        public async Task<IActionResult> AddAdmin([FromBody] RegisterUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                if (dto.Role != "Admin") return BadRequest(new { Message = "This endpoint is only for adding Admins." });
                if (await _userManager.FindByEmailAsync(dto.Email) != null) return BadRequest(new { Message = "Email already registered." });
                var normalizedCnic = NormalizeCnic(dto.CNIC);
                if (normalizedCnic.Length != 13) return BadRequest(new { Message = "CNIC must be exactly 13 digits." });
                if (await _context.Users.AnyAsync(u => u.CNIC == normalizedCnic)) return BadRequest(new { Message = "CNIC already registered." });
                if (!string.IsNullOrEmpty(dto.HospitalId) && await _context.Hospitals.FindAsync(dto.HospitalId) == null) return BadRequest(new { Message = "Invalid Hospital ID." });
                var admin = new ApplicationUser
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    FullName = dto.FullName,
                    CNIC = normalizedCnic,
                    Role = "Admin",
                    City = dto.City,
                    Province = dto.Province,
                    PhoneNumber = dto.PhoneNumber,
                    DateOfBirth = dto.DateOfBirth ?? DateTime.UtcNow.AddYears(-30),
                    Gender = dto.Gender ?? "Not Specified",
                    HospitalId = dto.HospitalId
                };
                var result = await _userManager.CreateAsync(admin, dto.Password ?? "Admin@123");
                if (!result.Succeeded) return BadRequest(new { Message = "Admin creation failed: " + string.Join(", ", result.Errors.Select(e => e.Description)) });
                await _userManager.AddToRoleAsync(admin, "Admin");
                return Ok(new { Message = $"Admin '{admin.FullName}' created successfully and assigned to hospital ID {admin.HospitalId ?? "None"}.", AdminId = admin.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while adding admin.", Error = ex.Message });
            }
        }
        [HttpPut("admins/{id}")]
        public async Task<IActionResult> UpdateAdmin(string id, [FromBody] UpdateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var admin = await _userManager.FindByIdAsync(id);
                if (admin == null || admin.Role != "Admin") return NotFound(new { Message = "Admin not found." });
                if (!string.IsNullOrWhiteSpace(dto.Email) && !string.Equals(dto.Email, admin.Email, StringComparison.OrdinalIgnoreCase))
                {
                    if (await _userManager.FindByEmailAsync(dto.Email) != null) return BadRequest(new { Message = "Email already registered." });
                }
                if (!string.IsNullOrWhiteSpace(dto.CNIC))
                {
                    var normalizedCnic = NormalizeCnic(dto.CNIC);
                    if (normalizedCnic.Length != 13) return BadRequest(new { Message = "CNIC must be exactly 13 digits." });
                    if (await _context.Users.AnyAsync(u => u.Id != admin.Id && u.CNIC == normalizedCnic)) return BadRequest(new { Message = "CNIC already registered." });
                    dto.CNIC = normalizedCnic;
                }
                if (!string.IsNullOrEmpty(dto.HospitalId) && await _context.Hospitals.FindAsync(dto.HospitalId) == null) return BadRequest(new { Message = "Invalid Hospital ID." });
                admin.FullName = dto.FullName ?? admin.FullName;
                admin.Email = dto.Email ?? admin.Email;
                admin.UserName = admin.Email;
                admin.CNIC = dto.CNIC ?? admin.CNIC;
                admin.City = dto.City ?? admin.City;
                admin.Province = dto.Province ?? admin.Province;
                admin.PhoneNumber = dto.PhoneNumber ?? admin.PhoneNumber;
                admin.DateOfBirth = dto.DateOfBirth;
                admin.Gender = dto.Gender ?? admin.Gender;
                admin.HospitalId = dto.HospitalId ?? admin.HospitalId;
                var result = await _userManager.UpdateAsync(admin);
                if (!result.Succeeded) return BadRequest(new { Message = "Admin update failed: " + string.Join(", ", result.Errors.Select(e => e.Description)) });
                return Ok(new { Message = $"Admin '{admin.FullName}' updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while updating admin.", Error = ex.Message });
            }
        }
        [HttpDelete("admins/{id}")]
        public async Task<IActionResult> DeleteAdmin(string id)
        {
            try
            {
                var admin = await _userManager.FindByIdAsync(id);
                if (admin == null || admin.Role != "Admin") return NotFound(new { Message = "Admin not found." });
                if (admin.Email == "admin@medrotic.com") return BadRequest(new { Message = "Cannot delete default super admin." });
                var result = await _userManager.DeleteAsync(admin);
                if (!result.Succeeded) return BadRequest(new { Message = "Admin deletion failed: " + string.Join(", ", result.Errors.Select(e => e.Description)) });
                return Ok(new { Message = $"Admin ID {id} deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while deleting admin.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // 5. ANALYTICS (Enhanced with more KPIs from docs)
        // ────────────────────────────────────────────────
        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            try
            {
                var analytics = new AnalyticsDto
                {
                    TotalPatients = await _userManager.GetUsersInRoleAsync("Patient").ContinueWith(t => t.Result.Count),
                    TotalDoctors = await _userManager.GetUsersInRoleAsync("Doctor").ContinueWith(t => t.Result.Count),
                    TotalHospitals = await _context.Hospitals.CountAsync(),
                    TotalMedicalRecords = await _context.MedicalRecords.CountAsync(),
                    TotalDocuments = await _context.Documents.CountAsync(),
                    TotalAIResults = await _context.AIResults.CountAsync(),
                    TotalNotifications = await _context.Notifications.CountAsync(),
                    ActiveUsersLastMonth = await _context.Users.CountAsync(u => u.LastActivity > DateTime.UtcNow.AddMonths(-1))
                };
                
                // Calculate monthly distribution arrays dynamically
                var sixMonthsAgo = DateTime.UtcNow.AddMonths(-5);
                var patientGrowth = new List<object>();
                var doctorGrowth = new List<object>();

                var allPatients = await _userManager.GetUsersInRoleAsync("Patient");
                var allDoctors = await _userManager.GetUsersInRoleAsync("Doctor");

                for (int i = 0; i < 6; i++)
                {
                    var targetMonth = sixMonthsAgo.AddMonths(i);
                    var monthName = targetMonth.ToString("MMM");

                    // Using LastActivity as a proxy for CreatedAt/Registration time if needed
                    patientGrowth.Add(new { month = monthName, count = allPatients.Count(p => p.LastActivity.Month <= targetMonth.Month && p.LastActivity.Year <= targetMonth.Year) });
                    doctorGrowth.Add(new { month = monthName, count = allDoctors.Count(d => d.LastActivity.Month <= targetMonth.Month && d.LastActivity.Year <= targetMonth.Year) });
                }

                return Ok(new { 
                    Message = "Analytics data retrieved successfully.", 
                    Data = new {
                        totalPatients = analytics.TotalPatients,
                        totalDoctors = analytics.TotalDoctors,
                        totalAdmins = 0,
                        patientGrowth,
                        doctorGrowth,
                        kpis = new {
                            avgResponseTime = 0,
                            systemUptime = 100,
                            activeUsers = analytics.ActiveUsersLastMonth,
                            dataStorage = analytics.TotalDocuments
                        }
                    }, 
                    LastUpdated = DateTime.UtcNow 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving analytics.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // 6. MEDICAL RECORDS OVERVIEW (Added pagination)
        // ────────────────────────────────────────────────
        [HttpGet("medical-records")]
        public async Task<IActionResult> GetMedicalRecordsOverview(int page = 1, int pageSize = 50)
        {
            try
            {
                var query = _context.MedicalRecords.Include(r => r.Patient);
                var total = await query.CountAsync();
                var records = await query.OrderByDescending(r => r.RecordDate).Skip((page - 1) * pageSize).Take(pageSize)
                    .Select(r => new
                    {
                        r.Id,
                        PatientName = r.Patient.FullName,
                        r.RecordDate,
                        r.Diagnosis,
                        r.Treatment,
                        r.CreatedByRole
                    }).ToListAsync();
                if (!records.Any()) return Ok(new { Message = "No medical records found.", Data = records, Total = total });
                return Ok(new { Message = "Medical records retrieved successfully.", Data = records, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving medical records.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // 7. DOCUMENTS OVERVIEW (Added pagination)
        // ────────────────────────────────────────────────
        [HttpGet("documents")]
        public async Task<IActionResult> GetDocumentsOverview(int page = 1, int pageSize = 50)
        {
            try
            {
                var query = _context.Documents.Include(d => d.Patient);
                var total = await query.CountAsync();

                var docsRaw = await query
                    .OrderByDescending(d => d.UploadedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new
                    {
                        d.Id,
                        d.PatientId,
                        PatientName = d.Patient.FullName,
                        d.DocumentType,
                        d.FilePath,
                        d.UploadedAt,
                        d.CurrentState,
                        d.UploadedById,
                        d.UploadedByRole
                    })
                    .ToListAsync();

                var docs = docsRaw.Select(d =>
                {
                    var docType = (d.DocumentType ?? string.Empty).ToLowerInvariant();
                    var type =
                        docType.Contains("xray") ? "xray" :
                        docType.Contains("lab") ? "lab-report" :
                        docType.Contains("prescription") ? "prescription" :
                        docType.Contains("medical") ? "medical-record" :
                        "other";

                    var currentState = (d.CurrentState ?? string.Empty).ToLowerInvariant();
                    var verificationStatus =
                        currentState.Contains("rejected") ? "rejected" :
                        currentState.Contains("verified") ? "verified" :
                        "pending";

                    var fileName = !string.IsNullOrWhiteSpace(d.FilePath) ? Path.GetFileName(d.FilePath) : string.Empty;

                    return new
                    {
                        id = d.Id,
                        patientId = d.PatientId,
                        doctorId = (string?)null,
                        name = fileName,
                        type,
                        fileName = fileName,
                        fileUrl = d.FilePath,
                        size = (long?)null,
                        uploadedAt = d.UploadedAt,
                        createdAt = d.UploadedAt,
                        verificationStatus,
                        verifiedBy = (string?)null,
                        verifiedAt = (DateTime?)null,

                        // Keep old/extra fields for compatibility
                        PatientName = d.PatientName,
                        DocumentType = d.DocumentType,
                        FilePath = d.FilePath,
                        CurrentState = d.CurrentState
                    };
                }).ToList();

                if (!docs.Any()) return Ok(new { Message = "No documents found.", Data = docs, Total = total });
                return Ok(new { Message = "Documents retrieved successfully.", Data = docs, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving documents.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // 8. NOTIFICATION MANAGEMENT (Added from Scope Notification Module)
        // ────────────────────────────────────────────────
        [HttpGet("notifications")]
        public async Task<IActionResult> GetNotifications(int page = 1, int pageSize = 50)
        {
            try
            {
                var query = _context.Notifications.Include(n => n.MedicalRecord).ThenInclude(m => m.Patient);
                var total = await query.CountAsync();
                var notifications = await query.OrderByDescending(n => n.SentAt).Skip((page - 1) * pageSize).Take(pageSize)
                    .Select(n => new
                    {
                        n.Id,
                        PatientName = n.MedicalRecord.Patient.FullName,
                        n.Message,
                        n.Channel,
                        n.SentAt,
                        n.IsRead
                    }).ToListAsync();
                if (!notifications.Any()) return Ok(new { Message = "No notifications found.", Data = notifications, Total = total });
                return Ok(new { Message = "Notifications retrieved successfully.", Data = notifications, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving notifications.", Error = ex.Message });
            }
        }
        [HttpPost("notifications")]
        public async Task<IActionResult> SendNotification([FromBody] SendNotificationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var record = await _context.MedicalRecords.FindAsync(dto.MedicalRecordId);
                if (record == null) return NotFound(new { Message = "Medical record not found." });
                var notification = new Notification
                {
                    MedicalRecordId = dto.MedicalRecordId,
                    Message = dto.Message,
                    Channel = dto.Channel
                };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
                // Stub send (console; replace with real push/email/SMS)
                Console.WriteLine($"Notification sent via {dto.Channel}: {dto.Message}");
                return Ok(new { Message = "Notification sent successfully.", NotificationId = notification.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while sending notification.", Error = ex.Message });
            }
        }
        [HttpPut("notifications/{id}/read")]
        public async Task<IActionResult> MarkNotificationAsRead(string id)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(id);
                if (notification == null) return NotFound(new { Message = "Notification not found." });
                notification.IsRead = true;
                await _context.SaveChangesAsync();
                return Ok(new { Message = $"Notification ID {id} marked as read." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while marking notification as read.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // 9. AI RESULTS MANAGEMENT (Added from Scope AI Processing Module - admin approval)
        // ────────────────────────────────────────────────
        [HttpGet("ai-results")]
        public async Task<IActionResult> GetAIResults(int page = 1, int pageSize = 50)
        {
            try
            {
                var query = _context.AIResults.Include(a => a.Document).ThenInclude(d => d.Patient);
                var total = await query.CountAsync();
                var results = await query.OrderByDescending(a => a.ApprovedAt).Skip((page - 1) * pageSize).Take(pageSize)
                    .Select(a => new
                    {
                        a.Id,
                        PatientName = a.Document.Patient.FullName,
                        a.DocumentId,
                        a.ExtractedText,
                        a.ConfidenceScore,
                        a.Findings,
                        a.IsApproved,
                        a.ApprovedByDoctorId,
                        a.ApprovedAt
                    }).ToListAsync();
                if (!results.Any()) return Ok(new { Message = "No AI results found.", Data = results, Total = total });
                return Ok(new { Message = "AI results retrieved successfully.", Data = results, Total = total });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving AI results.", Error = ex.Message });
            }
        }
        [HttpPut("ai-results/{id}/approve")]
        public async Task<IActionResult> ApproveAIResult(string id, [FromBody] ApproveAIResultDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var aiResult = await _context.AIResults.FindAsync(id);
                if (aiResult == null) return NotFound(new { Message = "AI result not found." });
                aiResult.IsApproved = true;
                aiResult.ApprovedByDoctorId = dto.ApprovedByDoctorId;
                aiResult.ApprovedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok(new { Message = $"AI result ID {id} approved successfully by doctor ID {dto.ApprovedByDoctorId}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while approving AI result.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // 10. ADMIN PROFILE MANAGEMENT (Added as per request - View/Update)
        // ────────────────────────────────────────────────
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var admin = await _userManager.FindByIdAsync(adminId);
                if (admin == null || admin.Role != "Admin")
                    return NotFound(new { Message = "Admin profile not found." });

                return Ok(new
                {
                    Message = "Admin profile retrieved successfully.",
                    Data = new
                    {
                        admin.Id,
                        admin.FullName,
                        admin.Email,
                        admin.PhoneNumber,
                        admin.CNIC,
                        admin.City,
                        admin.Province,
                        admin.DateOfBirth,
                        admin.Gender,
                        admin.HospitalId
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while retrieving admin profile.", Error = ex.Message });
            }
        }
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminId))
                    return Unauthorized(new { Message = "Invalid authentication token." });

                var admin = await _userManager.FindByIdAsync(adminId);
                if (admin == null || admin.Role != "Admin")
                    return NotFound(new { Message = "Admin profile not found." });

                if (dto.FullName != null) admin.FullName = dto.FullName;
                if (dto.PhoneNumber != null) admin.PhoneNumber = dto.PhoneNumber;
                if (dto.City != null) admin.City = dto.City;
                if (dto.Province != null) admin.Province = dto.Province;
                if (dto.DateOfBirth.HasValue) admin.DateOfBirth = dto.DateOfBirth.Value;
                if (dto.Gender != null) admin.Gender = dto.Gender;

                var result = await _userManager.UpdateAsync(admin);
                if (!result.Succeeded)
                    return BadRequest(new { Message = "Admin profile update failed.", Errors = result.Errors.Select(e => e.Description) });

                return Ok(new { Message = "Admin profile updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while updating admin profile.", Error = ex.Message });
            }
        }

        // ────────────────────────────────────────────────
        // Missing Admin APIs (from BACKEND_API_GAPS_FOR_ENGINEERING)
        // ────────────────────────────────────────────────

        public sealed class VerifyDoctorRequest
        {
            public bool Verified { get; set; }
        }

        public sealed class UpdateUserRoleRequest
        {
            public string Role { get; set; } = string.Empty; // admin | doctor | patient
        }

        // PUT /api/admin/doctors/{id}/verify
        [HttpPut("doctors/{id}/verify")]
        public async Task<IActionResult> VerifyDoctor(string id, [FromBody] VerifyDoctorRequest request)
        {
            if (string.IsNullOrWhiteSpace(id)) return BadRequest(new { Message = "Doctor id is required." });

            // Best-effort in-memory status (authorization is not affected).
            UserStatusStore[id] = request.Verified ? "verified" : "rejected";

            return Ok(new { Message = "Doctor verification updated successfully.", Data = new { id, verified = request.Verified } });
        }

        // GET /api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var usersRaw = await _context.Users
                .Select(u => new
                {
                    id = u.Id,
                    name = u.FullName,
                    email = u.Email,
                    role = (u.Role ?? string.Empty).ToLowerInvariant(),
                    createdAt = u.LastActivity,
                    updatedAt = u.LastActivity
                })
                .ToListAsync();

            var users = usersRaw.Select(u => new
            {
                u.id,
                u.name,
                u.email,
                u.role,
                status = UserStatusStore.TryGetValue(u.id, out var storedStatus) ? storedStatus : "pending",
                u.createdAt,
                u.updatedAt
            }).ToList();

            return Ok(new { Message = "Users retrieved successfully.", Data = users, Total = users.Count });
        }

        // PUT /api/admin/users/{id}/approve
        [HttpPut("users/{id}/approve")]
        public async Task<IActionResult> ApproveUser(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return BadRequest(new { Message = "User id is required." });
            UserStatusStore[id] = "approved";
            return Ok(new { Message = "User approved successfully." });
        }

        // PUT /api/admin/users/{id}/reject
        [HttpPut("users/{id}/reject")]
        public async Task<IActionResult> RejectUser(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return BadRequest(new { Message = "User id is required." });
            UserStatusStore[id] = "rejected";
            return Ok(new { Message = "User rejected successfully." });
        }

        // PUT /api/admin/users/{id}/role
        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(string id, [FromBody] UpdateUserRoleRequest request)
        {
            if (string.IsNullOrWhiteSpace(id)) return BadRequest(new { Message = "User id is required." });
            if (string.IsNullOrWhiteSpace(request.Role)) return BadRequest(new { Message = "Role is required." });

            var normalized = request.Role.Trim().ToLowerInvariant();
            var identityRole =
                normalized == "admin" ? "Admin" :
                normalized == "doctor" ? "Doctor" :
                normalized == "patient" ? "Patient" :
                null;

            if (identityRole == null)
                return BadRequest(new { Message = "Invalid role. Expected admin|doctor|patient." });

            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound(new { Message = "User not found." });

            // Sync both the persisted ApplicationUser.Role field and Identity role claims.
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Any())
                await _userManager.RemoveFromRolesAsync(user, currentRoles);

            user.Role = identityRole;
            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                return BadRequest(new { Message = "User role update failed.", Errors = updateResult.Errors.Select(e => e.Description) });

            var addResult = await _userManager.AddToRoleAsync(user, identityRole);
            if (!addResult.Succeeded)
                return BadRequest(new { Message = "Failed to assign Identity role.", Errors = addResult.Errors.Select(e => e.Description) });

            // Keep status workflow: after a role change, treat it as pending again.
            UserStatusStore[id] = "pending";

            return Ok(new { Message = "User role updated successfully.", Data = new { id, role = normalized } });
        }

        // GET /api/admin/logs
        [HttpGet("logs")]
        public async Task<IActionResult> GetLogs(int limit = 100)
        {
            return Ok(new { Message = "Logs retrieved successfully.", Data = new object[0], Total = 0 });
        }

        // GET /api/admin/logs/errors
        [HttpGet("logs/errors")]
        public async Task<IActionResult> GetErrorLogs(int limit = 100)
        {
            return Ok(new { Message = "Error logs retrieved successfully.", Data = new object[0], Total = 0 });
        }

        // GET /api/admin/performance
        [HttpGet("performance")]
        public async Task<IActionResult> GetPerformance()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalDocuments = await _context.Documents.CountAsync();

            // Placeholder metrics.
            var performance = new
            {
                avgResponseTimeMs = 0,
                systemUptime = 100,
                activeUsers = totalUsers,
                dataStorage = totalDocuments
            };

            return Ok(new { Message = "Performance retrieved successfully.", Data = performance });
        }

        // GET /api/admin/integrations
        [HttpGet("integrations")]
        public async Task<IActionResult> GetIntegrations()
        {
            var integrations = IntegrationsStore.Values.OrderByDescending(i => i.LastSync).ToList();
            return Ok(new { Message = "Integrations retrieved successfully.", Data = integrations, Total = integrations.Count });
        }

        // POST /api/admin/integrations
        [HttpPost("integrations")]
        public async Task<IActionResult> CreateIntegration([FromBody] IntegrationItem dto)
        {
            if (dto == null) return BadRequest(new { Message = "Integration payload is required." });

            var item = new IntegrationItem
            {
                Id = string.IsNullOrWhiteSpace(dto.Id) ? Guid.NewGuid().ToString() : dto.Id,
                Name = dto.Name,
                Type = dto.Type,
                Endpoint = dto.Endpoint,
                Status = dto.Status,
                LastSync = DateTime.UtcNow
            };

            IntegrationsStore[item.Id] = item;
            return Ok(new { Message = "Integration created successfully.", Data = item });
        }

        // PUT /api/admin/integrations/{id}
        [HttpPut("integrations/{id}")]
        public async Task<IActionResult> UpdateIntegration(string id, [FromBody] IntegrationItem dto)
        {
            if (string.IsNullOrWhiteSpace(id)) return BadRequest(new { Message = "Integration id is required." });

            var existing = IntegrationsStore.ContainsKey(id) ? IntegrationsStore[id] : null;
            if (existing == null)
                return NotFound(new { Message = "Integration not found." });

            existing.Name = dto.Name;
            existing.Type = dto.Type;
            existing.Endpoint = dto.Endpoint;
            existing.Status = dto.Status;
            existing.LastSync = DateTime.UtcNow;

            IntegrationsStore[id] = existing;
            return Ok(new { Message = "Integration updated successfully.", Data = existing });
        }

        // DELETE /api/admin/integrations/{id}
        [HttpDelete("integrations/{id}")]
        public async Task<IActionResult> DeleteIntegration(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return BadRequest(new { Message = "Integration id is required." });
            IntegrationsStore.TryRemove(id, out _);
            return Ok(new { Message = "Integration deleted successfully." });
        }

        // GET /api/admin/repository
        [HttpGet("repository")]
        public async Task<IActionResult> GetRepository()
        {
            var items = await _context.RepositoryItems.OrderByDescending(i => i.UploadedAt).ToListAsync();
            return Ok(new { Message = "Repository items retrieved successfully.", Data = items, Total = items.Count });
        }

        // POST /api/admin/repository/upload
        [HttpPost("repository/upload")]
        public async Task<IActionResult> UploadRepositoryItem(Microsoft.AspNetCore.Http.IFormFile file, string? name = null, string? type = null)
        {
            if (file == null || file.Length == 0) return BadRequest(new { Message = "File is required." });

            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "repository");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var item = new Medrotic.Api.Models.RepositoryItem
            {
                Id = Guid.NewGuid().ToString(),
                Name = string.IsNullOrWhiteSpace(name) ? file.FileName : name,
                Type = string.IsNullOrWhiteSpace(type) ? "document" : type,
                Size = file.Length,
                UploadedAt = DateTime.UtcNow,
                UploadedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty,
                FilePath = $"/uploads/repository/{fileName}"
            };

            _context.RepositoryItems.Add(item);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Repository item uploaded successfully.", Data = item });
        }

        // DELETE /api/admin/repository/{id}
        [HttpDelete("repository/{id}")]
        public async Task<IActionResult> DeleteRepositoryItem(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return BadRequest(new { Message = "Repository item id is required." });
            
            var item = await _context.RepositoryItems.FindAsync(id);
            if (item == null) return NotFound(new { Message = "Repository item not found." });

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", item.FilePath.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            _context.RepositoryItems.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Repository item deleted successfully." });
        }

        // GET /api/admin/analytics/kpis
        [HttpGet("analytics/kpis")]
        public async Task<IActionResult> GetKpis()
        {
            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.CountAsync(u => u.LastActivity > DateTime.UtcNow.AddMonths(-1));
            var totalDocuments = await _context.Documents.CountAsync();

            var kpis = new
            {
                avgResponseTime = 0,
                systemUptime = 100,
                activeUsers = activeUsers,
                dataStorage = totalDocuments
            };

            return Ok(new { Message = "KPIs retrieved successfully.", Data = kpis });
        }
    }
}