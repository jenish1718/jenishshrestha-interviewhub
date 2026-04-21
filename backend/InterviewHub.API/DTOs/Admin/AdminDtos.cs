/*
 * AdminDtos.cs - Admin Panel Data Transfer Objects
 * Contains DTOs for admin auth, user management, and job email management.
 * Property names match exactly what the service implementations reference.
 */

namespace InterviewHub.API.DTOs.Admin;

// ---------------------------------------------------------------------------
// Generic paginated wrapper - used across all admin list endpoints
// ---------------------------------------------------------------------------

public class PaginatedResponse<T>
{
    public List<T> Data { get; set; } = new();       // Services set "Data"
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}

// ---------------------------------------------------------------------------
// Admin Authentication DTOs
// ---------------------------------------------------------------------------

public class AdminLoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AdminLoginResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? TokenExpiration { get; set; }
    public AdminProfileDto? Admin { get; set; }
}

public class AdminProfileDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

// ---------------------------------------------------------------------------
// User Management DTOs
// ---------------------------------------------------------------------------

public class UserListDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsSuspended { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int TotalInterviews { get; set; }
    public int TotalJobEmails { get; set; }
}

public class UserDetailDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsSuspended { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public int TotalInterviews { get; set; }
    public int TotalJobEmails { get; set; }
    public int TotalReports { get; set; }
    public decimal AverageScore { get; set; }
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
}

public class RecentActivityDto
{
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}

public class UpdateUserStatusDto
{
    public bool? IsActive { get; set; }
    public bool? IsSuspended { get; set; }
    public string? Reason { get; set; }
}

public class UserStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int SuspendedUsers { get; set; }
    public int NewUsersThisMonth { get; set; }
    public int NewUsersThisWeek { get; set; }
    public int AdminCount { get; set; }
    public int CandidateCount { get; set; }
}

// ---------------------------------------------------------------------------
// Job Email Management DTOs
// ---------------------------------------------------------------------------

public class JobEmailListDto
{
    public int EmailId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? CompanyName { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime UploadDate { get; set; }
    public DateTime? ParsedAt { get; set; }
    public int SkillCount { get; set; }
    public int QuestionCount { get; set; }
    public int SessionCount { get; set; }
}

public class JobEmailDetailDto
{
    public int EmailId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? CompanyName { get; set; }
    public string EmailContent { get; set; } = string.Empty;
    public string? CleanedContent { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ParseError { get; set; }
    public string? OriginalFileName { get; set; }
    public string? FileType { get; set; }
    public DateTime UploadDate { get; set; }
    public DateTime? ParsedAt { get; set; }
    public List<string>? ParsedSkills { get; set; }
    public List<string>? Responsibilities { get; set; }
    public List<string>? RequiredQualifications { get; set; }
    public List<string>? PreferredSkills { get; set; }
    public string? JobDescription { get; set; }
    public int SkillCount { get; set; }
    public int QuestionCount { get; set; }
    public int SessionCount { get; set; }
}

public class UpdateJobEmailDto
{
    public string? JobTitle { get; set; }
    public string? CompanyName { get; set; }
    public string? EmailContent { get; set; }
    public string? Status { get; set; }
}

public class JobEmailStatsDto
{
    public int TotalEmails { get; set; }
    public int ParsedEmails { get; set; }
    public int PendingEmails { get; set; }
    public int FailedEmails { get; set; }
    public int EmailsThisMonth { get; set; }
    public int EmailsThisWeek { get; set; }
    public List<TopSkillDto> TopSkills { get; set; } = new();
    public List<TopCompanyDto> TopCompanies { get; set; } = new();
    public List<TopJobTitleDto> TopJobTitles { get; set; } = new();
}

public class TopSkillDto
{
    public string SkillName { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class TopCompanyDto
{
    public string CompanyName { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class TopJobTitleDto
{
    public string JobTitle { get; set; } = string.Empty;
    public int Count { get; set; }
}
