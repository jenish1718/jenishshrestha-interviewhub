/*
 * IUserManagementService.cs - User Management Interface
 * Defines contract for admin user management operations.
 */

using InterviewHub.API.DTOs.Admin;

namespace InterviewHub.API.Services.Admin;

public interface IUserManagementService
{
    Task<PaginatedResponse<UserListDto>> GetUsersAsync(int page, int pageSize, string? search, string? role, string? status);
    Task<UserDetailDto?> GetUserByIdAsync(int userId);
    Task<(bool Success, string Message)> UpdateUserStatusAsync(int userId, UpdateUserStatusDto request, int adminUserId);
    Task<(bool Success, string Message)> DeleteUserAsync(int userId, int adminUserId);
    Task<UserStatsDto> GetUserStatsAsync();
}
