using Medrotic.Api.DTOs;
using Medrotic.API.Data; // Added for AppDbContext
using Medrotic.API.DTOs;
using Medrotic.API.Models;
using Medrotic.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // For DB queries
using System.Security.Claims;

namespace Medrotic.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly AppDbContext _context; // Added

        public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, ITokenService tokenService, AppDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _context = context;
        }

        // Public: Patient self-signup
        [HttpPost("register-patient")]
        public async Task<IActionResult> RegisterPatient([FromBody] RegisterPatientDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (await _userManager.FindByEmailAsync(dto.Email) != null)
                return BadRequest(new { Message = "Email already registered." });

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                CNIC = dto.CNIC,
                Role = "Patient",
                City = dto.City,
                Province = dto.Province,
                PhoneNumber = dto.PhoneNumber,
                DateOfBirth = dto.DateOfBirth,
                Gender = dto.Gender
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(new { Message = string.Join(", ", result.Errors.Select(e => e.Description)) });

            await _userManager.AddToRoleAsync(user, "Patient");
            return Ok(new { Message = "Patient registered successfully." });
        }

        // Protected: Admin adds doctor or admin
        [Authorize(Roles = "Admin")]
        [HttpPost("add-user")]
        public async Task<IActionResult> AddUser([FromBody] RegisterUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (dto.Role == "Doctor" && (string.IsNullOrEmpty(dto.Specialty) || dto.ExperienceYears == null))
                return BadRequest(new { Message = "Specialty and experience required for doctors." });

            if (await _userManager.FindByEmailAsync(dto.Email) != null)
                return BadRequest(new { Message = "Email already registered." });

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                Role = dto.Role,
                Specialty = dto.Role == "Doctor" ? dto.Specialty : null,
                ExperienceYears = dto.Role == "Doctor" ? dto.ExperienceYears : null,
                City = dto.City,
                Province = dto.Province,
                PhoneNumber = dto.PhoneNumber,
                DateOfBirth = (DateTime)dto.DateOfBirth,
                Gender = dto.Gender
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return BadRequest(new { Message = string.Join(", ", result.Errors.Select(e => e.Description)) });

            await _userManager.AddToRoleAsync(user, dto.Role);
            return Ok(new { Message = $"{dto.Role} added successfully." });
        }

        // Public: Login for all roles
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) return Unauthorized(new { Message = "Invalid email or password." });

            var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
            if (!result.Succeeded) return Unauthorized(new { Message = "Invalid email or password." });

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? user.Role;

            var token = _tokenService.CreateToken(user, role);

            return Ok(new UserResponseDto { Token = token, Role = role, FullName = user.FullName });
        }

        // Public: Forget password (generates OTP and stores in DB)
        [HttpPost("forget-password")]
        public async Task<IActionResult> ForgetPassword([FromBody] ForgetPasswordDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) return BadRequest(new { Message = "Email not found." });

            // Generate OTP
            var otp = new Random().Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.AddMinutes(10);

            var otpEntity = new Otp
            {
                UserId = user.Id,
                Code = otp,
                Expiry = expiry
            };

            _context.Otps.Add(otpEntity);
            await _context.SaveChangesAsync();

            // Stub "send" OTP (console log; replace with email service)
            Console.WriteLine($"OTP for {dto.Email}: {otp} (expires in 10 min)");

            return Ok(new { Message = "OTP sent to your email." });
        }

        // Public: Verify OTP (checks DB, marks as used, generates Identity reset token)
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            var otp = await _context.Otps
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.User.Email == dto.Email && o.Code == dto.Otp && !o.IsUsed && o.Expiry > DateTime.UtcNow);

            if (otp == null) return BadRequest(new { Message = "Invalid or expired OTP." });

            otp.IsUsed = true;
            await _context.SaveChangesAsync();

            // Generate Identity reset token
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(otp.User);

            return Ok(new { Message = "OTP verified.", Token = resetToken });
        }

        // Public: Reset password (validates Identity token)
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) return BadRequest(new { Message = "Email not found." });

            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
            if (!result.Succeeded)
                return BadRequest(new { Message = string.Join(", ", result.Errors.Select(e => e.Description)) });

            // Clean up used OTPs for this user
            var usedOtps = await _context.Otps.Where(o => o.UserId == user.Id && o.IsUsed).ToListAsync();
            _context.Otps.RemoveRange(usedOtps);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Password reset successfully." });
        }

        // Public: Resend OTP (invalidates old, generates new)
        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp([FromBody] ForgetPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) return BadRequest(new { Message = "Email not found." });

            // Invalidate old unused OTPs
            var oldOtps = await _context.Otps.Where(o => o.UserId == user.Id && !o.IsUsed).ToListAsync();
            _context.Otps.RemoveRange(oldOtps);
            await _context.SaveChangesAsync();

            // Generate new OTP
            var otp = new Random().Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.AddMinutes(10);

            var otpEntity = new Otp
            {
                UserId = user.Id,
                Code = otp,
                Expiry = expiry
            };

            _context.Otps.Add(otpEntity);
            await _context.SaveChangesAsync();

            Console.WriteLine($"New OTP for {dto.Email}: {otp} (expires in 10 min)");

            return Ok(new { Message = "New OTP sent to your email." });
        }

        // Test endpoints for roles (to verify in Swagger)
        [Authorize(Roles = "Admin")]
        [HttpGet("test-admin")]
        public IActionResult TestAdmin()
        {
            return Ok(new { Message = "Admin access granted." });
        }

        [Authorize(Roles = "Doctor")]
        [HttpGet("test-doctor")]
        public IActionResult TestDoctor()
        {
            return Ok(new { Message = "Doctor access granted." });
        }

        [Authorize(Roles = "Patient")]
        [HttpGet("test-patient")]
        public IActionResult TestPatient()
        {
            return Ok(new { Message = "Patient access granted." });
        }
    }
}