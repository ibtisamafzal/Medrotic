using Medrotic.Api.Data;
using Medrotic.Api.DTOs;
using Medrotic.Api.Models;
using Medrotic.Api.Services;
using Medrotic.Api.Data;
using Medrotic.Api.DTOs;
using Medrotic.Api.Models;
using Medrotic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Medrotic.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly AppDbContext _context;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ITokenService tokenService,
            AppDbContext context)
        {
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _signInManager = signInManager ?? throw new ArgumentNullException(nameof(signInManager));
            _tokenService = tokenService ?? throw new ArgumentNullException(nameof(tokenService));
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        private static string NormalizeCnic(string? cnic)
        {
            if (string.IsNullOrWhiteSpace(cnic)) return string.Empty;
            return Regex.Replace(cnic, @"\D", "");
        }

        private async Task<ApplicationUser?> FindUserByIdentifierAsync(string? identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier)) return null;

            var input = identifier.Trim();
            var normalizedCnic = NormalizeCnic(input);

            if (!string.IsNullOrWhiteSpace(normalizedCnic) && normalizedCnic.Length == 13)
            {
                var byCnic = await _context.Users.FirstOrDefaultAsync(u => u.CNIC == normalizedCnic);
                if (byCnic != null) return byCnic;
            }

            if (input.Contains("@"))
            {
                var byEmail = await _userManager.FindByEmailAsync(input);
                if (byEmail != null) return byEmail;
            }

            var normalizedPhone = Regex.Replace(input, @"\s", "");
            return await _context.Users.FirstOrDefaultAsync(u =>
                u.PhoneNumber != null &&
                (
                    u.PhoneNumber == normalizedPhone ||
                    u.PhoneNumber.Replace(" ", "") == normalizedPhone
                ));
        }

        // ────────────────────────────────────────────────
        // Patient self-registration (public)
        // ────────────────────────────────────────────────
        [HttpPost("register-patient")]
        public async Task<IActionResult> RegisterPatient([FromBody] RegisterPatientDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var normalizedCnic = NormalizeCnic(dto.CNIC);
            if (normalizedCnic.Length != 13)
            {
                return BadRequest(new { Message = "CNIC must be exactly 13 digits." });
            }

            if (await _userManager.FindByEmailAsync(dto.Email) != null)
            {
                return BadRequest(new { Message = "Email is already registered." });
            }
            if (await _context.Users.AnyAsync(u => u.CNIC == normalizedCnic))
            {
                return BadRequest(new { Message = "CNIC is already registered." });
            }

            var user = new ApplicationUser
            {
                Id = normalizedCnic,
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName ?? string.Empty,
                CNIC = normalizedCnic,
                Role = "Patient",
                City = dto.City ?? string.Empty,
                Province = dto.Province ?? string.Empty,
                PhoneNumber = dto.PhoneNumber ?? string.Empty,
                DateOfBirth = dto.DateOfBirth,
                Gender = dto.Gender ?? string.Empty
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    Message = "Patient registration failed.",
                    Errors = result.Errors.Select(e => e.Description)
                });
            }

            await _userManager.AddToRoleAsync(user, "Patient");

            return Ok(new { Message = "Patient registered successfully. You can now log in." });
        }

        // ────────────────────────────────────────────────
        // Admin adds user (doctor or admin) – protected
        // ────────────────────────────────────────────────
        [Authorize(Roles = "Admin")]
        [HttpPost("add-user")]
        public async Task<IActionResult> AddUser([FromBody] RegisterUserDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (dto.Role == "Doctor" && (string.IsNullOrWhiteSpace(dto.Specialty) || !dto.ExperienceYears.HasValue))
            {
                return BadRequest(new { Message = "Specialty and experience years are required for doctors." });
            }

            if (await _userManager.FindByEmailAsync(dto.Email) != null)
            {
                return BadRequest(new { Message = "Email is already registered." });
            }
            var normalizedCnic = NormalizeCnic(dto.CNIC);
            if (normalizedCnic.Length != 13)
            {
                return BadRequest(new { Message = "CNIC must be exactly 13 digits." });
            }
            if (await _context.Users.AnyAsync(u => u.CNIC == normalizedCnic))
            {
                return BadRequest(new { Message = "CNIC is already registered." });
            }

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName ?? string.Empty,
                CNIC = normalizedCnic,
                Role = dto.Role,
                Specialty = dto.Role == "Doctor" ? dto.Specialty : null,
                ExperienceYears = dto.Role == "Doctor" ? dto.ExperienceYears : null,
                City = dto.City ?? string.Empty,
                Province = dto.Province ?? string.Empty,
                PhoneNumber = dto.PhoneNumber ?? string.Empty,
                DateOfBirth = dto.DateOfBirth ?? DateTime.UtcNow.AddYears(-30),
                Gender = dto.Gender ?? "Not Specified",
                HospitalId = dto.HospitalId
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    Message = $"{dto.Role} creation failed.",
                    Errors = result.Errors.Select(e => e.Description)
                });
            }

            await _userManager.AddToRoleAsync(user, dto.Role);

            return Ok(new { Message = $"{dto.Role} account created successfully." });
        }

        // ────────────────────────────────────────────────
        // Login – returns token + role + name (public)
        // ────────────────────────────────────────────────
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await FindUserByIdentifierAsync(dto.Identifier);
            if (user == null)
            {
                return Unauthorized(new { Message = "Invalid identifier or password." });
            }

            // Enable lockout on failure
            var signInResult = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);

            if (signInResult.IsLockedOut)
            {
                return Unauthorized(new { Message = "Account is locked out due to too many failed attempts. Try again later." });
            }

            if (!signInResult.Succeeded)
            {
                return Unauthorized(new { Message = "Invalid identifier or password." });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? user.Role ?? "Unknown";

            var token = _tokenService.CreateToken(user, role);

            return Ok(new UserResponseDto
            {
                Token = token,
                Role = role,
                FullName = user.FullName ?? string.Empty
            });
        }

        // ────────────────────────────────────────────────
        // Forget Password – generate OTP (public)
        // ────────────────────────────────────────────────
        [HttpPost("forget-password")]
        public async Task<IActionResult> ForgetPassword([FromBody] ForgetPasswordDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                return BadRequest(new { Message = "No account found with this email." });
            }

            // Invalidate old unused OTPs
            var oldOtps = await _context.Otps
                .Where(o => o.UserId == user.Id && !o.IsUsed)
                .ToListAsync();
            _context.Otps.RemoveRange(oldOtps);

            // Generate new OTP
            var otpCode = new Random().Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.AddMinutes(10);

            var otp = new Otp
            {
                UserId = user.Id,
                Code = otpCode,
                Expiry = expiry
            };

            _context.Otps.Add(otp);
            await _context.SaveChangesAsync();

            // TODO: Replace console with real email/SMS service (SendGrid, Twilio, etc.)
            Console.WriteLine($"[OTP] To {dto.Email}: {otpCode} (expires at {expiry:yyyy-MM-dd HH:mm:ss})");

            return Ok(new { Message = "OTP has been sent to your email." });
        }

        // ────────────────────────────────────────────────
        // Verify OTP (public)
        // ────────────────────────────────────────────────
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var otpRecord = await _context.Otps
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.User.Email == dto.Email &&
                                         o.Code == dto.Otp &&
                                         !o.IsUsed &&
                                         o.Expiry > DateTime.UtcNow);

            if (otpRecord == null)
            {
                return BadRequest(new { Message = "Invalid or expired OTP." });
            }

            otpRecord.IsUsed = true;
            await _context.SaveChangesAsync();

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(otpRecord.User);

            return Ok(new
            {
                Message = "OTP verified successfully. Use this token to reset your password.",
                ResetToken = resetToken
            });
        }

        // ────────────────────────────────────────────────
        // Reset Password (public)
        // ────────────────────────────────────────────────
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                return BadRequest(new { Message = "No account found with this email." });
            }

            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    Message = "Password reset failed.",
                    Errors = result.Errors.Select(e => e.Description)
                });
            }

            // Clean up used OTPs
            var usedOtps = await _context.Otps
                .Where(o => o.UserId == user.Id && o.IsUsed)
                .ToListAsync();

            _context.Otps.RemoveRange(usedOtps);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Password has been reset successfully. You can now log in with the new password." });
        }

        // ────────────────────────────────────────────────
        // Resend OTP (public)
        // ────────────────────────────────────────────────
        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp([FromBody] ForgetPasswordDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                return BadRequest(new { Message = "No account found with this email." });
            }

            // Remove old unused OTPs
            var oldOtps = await _context.Otps
                .Where(o => o.UserId == user.Id && !o.IsUsed)
                .ToListAsync();

            _context.Otps.RemoveRange(oldOtps);
            await _context.SaveChangesAsync();

            // Generate new OTP
            var newOtpCode = new Random().Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.AddMinutes(10);

            var newOtp = new Otp
            {
                UserId = user.Id,
                Code = newOtpCode,
                Expiry = expiry
            };

            _context.Otps.Add(newOtp);
            await _context.SaveChangesAsync();

            // TODO: Replace with real email/SMS
            Console.WriteLine($"[RESEND OTP] To {dto.Email}: {newOtpCode} (expires at {expiry:yyyy-MM-dd HH:mm:ss})");

            return Ok(new { Message = "New OTP has been sent to your email." });
        }

        // ────────────────────────────────────────────────
        // Role test endpoints (for debugging in Swagger)
        // ────────────────────────────────────────────────
        [Authorize(Roles = "Admin")]
        [HttpGet("test-admin")]
        public IActionResult TestAdmin() => Ok(new { Message = "Admin access granted successfully." });

        [Authorize(Roles = "Doctor")]
        [HttpGet("test-doctor")]
        public IActionResult TestDoctor() => Ok(new { Message = "Doctor access granted successfully." });

        [Authorize(Roles = "Patient")]
        [HttpGet("test-patient")]
        public IActionResult TestPatient() => Ok(new { Message = "Patient access granted successfully." });
    }
}