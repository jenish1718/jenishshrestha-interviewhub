/*
 * AdminAuthService.cs - Admin Authentication Service
 * Handles admin login, password change, token validation, and audit logging.
 * Only allows users with Admin role to authenticate through admin endpoints.
 */

using InterviewHub.API.Data;
using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Models;
using InterviewHub.API.Services.Candidate;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Services.Admin;

public class AdminAuthService : IAdminAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;

    public AdminAuthService(ApplicationDbContext context, IJwtService jwtService, IConfiguration configuration)
    {
        _context = context;
        _jwtService = jwtService;
        _configuration = configuration;
    }

    // Authenticates admin users only — rejects candidates
    public async Task<AdminLoginResponseDto> LoginAsync(AdminLoginRequestDto request, string? ipAddress)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
            return new AdminLoginResponseDto { Success = false, Message = "Invalid email or password" };

        // Only admin role can login through admin endpoint
        if (user.Role != UserRole.Admin)
            return new AdminLoginResponseDto { Success = false, Message = "Access denied. Admin privileges required." };

        if (!user.IsActive)
            return new AdminLoginResponseDto { Success = false, Message = "Account is deactivated." };

        try
        {
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return new AdminLoginResponseDto { Success = false, Message = "Invalid email or password" };
        }
        catch (Exception)
        {
            // Hash format is invalid (e.g. manually inserted SQL hash)
            return new AdminLoginResponseDto { Success = false, Message = "Invalid credentials. Please contact support." };
        }

        // Update last login timestamp
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        // Save refresh token
        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(
                int.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7")),
            CreatedAt = DateTime.UtcNow,
            UserId = user.UserId
        };
        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        // Log the login action
        await LogActionAsync(user.UserId, "AdminLogin", "Admin logged in successfully", ipAddress: ipAddress);

        return new AdminLoginResponseDto
        {
            Success = true,
            Message = "Login successful",
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenExpiration = DateTime.UtcNow.AddMinutes(
                int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "15")),
            Admin = new AdminProfileDto
            {
                UserId = user.UserId,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            }
        };
    }

    // Retrieves admin profile by user ID
    public async Task<AdminProfileDto?> GetProfileAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null || user.Role != UserRole.Admin) return null;

        return new AdminProfileDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }

    // Changes admin password after verifying current password
    public async Task<(bool Success, string Message)> ChangePasswordAsync(int userId, ChangePasswordDto request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null || user.Role != UserRole.Admin)
            return (false, "Admin user not found");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return (false, "Current password is incorrect");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12);
        await _context.SaveChangesAsync();

        await LogActionAsync(userId, "ChangePassword", "Admin changed their password");

        return (true, "Password changed successfully");
    }

    // Validates that the token belongs to an active admin
    public async Task<(bool Success, string Message)> ValidateTokenAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return (false, "User not found");
        if (user.Role != UserRole.Admin) return (false, "Not an admin user");
        if (!user.IsActive) return (false, "Account is deactivated");

        return (true, "Token is valid");
    }

    // Records admin actions in the audit log table
    public async Task LogActionAsync(int adminUserId, string action, string? details = null,
        int? targetUserId = null, int? targetEntityId = null, string? targetEntityType = null, string? ipAddress = null)
    {
        var log = new AdminAuditLog
        {
            AdminUserId = adminUserId,
            Action = action,
            Details = details,
            TargetUserId = targetUserId,
            TargetEntityId = targetEntityId,
            TargetEntityType = targetEntityType,
            IpAddress = ipAddress,
            PerformedAt = DateTime.UtcNow
        };

        _context.AdminAuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
