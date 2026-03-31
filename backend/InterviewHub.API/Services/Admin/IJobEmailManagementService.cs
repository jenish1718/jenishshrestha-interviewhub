/*
 * IJobEmailManagementService.cs - Job Email Management Interface
 * Defines contract for admin job email management operations.
 */

using InterviewHub.API.DTOs.Admin;

namespace InterviewHub.API.Services.Admin;

public interface IJobEmailManagementService
{
    Task<PaginatedResponse<JobEmailListDto>> GetJobEmailsAsync(int page, int pageSize,
        string? search, int? userId, DateTime? dateFrom, DateTime? dateTo);
    Task<JobEmailDetailDto?> GetJobEmailByIdAsync(int emailId);
    Task<(bool Success, string Message)> UpdateJobEmailAsync(int emailId, UpdateJobEmailDto request, int adminUserId);
    Task<(bool Success, string Message)> DeleteJobEmailAsync(int emailId, int adminUserId);
    Task<JobEmailStatsDto> GetJobEmailStatsAsync();
}
