/*
 * JobEmailManagementService.cs - Admin Job Email Management
 * Handles listing, searching, filtering, editing, and deletion of job emails.
 * Includes statistics for admin dashboard.
 */

using System.Text.Json;
using InterviewHub.API.Data;
using InterviewHub.API.DTOs.Admin;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Services.Admin;

public class JobEmailManagementService : IJobEmailManagementService
{
    private readonly ApplicationDbContext _context;
    private readonly IAdminAuthService _adminAuthService;

    public JobEmailManagementService(ApplicationDbContext context, IAdminAuthService adminAuthService)
    {
        _context = context;
        _adminAuthService = adminAuthService;
    }

    // Paginated, searchable, filterable list of all job emails
    public async Task<PaginatedResponse<JobEmailListDto>> GetJobEmailsAsync(int page, int pageSize,
        string? search, int? userId, DateTime? dateFrom, DateTime? dateTo)
    {
        var query = _context.JobEmails.Include(e => e.User).AsQueryable();

        // Search by job title, company, or user email
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(e =>
                (e.JobTitle != null && e.JobTitle.ToLower().Contains(searchLower)) ||
                (e.CompanyName != null && e.CompanyName.ToLower().Contains(searchLower)) ||
                e.User.Email.ToLower().Contains(searchLower) ||
                e.User.FirstName.ToLower().Contains(searchLower) ||
                e.User.LastName.ToLower().Contains(searchLower));
        }

        // Filter by user
        if (userId.HasValue)
            query = query.Where(e => e.UserId == userId.Value);

        // Filter by date range
        if (dateFrom.HasValue)
            query = query.Where(e => e.UploadDate >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(e => e.UploadDate <= dateTo.Value.AddDays(1));

        var totalCount = await query.CountAsync();

        var emails = await query
            .OrderByDescending(e => e.UploadDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new JobEmailListDto
            {
                EmailId = e.EmailId,
                UserId = e.UserId,
                UserName = e.User.FirstName + " " + e.User.LastName,
                UserEmail = e.User.Email,
                JobTitle = e.JobTitle,
                CompanyName = e.CompanyName,
                Status = e.Status,
                UploadDate = e.UploadDate,
                ParsedAt = e.ParsedAt,
                SkillCount = _context.Skills.Count(s => s.EmailId == e.EmailId && !s.IsDeleted),
                QuestionCount = _context.Questions.Count(q => q.EmailId == e.EmailId && !q.IsDeleted),
                SessionCount = _context.InterviewSessions.Count(s => s.EmailId == e.EmailId)
            })
            .ToListAsync();

        return new PaginatedResponse<JobEmailListDto>
        {
            Data = emails,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    // Returns detailed job email with parsed data
    public async Task<JobEmailDetailDto?> GetJobEmailByIdAsync(int emailId)
    {
        var email = await _context.JobEmails
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.EmailId == emailId);

        if (email == null) return null;

        return new JobEmailDetailDto
        {
            EmailId = email.EmailId,
            UserId = email.UserId,
            UserName = email.User.FirstName + " " + email.User.LastName,
            UserEmail = email.User.Email,
            JobTitle = email.JobTitle,
            CompanyName = email.CompanyName,
            EmailContent = email.EmailContent,
            CleanedContent = email.CleanedContent,
            UploadDate = email.UploadDate,
            ParsedSkills = DeserializeJsonList(email.ParsedSkills),
            Responsibilities = DeserializeJsonList(email.Responsibilities),
            RequiredQualifications = DeserializeJsonList(email.RequiredQualifications),
            PreferredSkills = DeserializeJsonList(email.PreferredSkills),
            JobDescription = email.JobDescription,
            Status = email.Status,
            ParseError = email.ParseError,
            OriginalFileName = email.OriginalFileName,
            FileType = email.FileType,
            ParsedAt = email.ParsedAt,
            SkillCount = await _context.Skills.CountAsync(s => s.EmailId == emailId && !s.IsDeleted),
            QuestionCount = await _context.Questions.CountAsync(q => q.EmailId == emailId && !q.IsDeleted),
            SessionCount = await _context.InterviewSessions.CountAsync(s => s.EmailId == emailId)
        };
    }

    // Updates job email metadata (title, company, content, status)
    public async Task<(bool Success, string Message)> UpdateJobEmailAsync(int emailId, UpdateJobEmailDto request, int adminUserId)
    {
        var email = await _context.JobEmails.FindAsync(emailId);
        if (email == null) return (false, "Job email not found");

        if (request.JobTitle != null) email.JobTitle = request.JobTitle;
        if (request.CompanyName != null) email.CompanyName = request.CompanyName;
        if (request.EmailContent != null) email.EmailContent = request.EmailContent;
        if (request.Status != null) email.Status = request.Status;

        await _context.SaveChangesAsync();

        await _adminAuthService.LogActionAsync(adminUserId, "UpdateJobEmail",
            $"Updated job email {emailId}: {email.JobTitle}",
            targetEntityId: emailId, targetEntityType: "JobEmail");

        return (true, "Job email updated successfully");
    }

    // Permanently deletes a job email and cascading data
    public async Task<(bool Success, string Message)> DeleteJobEmailAsync(int emailId, int adminUserId)
    {
        var email = await _context.JobEmails.FindAsync(emailId);
        if (email == null) return (false, "Job email not found");

        // Remove related skills (set EmailId to null since it's nullable)
        var relatedSkills = await _context.Skills.Where(s => s.EmailId == emailId).ToListAsync();
        foreach (var skill in relatedSkills)
        {
            skill.EmailId = null;
        }

        // Remove related questions (set EmailId to null)
        var relatedQuestions = await _context.Questions.Where(q => q.EmailId == emailId).ToListAsync();
        foreach (var question in relatedQuestions)
        {
            question.EmailId = null;
        }

        _context.JobEmails.Remove(email);
        await _context.SaveChangesAsync();

        await _adminAuthService.LogActionAsync(adminUserId, "DeleteJobEmail",
            $"Deleted job email {emailId}: {email.JobTitle} from user {email.UserId}",
            targetEntityId: emailId, targetEntityType: "JobEmail",
            targetUserId: email.UserId);

        return (true, "Job email deleted successfully");
    }

    // Calculates job email statistics for admin dashboard
    public async Task<JobEmailStatsDto> GetJobEmailStatsAsync()
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var weekStart = now.AddDays(-(int)now.DayOfWeek);

        var stats = new JobEmailStatsDto
        {
            TotalEmails = await _context.JobEmails.CountAsync(),
            ParsedEmails = await _context.JobEmails.CountAsync(e => e.Status == "Parsed"),
            PendingEmails = await _context.JobEmails.CountAsync(e => e.Status == "Pending"),
            FailedEmails = await _context.JobEmails.CountAsync(e => e.Status == "Failed"),
            EmailsThisMonth = await _context.JobEmails.CountAsync(e => e.UploadDate >= monthStart),
            EmailsThisWeek = await _context.JobEmails.CountAsync(e => e.UploadDate >= weekStart)
        };

        // Top 10 skills across all job emails
        stats.TopSkills = await _context.Skills
            .Where(s => !s.IsDeleted && s.EmailId != null)
            .GroupBy(s => s.SkillName)
            .Select(g => new TopSkillDto { SkillName = g.Key, Count = g.Count() })
            .OrderByDescending(s => s.Count)
            .Take(10)
            .ToListAsync();

        // Top companies
        stats.TopCompanies = await _context.JobEmails
            .Where(e => e.CompanyName != null && e.CompanyName != "")
            .GroupBy(e => e.CompanyName!)
            .Select(g => new TopCompanyDto { CompanyName = g.Key, Count = g.Count() })
            .OrderByDescending(c => c.Count)
            .Take(10)
            .ToListAsync();

        // Top job titles
        stats.TopJobTitles = await _context.JobEmails
            .Where(e => e.JobTitle != null && e.JobTitle != "")
            .GroupBy(e => e.JobTitle!)
            .Select(g => new TopJobTitleDto { JobTitle = g.Key, Count = g.Count() })
            .OrderByDescending(j => j.Count)
            .Take(10)
            .ToListAsync();

        return stats;
    }

    // Helper: safely deserialize JSON string to list of strings
    private static List<string>? DeserializeJsonList(string? json)
    {
        if (string.IsNullOrEmpty(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json);
        }
        catch
        {
            return new List<string> { json };
        }
    }
}
