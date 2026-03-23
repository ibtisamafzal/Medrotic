using Medrotic.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Medrotic.Api.Controllers
{
    [Route("api/users")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UsersController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound(new { Message = "User not found." });

            return Ok(new
            {
                Message = "User retrieved successfully.",
                Data = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.PhoneNumber,
                    user.CNIC,
                    user.City,
                    user.Province,
                    user.Gender,
                    user.DateOfBirth,
                    user.Role,
                    user.Specialty,
                    user.ExperienceYears,
                    user.HospitalId
                }
            });
        }
    }
}

