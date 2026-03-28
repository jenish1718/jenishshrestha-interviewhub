/*
 * AuthService.cs - User Authentication Service
 * Handles registration, login, token refresh, and password reset.
 * Uses BCrypt for secure password hashing with work factor 12.
 */

using System.Security.Cryptography;
using InterviewHub.API.Data;
using InterviewHub.API.DTOs.Candidate;
using InterviewHub.API.Models;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Services.Candidate;

/// <summary>
/// Implements authentication logic with JWT tokens and BCrypt hashing.
/// Supports token rotation for enhanced security.
/// </summary>
public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;

    public AuthService(ApplicationDbContext context, IJwtService jwtService, IConfiguration configuration)
    {
        _context = context;
        _jwtService = jwtService;
        _configuration = configuration;
    }

    // Registers new user with email validation and BCrypt password hashing
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // Prevent duplicate emails
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
        {
            return new AuthResponse { Success = false, Message = "Email is already registered" };
        }

        // BCrypt hash with work factor 12 for security
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12);

        var user = new Models.User
        {
            Email = request.Email.ToLower().Trim(),
            PasswordHash = passwordHash,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Role = UserRole.Candidate,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = await GenerateAndSaveRefreshTokenAsync(user);

        return new AuthResponse
        {
            Success = true,
            Message = "Registration successful",
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenExpiration = DateTime.UtcNow.AddMinutes(
                int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "15")),
            User = new UserInfo
            {
                UserId = user.UserId,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString()
            }
        };
    }

    // Authenticates user and issues JWT + refresh token
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
            return new AuthResponse { Success = false, Message = "Invalid email or password" };

        if (!user.IsActive)
            return new AuthResponse { Success = false, Message = "Account is deactivated. Please contact support." };

        // Verify password with BCrypt
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return new AuthResponse { Success = false, Message = "Invalid email or password" };

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = await GenerateAndSaveRefreshTokenAsync(user);

        return new AuthResponse
        {
            Success = true,
            Message = "Login successful",
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenExpiration = DateTime.UtcNow.AddMinutes(
                int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "15")),
            User = new UserInfo
            {
                UserId = user.UserId,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString()
            }
        };
    }

    // Issues new access token using valid refresh token (token rotation)
    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken == null)
            return new AuthResponse { Success = false, Message = "Invalid refresh token" };

        if (!storedToken.IsActive)
            return new AuthResponse { Success = false, Message = "Refresh token has expired or been revoked" };

        var user = storedToken.User;

        if (!user.IsActive)
            return new AuthResponse { Success = false, Message = "Account is deactivated" };

        // Revoke old token (rotation)
        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;

        var accessToken = _jwtService.GenerateAccessToken(user);
        var newRefreshToken = await GenerateAndSaveRefreshTokenAsync(user);

        await _context.SaveChangesAsync();

        return new AuthResponse
        {
            Success = true,
            Message = "Token refreshed successfully",
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            TokenExpiration = DateTime.UtcNow.AddMinutes(
                int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "15")),
            User = new UserInfo
            {
                UserId = user.UserId,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString()
            }
        };
    }

    // Initiates password reset flow (returns success regardless to prevent enumeration)
    public async Task<AuthResponse> RequestPasswordResetAsync(string email)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

        // Always return success to prevent email enumeration attacks
        if (user == null)
        {
            return new AuthResponse
            {
                Success = true,
                Message = "If your email is registered, you will receive a password reset link"
            };
        }

        // Generate secure reset token
        var resetToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

        await _context.SaveChangesAsync();

        // In production: send email with reset link
        // For dev/testing: return token in response
        return new AuthResponse
        {
            Success = true,
            Message = "If your email is registered, you will receive a password reset link",
            AccessToken = resetToken // DEV ONLY - token should be sent via email
        };
    }

    // Validates reset token and sets new password
    public async Task<AuthResponse> ResetPasswordAsync(PasswordResetConfirmDto request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => 
                u.Email.ToLower() == request.Email.ToLower() &&
                u.PasswordResetToken == request.Token);

        if (user == null)
            return new AuthResponse { Success = false, Message = "Invalid or expired reset token" };

        if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
            return new AuthResponse { Success = false, Message = "Reset token has expired. Please request a new one." };

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;

        // Revoke all existing refresh tokens for security
        var userTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == user.UserId && !rt.IsRevoked)
            .ToListAsync();

        foreach (var token in userTokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return new AuthResponse
        {
            Success = true,
            Message = "Password has been reset successfully. Please login with your new password."
        };
    }

    // Invalidates a specific refresh token (logout)
    public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken == null || storedToken.IsRevoked)
            return false;

        storedToken.IsRevoked = true;
        storedToken.RevokedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    // Creates and stores new refresh token
    private async Task<string> GenerateAndSaveRefreshTokenAsync(Models.User user)
    {
        var refreshTokenDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7");
        
        var refreshToken = new RefreshToken
        {
            Token = _jwtService.GenerateRefreshToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(refreshTokenDays),
            CreatedAt = DateTime.UtcNow,
            UserId = user.UserId
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return refreshToken.Token;
    }

    // DEV ONLY - Resets or creates admin account for testing
    public async Task<AuthResponse> ResetAdminPasswordAsync()
    {
        var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == "admin@interviewhub.com");
        
        if (adminUser == null)
        {
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", workFactor: 12);
            adminUser = new Models.User
            {
                Email = "admin@interviewhub.com",
                PasswordHash = passwordHash,
                FirstName = "Admin",
                LastName = "User",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };
            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();
            
            return new AuthResponse
            {
                Success = true,
                Message = "Admin user created. Email: admin@interviewhub.com, Password: Admin@123"
            };
        }

        // Update existing admin
        adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", workFactor: 12);
        adminUser.Role = UserRole.Admin;
        adminUser.IsActive = true;
        await _context.SaveChangesAsync();

        return new AuthResponse
        {
            Success = true,
            Message = "Admin password reset. Email: admin@interviewhub.com, Password: Admin@123"
        };
    }
}
