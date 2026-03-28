using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Medrotic.Api.Models;
using System;

namespace Medrotic.Api.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public DbSet<Otp> Otps { get; set; }
        public DbSet<Hospital> Hospitals { get; set; }
        public DbSet<MedicalRecord> MedicalRecords { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<AIResult> AIResults { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Appointment> Appointments { get; set; }  // New for doctor-patient appointments
        public DbSet<RepositoryItem> RepositoryItems { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Indexes for performance (non-functional req)
            builder.Entity<ApplicationUser>()
                .HasIndex(u => u.Email).IsUnique();
            builder.Entity<ApplicationUser>()
                .HasIndex(u => u.CNIC).IsUnique();
            builder.Entity<ApplicationUser>()
                .HasIndex(u => u.HospitalId);

            // Seeding (your code - unchanged)
            var adminRoleId = "admin-role-id";
            var doctorRoleId = "doctor-role-id";
            var patientRoleId = "patient-role-id";
            builder.Entity<IdentityRole>().HasData(
                new IdentityRole { Id = adminRoleId, Name = "Admin", NormalizedName = "ADMIN" },
                new IdentityRole { Id = doctorRoleId, Name = "Doctor", NormalizedName = "DOCTOR" },
                new IdentityRole { Id = patientRoleId, Name = "Patient", NormalizedName = "PATIENT" }
            );
            var hospitalId = "hospital-id-1";
            builder.Entity<Hospital>().HasData(
                new Hospital
                {
                    Id = hospitalId,
                    Name = "COMSATS Sahiwal Hospital",
                    Address = "COMSATS Road, off GT Road",
                    City = "Sahiwal",
                    Province = "Punjab",
                    ContactNumber = "040-4305000",
                    Email = "info@medrotic.com"
                }
            );
            var adminId = "admin-id-1";
            var admin = new ApplicationUser
            {
                Id = adminId,
                UserName = "admin@medrotic.com",
                NormalizedUserName = "ADMIN@MEDROTIC.COM",
                Email = "admin@medrotic.com",
                NormalizedEmail = "ADMIN@MEDROTIC.COM",
                FullName = "System Administrator",
                Role = "Admin",
                CNIC = "35202-1234567-1",
                City = "Sahiwal",
                Province = "Punjab",
                PhoneNumber = "03001234567",
                DateOfBirth = new DateTime(1985, 5, 15),
                Gender = "Male",
                HospitalId = hospitalId,
                LastActivity = DateTime.UtcNow,
                AccountVerificationStatus = "verified"
            };
            var hasher = new PasswordHasher<ApplicationUser>();
            admin.PasswordHash = hasher.HashPassword(admin, "Admin@123");
            builder.Entity<ApplicationUser>().HasData(admin);
            var doctorId = "doctor-id-1";
            var doctor = new ApplicationUser
            {
                Id = doctorId,
                UserName = "doctor@medrotic.com",
                NormalizedUserName = "DOCTOR@MEDROTIC.COM",
                Email = "doctor@medrotic.com",
                NormalizedEmail = "DOCTOR@MEDROTIC.COM",
                FullName = "Dr. Ahmed Khan",
                Role = "Doctor",
                Specialty = "Cardiology",
                ExperienceYears = 8,
                CNIC = "35202-7654321-9",
                City = "Sahiwal",
                Province = "Punjab",
                PhoneNumber = "03007654321",
                DateOfBirth = new DateTime(1992, 3, 10),
                Gender = "Male",
                HospitalId = hospitalId,
                LastActivity = DateTime.UtcNow,
                AccountVerificationStatus = "verified"
            };
            doctor.PasswordHash = hasher.HashPassword(doctor, "Doctor@123");
            builder.Entity<ApplicationUser>().HasData(doctor);
            // Added seed for patient
            var patientId = "patient-id-1";
            var patient = new ApplicationUser
            {
                Id = patientId,
                UserName = "patient@medrotic.com",
                NormalizedUserName = "PATIENT@MEDROTIC.COM",
                Email = "patient@medrotic.com",
                NormalizedEmail = "PATIENT@MEDROTIC.COM",
                FullName = "Test Patient",
                Role = "Patient",
                CNIC = "35202-9876543-2",
                City = "Sahiwal",
                Province = "Punjab",
                PhoneNumber = "03009876543",
                DateOfBirth = new DateTime(2000, 1, 1),
                Gender = "Female",
                LastActivity = DateTime.UtcNow,
                AccountVerificationStatus = "verified"
            };
            patient.PasswordHash = hasher.HashPassword(patient, "Patient@123");
            builder.Entity<ApplicationUser>().HasData(patient);
            builder.Entity<IdentityUserRole<string>>().HasData(
                new IdentityUserRole<string> { RoleId = adminRoleId, UserId = adminId },
                new IdentityUserRole<string> { RoleId = doctorRoleId, UserId = doctorId },
                new IdentityUserRole<string> { RoleId = patientRoleId, UserId = patientId }
            );
            // Relationships (no changes)
            builder.Entity<ApplicationUser>()
                .HasOne(u => u.Hospital)
                .WithMany(h => h.Staff)
                .HasForeignKey(u => u.HospitalId)
                .OnDelete(DeleteBehavior.SetNull);
            builder.Entity<Otp>()
                .HasOne(o => o.User)
                .WithMany(u => u.Otps)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Entity<MedicalRecord>()
                .HasOne(m => m.Patient)
                .WithMany()
                .HasForeignKey(m => m.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Entity<MedicalRecord>()
                .HasOne(m => m.Doctor)
                .WithMany()
                .HasForeignKey(m => m.DoctorId)
                .OnDelete(DeleteBehavior.SetNull);  // Added
            builder.Entity<Document>()
                .HasOne(d => d.Patient)
                .WithMany()
                .HasForeignKey(d => d.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Entity<AIResult>()
                .HasOne(a => a.Document)
                .WithMany()
                .HasForeignKey(a => a.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Entity<Notification>()
                .HasOne(n => n.MedicalRecord)
                .WithMany()
                .HasForeignKey(n => n.MedicalRecordId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany()
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Entity<Appointment>()
                .HasOne(a => a.Doctor)
                .WithMany()
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);  // Added
        }
    }
}