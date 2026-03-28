using Medrotic.Api.Data;
using Medrotic.Api.Models;
using Medrotic.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Medrotic API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Description = "API Key needed to access the AI/RAG endpoints.",
        In = ParameterLocation.Header,
        Name = "X-API-KEY",
        Type = SecuritySchemeType.ApiKey
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        },
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "ApiKey" }
            },
            Array.Empty<string>()
        }
    });
});

// Database Configuration
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 6;
    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
    // User settings
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Register TokenService
builder.Services.AddScoped<ITokenService, TokenService>();

// In-memory system logs for admin dashboard (System Health)
builder.Services.AddSingleton<ISystemLogStore, SystemLogStore>();

// Register AI Service
builder.Services.AddHttpClient<IAIService, AIService>();

// Add IWebHostEnvironment – FIXED: Correct place (before Build())
builder.Services.AddSingleton<IWebHostEnvironment>(builder.Environment);

// CORS for Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// JWT Authentication – MAX DEBUGGING
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = false, // Disabled for dev
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        RoleClaimType = ClaimTypes.Role // Standard Microsoft role claim
    };
    // EXTREME LOGGING – will show EVERYTHING
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("JWT Message received. Token: {Token}", context.Token);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("JWT Token VALIDATED successfully. User: {User}, Roles: {Roles}",
                context.Principal?.Identity?.Name,
                string.Join(", ", context.Principal?.FindAll(ClaimTypes.Role)?.Select(c => c.Value) ?? new string[0]));
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(context.Exception, "JWT Authentication FAILED: {Message}", context.Exception.Message);
            if (context.Exception.InnerException != null)
            {
                logger.LogError(context.Exception.InnerException, "Inner exception: {Message}", context.Exception.InnerException.Message);
            }
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("JWT Challenge: Error={Error}, Description={Description}", context.Error, context.ErrorDescription);
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAngular");
app.UseAuthentication(); // This must come before UseAuthorization
app.UseAuthorization();
app.MapControllers();

try
{
    app.Services.GetRequiredService<ISystemLogStore>()
        .Add("info", "Medrotic API is running.", "System");
}
catch
{
    // ignore if DI not ready in edge test hosts
}

// Seed the database with roles and admin user
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        await context.Database.MigrateAsync();
        // Seed roles if they don't exist
        string[] roleNames = { "Admin", "Doctor", "Patient" };
        foreach (var roleName in roleNames)
        {
            var roleExist = await roleManager.RoleExistsAsync(roleName);
            if (!roleExist)
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }
        // Check if admin exists, create if not
        var adminEmail = "admin@medrotic.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Default Admin",
                Role = "Admin",
                CNIC = "3520212345671",
                City = "Sahiwal",
                Province = "Punjab",
                PhoneNumber = "03001234567",
                DateOfBirth = new DateTime(1980, 1, 1),
                Gender = "Male",
                AccountVerificationStatus = "verified"
            };
            var result = await userManager.CreateAsync(admin, "Admin@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
            }
        }

        // Seed default doctor if missing
        var doctorEmail = "doctor@medrotic.com";
        var doctorUser = await userManager.FindByEmailAsync(doctorEmail);
        if (doctorUser == null)
        {
            var doctor = new ApplicationUser
            {
                UserName = doctorEmail,
                Email = doctorEmail,
                FullName = "Default Doctor",
                Role = "Doctor",
                CNIC = "3520212345672",
                Specialty = "General Medicine",
                ExperienceYears = 5,
                City = "Sahiwal",
                Province = "Punjab",
                PhoneNumber = "03001234568",
                DateOfBirth = new DateTime(1985, 1, 1),
                Gender = "Male",
                HospitalId = null,
                AccountVerificationStatus = "verified"
            };

            var result = await userManager.CreateAsync(doctor, "Doctor@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(doctor, "Doctor");
            }
        }

        // Seed default patient if missing
        var patientEmail = "patient@medrotic.com";
        var patientUser = await userManager.FindByEmailAsync(patientEmail);
        if (patientUser == null)
        {
            var patient = new ApplicationUser
            {
                UserName = patientEmail,
                Email = patientEmail,
                FullName = "Default Patient",
                Role = "Patient",
                CNIC = "3520212345673",
                City = "Sahiwal",
                Province = "Punjab",
                PhoneNumber = "03001234569",
                DateOfBirth = new DateTime(1990, 1, 1),
                Gender = "Male",
                HospitalId = null,
                AccountVerificationStatus = "verified"
            };

            var result = await userManager.CreateAsync(patient, "Patient@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(patient, "Patient");
            }
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}
app.Run();