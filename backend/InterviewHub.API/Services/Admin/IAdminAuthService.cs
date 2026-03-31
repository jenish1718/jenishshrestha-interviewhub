/*
 * IAdminAuthService.cs - Admin Authentication Service Interface
 * Defines contract for admin-specific auth operations.
 */

using InterviewHub.API.DTOs.Admin;

namespace InterviewHub.API.Services.Admin;

public interface IAdminAuthService
{
    Task<AdminLoginResponseDto> LoginAsync(AdminLoginRequestDto request, string? ipAddress);
    Task<AdminProfileDto?> GetProfileAsync(int userId);
    Task<(bool Success, string Message)> ChangePasswordAsync(int userId, ChangePasswordDto request);
    Task<(bool Success, string Message)> ValidateTokenAsync(int userId);
    Task LogActionAsync(int adminUserId, string action, string? details = null,
        int? targetUserId = null, int? targetEntityId = null, string? targetEntityType = null, string? ipAddress = null);
}
