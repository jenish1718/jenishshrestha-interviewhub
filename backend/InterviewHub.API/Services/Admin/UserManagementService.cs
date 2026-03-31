/*
 * UserManagementService.cs - Admin User Management
 * Handles listing, searching, filtering, status updates, and deletion of users.
 * Includes user statistics for admin dashboard.
 */

using InterviewHub.API.Data;
using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Models;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Services.Admin;

public class UserManagementService : IUserManagementService
{
    private readonly ApplicationDbContext _context;
    private readonly IAdminAuthService _adminAuthService;

    public UserManagementService(ApplicationDbContext context, IAdminAuthService adminAuthService)
    {
        _context = context;
        _adminAuthService = adminAuthService;
    }

    // Returns paginated, searchable, filterable user list
    public async Task<PaginatedResponse<UserListDto>> GetUsersAsync(int page, int pageSize,
        string? search, string? role, string? status)
    {
        var query = _context.Users.Where(u => !u.IsDeleted).AsQueryable();

        // Search by name or email
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(searchLower) ||
                u.FirstName.ToLower().Contains(searchLower) ||
                u.LastName.ToLower().Contains(searchLower));
        }

        // Filter by role
        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var roleEnum))
        {
            query = query.Where(u => u.Role == roleEnum);
        }

        // Filter by status
        if (!string.IsNullOrEmpty(status))
        {
            switch (status.ToLower())
            {
                case "active":
                    query = query.Where(u => u.IsActive && !u.IsSuspended);
                    break;
                case "inactive":
                    query = query.Where(u => !u.IsActive);
                    break;
                case "suspended":
                    query = query.Where(u => u.IsSuspended);
                    break;
            }
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserListDto
            {
                UserId = u.UserId,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                IsSuspended = u.IsSuspended,
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt,
                TotalInterviews = _context.InterviewSessions.Count(s => s.UserId == u.UserId),
                TotalJobEmails = _context.JobEmails.Count(e => e.UserId == u.UserId)
            })
            .ToListAsync();

        return new PaginatedResponse<UserListDto>
        {
            Data = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    // Returns detailed user information with activity stats
    public async Task<UserDetailDto?> GetUserByIdAsync(int userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId && !u.IsDeleted);
        if (user == null) return null;

        var totalInterviews = await _context.InterviewSessions.CountAsync(s => s.UserId == userId);
        var totalJobEmails = await _context.JobEmails.CountAsync(e => e.UserId == userId);
        var totalReports = await _context.InterviewReports.CountAsync(r => r.UserId == userId);
        var avgScore = await _context.InterviewReports
            .Where(r => r.UserId == userId)
            .Select(r => (decimal?)r.OverallScore)
            .AverageAsync() ?? 0;

        // Get recent activities (last 10)
        var recentSessions = await _context.InterviewSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.StartTime)
            .Take(5)
            .Select(s => new RecentActivityDto
            {
                Type = "Interview",
                Description = $"Interview session - {s.Status}",
                Date = s.StartTime
            })
            .ToListAsync();

        var recentEmails = await _context.JobEmails
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.UploadDate)
            .Take(5)
            .Select(e => new RecentActivityDto
            {
                Type = "JobEmail",
                Description = $"Uploaded: {e.JobTitle ?? "Job Description"} at {e.CompanyName ?? "Unknown Company"}",
                Date = e.UploadDate
            })
            .ToListAsync();

        var activities = recentSessions.Concat(recentEmails)
            .OrderByDescending(a => a.Date)
            .Take(10)
            .ToList();

        return new UserDetailDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            IsSuspended = user.IsSuspended,
            IsDeleted = user.IsDeleted,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            LastActivityAt = user.LastActivityAt,
            TotalInterviews = totalInterviews,
            TotalJobEmails = totalJobEmails,
            TotalReports = totalReports,
            AverageScore = Math.Round(avgScore, 1),
            RecentActivities = activities
        };
    }

    // Enables, disables, or suspends a user account
    public async Task<(bool Success, string Message)> UpdateUserStatusAsync(int userId, UpdateUserStatusDto request, int adminUserId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return (false, "User not found");

        // Prevent admins from disabling themselves
        if (userId == adminUserId)
            return (false, "Cannot modify your own account status");

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        if (request.IsSuspended.HasValue)
            user.IsSuspended = request.IsSuspended.Value;

        await _context.SaveChangesAsync();

        var statusDesc = request.IsActive.HasValue
            ? (request.IsActive.Value ? "enabled" : "disabled")
            : (request.IsSuspended!.Value ? "suspended" : "unsuspended");

        await _adminAuthService.LogActionAsync(adminUserId, "UpdateUserStatus",
            $"User {user.Email} {statusDesc}",
            targetUserId: userId, targetEntityType: "User");

        return (true, $"User {statusDesc} successfully");
    }

    // Soft-deletes a user (marks as deleted rather than removing from DB)
    public async Task<(bool Success, string Message)> DeleteUserAsync(int userId, int adminUserId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return (false, "User not found");

        if (userId == adminUserId)
            return (false, "Cannot delete your own account");

        if (user.Role == UserRole.Admin)
            return (false, "Cannot delete admin accounts through this endpoint");

        // Soft delete
        user.IsDeleted = true;
        user.IsActive = false;
        user.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _adminAuthService.LogActionAsync(adminUserId, "DeleteUser",
            $"User {user.Email} deleted",
            targetUserId: userId, targetEntityType: "User");

        return (true, "User deleted successfully");
    }

    // Calculates user statistics for admin dashboard cards
    public async Task<UserStatsDto> GetUserStatsAsync()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var weekStart = now.AddDays(-(int)now.DayOfWeek);

        return new UserStatsDto
        {
            TotalUsers = await _context.Users.CountAsync(u => !u.IsDeleted),
            ActiveUsers = await _context.Users.CountAsync(u => u.IsActive && !u.IsDeleted && !u.IsSuspended),
            SuspendedUsers = await _context.Users.CountAsync(u => u.IsSuspended && !u.IsDeleted),
            NewUsersThisMonth = await _context.Users.CountAsync(u => u.CreatedAt >= monthStart && !u.IsDeleted),
            NewUsersThisWeek = await _context.Users.CountAsync(u => u.CreatedAt >= weekStart && !u.IsDeleted),
            AdminCount = await _context.Users.CountAsync(u => u.Role == UserRole.Admin && !u.IsDeleted),
            CandidateCount = await _context.Users.CountAsync(u => u.Role == UserRole.Candidate && !u.IsDeleted)
        };
    }
}
