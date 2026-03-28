/*
 * IAuthService.cs - Authentication Service Interface
 * Defines the contract for user auth operations.
 */

using InterviewHub.API.DTOs.Candidate;

namespace InterviewHub.API.Services.Candidate;

/// <summary>
/// Interface for authentication service operations
/// </summary>
public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);
    Task<AuthResponse> RequestPasswordResetAsync(string email);
    Task<AuthResponse> ResetPasswordAsync(PasswordResetConfirmDto request);
    Task<bool> RevokeRefreshTokenAsync(string refreshToken);
    Task<AuthResponse> ResetAdminPasswordAsync();
}
