using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Data;
using InterviewHub.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace InterviewHub.API.Services.Admin;

public interface IAnalyticsService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync();
    Task<List<TimeSeriesDto>> GetUserGrowthAsync(DateTime from, DateTime to);
    Task<List<TimeSeriesDto>> GetSessionTrendsAsync(DateTime from, DateTime to);
    Task<List<ChartDataDto>> GetSkillPopularityAsync();
    Task<SkillsDistributionResponse> GetSkillsDistributionAsync(DateTime? from, DateTime? to);
}

public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _context;

    public AnalyticsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var totalUsers = await _context.Users.CountAsync(u => !u.IsDeleted && u.Role == UserRole.Candidate);
        var activeUsers = await _context.Users.CountAsync(u => !u.IsDeleted && u.IsActive && u.Role == UserRole.Candidate);
        var totalSessions = await _context.InterviewSessions.CountAsync();
        var totalQuestions = await _context.Questions.CountAsync(q => !q.IsDeleted);
        var totalSkills = await _context.Skills.CountAsync(s => !s.IsDeleted);

        var averageScore = await _context.InterviewReports.AnyAsync()
            ? await _context.InterviewReports.AverageAsync(r => r.OverallScore)
            : 0;

        var completedSessions = await _context.InterviewSessions.CountAsync(s => s.Status == SessionStatus.Completed);
        double completionRate = totalSessions > 0 ? (double)completedSessions / totalSessions * 100 : 0;

        return new DashboardStatsDto
        {
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            TotalSessions = totalSessions,
            TotalQuestions = totalQuestions,
            TotalSkills = totalSkills,
            AverageScore = averageScore,
            CompletionRate = Math.Round(completionRate, 1)
        };
    }

    public async Task<List<TimeSeriesDto>> GetUserGrowthAsync(DateTime from, DateTime to)
    {
        var data = await _context.Users
            .Where(u => u.CreatedAt >= from && u.CreatedAt <= to && !u.IsDeleted)
            .GroupBy(u => u.CreatedAt.Date)
            .Select(g => new TimeSeriesDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Count = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToListAsync();

        return data;
    }

    public async Task<List<TimeSeriesDto>> GetSessionTrendsAsync(DateTime from, DateTime to)
    {
        var data = await _context.InterviewSessions
            .Where(s => s.StartTime >= from && s.StartTime <= to)
            .GroupBy(s => s.StartTime.Date)
            .Select(g => new TimeSeriesDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Count = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToListAsync();

        return data;
    }

    public async Task<List<ChartDataDto>> GetSkillPopularityAsync()
    {
        var data = await _context.Questions
            .Where(q => !q.IsDeleted && q.SkillId.HasValue)
            .GroupBy(q => q.SkillId)
            .Select(g => new
            {
                SkillId = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(g => g.Count)
            .Take(10)
            .ToListAsync();

        var result = new List<ChartDataDto>();
        foreach (var item in data)
        {
            var skillName = await _context.Skills
                .Where(s => s.SkillId == item.SkillId)
                .Select(s => s.SkillName)
                .FirstOrDefaultAsync() ?? "Unknown";

            result.Add(new ChartDataDto { Label = skillName, Value = item.Count });
        }

        return result;
    }

    /// <summary>
    /// Top 10 most-interviewed skills + "Others" for the admin pie chart.
    /// Counts the number of completed sessions that included each skill (via answers → questions → skills).
    /// </summary>
    public async Task<SkillsDistributionResponse> GetSkillsDistributionAsync(DateTime? from, DateTime? to)
    {
        var dateFrom = from ?? DateTime.MinValue;
        var dateTo = to ?? DateTime.UtcNow;

        // Query: completed sessions within date range → their answers → linked questions → linked skills
        var skillCounts = await _context.SessionAnswers
            .Include(a => a.Session)
            .Include(a => a.Question)
                .ThenInclude(q => q.Skill)
            .Where(a => a.Session.Status == SessionStatus.Completed)
            .Where(a => a.Session.StartTime >= dateFrom && a.Session.StartTime <= dateTo)
            .Where(a => a.Question.SkillId.HasValue && a.Question.Skill != null)
            .GroupBy(a => new { a.Question.SkillId, a.Question.Skill!.SkillName })
            .Select(g => new
            {
                SkillName = g.Key.SkillName,
                // Count distinct sessions, not individual answers
                InterviewCount = g.Select(a => a.SessionId).Distinct().Count()
            })
            .OrderByDescending(x => x.InterviewCount)
            .ToListAsync();

        var totalInterviews = skillCounts.Sum(x => x.InterviewCount);

        var top10 = skillCounts.Take(10).ToList();
        var othersCount = skillCounts.Skip(10).Sum(x => x.InterviewCount);

        var result = top10.Select(x => new SkillInterviewStatsDto
        {
            SkillName = x.SkillName,
            InterviewCount = x.InterviewCount,
            Percentage = totalInterviews > 0
                ? Math.Round((decimal)x.InterviewCount / totalInterviews * 100, 1)
                : 0
        }).ToList();

        if (othersCount > 0)
        {
            result.Add(new SkillInterviewStatsDto
            {
                SkillName = "Others",
                InterviewCount = othersCount,
                Percentage = totalInterviews > 0
                    ? Math.Round((decimal)othersCount / totalInterviews * 100, 1)
                    : 0
            });
        }

        return new SkillsDistributionResponse
        {
            Skills = result,
            TotalInterviews = totalInterviews,
            DateFrom = dateFrom.ToString("yyyy-MM-dd"),
            DateTo = dateTo.ToString("yyyy-MM-dd")
        };
    }
}
