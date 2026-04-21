// Program.cs - Application Entry Point
// This is where the .NET Core application starts. It configures:
// 1. Database connection (SQL Server via Entity Framework)
// 2. JWT authentication for secure API access
// 3. CORS policy so React frontend can communicate with this API
// 4. Dependency Injection - registering our services (Auth, AI, Scoring)
// 5. Swagger for API documentation and testing

using System.Text;
using AspNetCoreRateLimit;
using InterviewHub.API.Data;
using InterviewHub.API.Services.Candidate;
using InterviewHub.API.Services.Admin;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container

// Database Context - PostgreSQL with Npgsql
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero // Remove default 5 minute tolerance
    };
    
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            if (context.Exception is SecurityTokenExpiredException)
            {
                context.Response.Headers.Append("Token-Expired", "true");
            }
            return Task.CompletedTask;
        }
    };
});

// Authorization - simplified for user-only access
builder.Services.AddAuthorization();

// Rate Limiting
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddInMemoryRateLimiting();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

// CORS - Allow React frontend from different origins
// localhost for normal dev, network IP for VS Code browser opening
// In production set the FRONTEND_URL environment variable in Railway dashboard
var frontendUrl = builder.Configuration["FrontendUrl"]
    ?? Environment.GetEnvironmentVariable("FRONTEND_URL")
    ?? "";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = new List<string>
        {
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://172.23.48.1:3000"
        };

        // Add production frontend URL if configured
        if (!string.IsNullOrWhiteSpace(frontendUrl))
            allowedOrigins.Add(frontendUrl.TrimEnd('/'));

        policy.WithOrigins(allowedOrigins.ToArray())
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Register Application Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJobEmailParserService, JobEmailParserService>();
builder.Services.AddScoped<IGeminiAIService, GeminiAIService>();
builder.Services.AddScoped<IScoringService, ScoringService>();
builder.Services.AddScoped<IQuestionService, QuestionService>();

// Admin Services
builder.Services.AddScoped<IAdminAuthService, AdminAuthService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IJobEmailManagementService, JobEmailManagementService>();
builder.Services.AddScoped<ISkillManagementService, SkillManagementService>();
builder.Services.AddScoped<IQuestionManagementService, QuestionManagementService>();
builder.Services.AddScoped<ISessionMonitoringService, SessionMonitoringService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IContentModerationService, ContentModerationService>();
builder.Services.AddScoped<ISettingsService, SettingsService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

// Controllers
builder.Services.AddControllers();

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "InterviewHub API",
        Version = "v1",
        Description = "Authentication API for InterviewHub platform"
    });

    // Add JWT Authentication to Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline

// Enable Swagger in all environments (useful for Railway production testing)
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "InterviewHub API v1");
    options.RoutePrefix = "swagger";
});

// Rate limiting middleware
app.UseIpRateLimiting();

// CORS - must be before authentication
app.UseCors("AllowFrontend");

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Auto-migrate database and seed on startup (runs in all environments)
// In production (Railway) this ensures the DB schema is always up to date
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var startupLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        startupLogger.LogInformation("Creating/verifying database schema...");
        // EnsureCreated creates all tables from the model if they don't exist.
        // This bypasses SQL Server-specific migrations and works with any provider.
        dbContext.Database.EnsureCreated();
        startupLogger.LogInformation("Database schema ready.");

        // Seed admin user if not present
        var adminEmail = "admin@interviewhub.com";
        var adminUser = dbContext.Users.FirstOrDefault(u => u.Email == adminEmail);
        if (adminUser == null)
        {
            adminUser = new InterviewHub.API.Models.User
            {
                Email = adminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", workFactor: 12),
                FirstName = "Admin",
                LastName = "User",
                Role = InterviewHub.API.Models.UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(adminUser);
            dbContext.SaveChanges();
            startupLogger.LogInformation("Admin user seeded.");
        }
        else
        {
            // Ensure admin has correct role and active status
            adminUser.Role = InterviewHub.API.Models.UserRole.Admin;
            adminUser.IsActive = true;
            dbContext.SaveChanges();
        }

        // Seed default system settings if none exist
        if (!dbContext.SystemSettings.Any())
        {
            dbContext.SystemSettings.AddRange(InterviewHub.API.Services.Admin.SettingsService.GetDefaultSettings());
            dbContext.SaveChanges();
            startupLogger.LogInformation("Default system settings seeded.");
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during database migration/seeding.");
        // Don't crash the app — it may still work if DB is already up to date
    }
}

// Bind to Railway's injected PORT (falls back to 8080 locally)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");
