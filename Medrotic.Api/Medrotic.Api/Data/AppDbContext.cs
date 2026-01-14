using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Medrotic.API.Models;
using Microsoft.AspNetCore.Identity;
using System;

namespace Medrotic.API.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public DbSet<Otp> Otps { get; set; } // Added for OTP

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Seed roles
            var adminRoleId = "admin-role-id";
            var doctorRoleId = "doctor-role-id";
            var patientRoleId = "patient-role-id";

            builder.Entity<IdentityRole>().HasData(
                new IdentityRole { Id = adminRoleId, Name = "Admin", NormalizedName = "ADMIN" },
                new IdentityRole { Id = doctorRoleId, Name = "Doctor", NormalizedName = "DOCTOR" },
                new IdentityRole { Id = patientRoleId, Name = "Patient", NormalizedName = "PATIENT" }
            );

            // Seed default Admin
            var adminId = "admin-id-1";
            var admin = new ApplicationUser
            {
                Id = adminId,
                UserName = "admin@medrotic.com",
                NormalizedUserName = "ADMIN@MEDROTIC.COM",
                Email = "admin@medrotic.com",
                NormalizedEmail = "ADMIN@MEDROTIC.COM",
                FullName = "Default Admin",
                Role = "Admin",
                CNIC = "35202-1234567-1",  // Added default CNIC
                City = "Sahiwal",
                Province = "Punjab",
                PhoneNumber = "03001234567",
                DateOfBirth = new DateTime(1980, 1, 1),
                Gender = "Male"
            };
            var hasher = new PasswordHasher<ApplicationUser>();
            admin.PasswordHash = hasher.HashPassword(admin, "Admin@123");
            builder.Entity<ApplicationUser>().HasData(admin);

            // Seed default Doctor
            var doctorId = "doctor-id-1";
            var doctor = new ApplicationUser
            {
                Id = doctorId,
                UserName = "doctor@medrotic.com",
                NormalizedUserName = "DOCTOR@MEDROTIC.COM",
                Email = "doctor@medrotic.com",
                NormalizedEmail = "DOCTOR@MEDROTIC.COM",
                FullName = "Default Doctor",
                Specialty = "General",
                ExperienceYears = 5,
                Role = "Doctor",
                CNIC = "35202-7654321-9",  // Added default CNIC
                City = "Sahiwal",
                Province = "Punjab",
                PhoneNumber = "03007654321",
                DateOfBirth = new DateTime(1990, 1, 1),
                Gender = "Male"
            };
            doctor.PasswordHash = hasher.HashPassword(doctor, "Doctor@123");
            builder.Entity<ApplicationUser>().HasData(doctor);

            // Assign roles to seeded users
            builder.Entity<IdentityUserRole<string>>().HasData(
                new IdentityUserRole<string> { RoleId = adminRoleId, UserId = adminId },
                new IdentityUserRole<string> { RoleId = doctorRoleId, UserId = doctorId }
            );

            // Configure OTP entity
            builder.Entity<Otp>()
                .HasOne(o => o.User)
                .WithMany(u => u.Otps)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}