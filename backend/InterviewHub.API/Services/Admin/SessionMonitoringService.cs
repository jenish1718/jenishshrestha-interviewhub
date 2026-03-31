using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Data;
using InterviewHub.API.Models;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Services.Admin;

public interface ISessionMonitoringService
{
    Task<(IEnumerable<SessionListDto> Sessions, int TotalCount)> GetAllSessionsAsync(int page, int pageSize, int? userId, DateTime? dateFrom, DateTime? dateTo, string? status);
    Task<SessionDetailDto?> GetSessionDetailAsync(int sessionId);
    Task<SessionStatsDto> GetSessionStatsAsync();
    Task<List<SessionAnswerDto>> GetSessionTranscriptAsync(int sessionId);
}

public class SessionMonitoringService : ISessionMonitoringService
{
    private readonly ApplicationDbContext _context;

    public SessionMonitoringService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<SessionListDto> Sessions, int TotalCount)> GetAllSessionsAsync(int page, int pageSize, int? userId, DateTime? dateFrom, DateTime? dateTo, string? status)
    {
        var query = _context.InterviewSessions.AsQueryable();

        if (userId.HasValue)
            query = query.Where(s => s.UserId == userId.Value);

        if (dateFrom.HasValue)
            query = query.Where(s => s.StartTime >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(s => s.StartTime <= dateTo.Value);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<SessionStatus>(status, true, out var st))
            query = query.Where(s => s.Status == st);

        var totalCount = await query.CountAsync();

        var sessions = await query
            .OrderByDescending(s => s.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SessionListDto
            {
                SessionId = s.SessionId,
                UserId = s.UserId,
                UserName = s.User.FirstName + " " + s.User.LastName,
                UserEmail = s.User.Email,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                Status = s.Status.ToString(),
                TotalQuestions = s.TotalQuestions,
                AnsweredQuestions = s.Answers.Count,
                OverallScore = _context.InterviewReports.Where(r => r.SessionId == s.SessionId).Select(r => (decimal?)r.OverallScore).FirstOrDefault()
            })
            .ToListAsync();

        return (sessions, totalCount);
    }

    public async Task<SessionDetailDto?> GetSessionDetailAsync(int sessionId)
    {
        var session = await _context.InterviewSessions
            .Include(s => s.User)
            .Include(s => s.JobEmail)
            .Include(s => s.Answers)
                .ThenInclude(a => a.Question)
            .FirstOrDefaultAsync(s => s.SessionId == sessionId);

        if (session == null) return null;

        var report = await _context.InterviewReports.FirstOrDefaultAsync(r => r.SessionId == sessionId);

        return new SessionDetailDto
        {
            SessionId = session.SessionId,
            UserId = session.UserId,
            UserName = session.User.FirstName + " " + session.User.LastName,
            UserEmail = session.User.Email,
            StartTime = session.StartTime,
            EndTime = session.EndTime,
            Status = session.Status.ToString(),
            TotalQuestions = session.TotalQuestions,
            AnsweredQuestions = session.Answers.Count,
            OverallScore = report?.OverallScore,
            EmailId = session.EmailId,
            JobTitle = session.JobEmail?.EmailContent?.Substring(0, Math.Min(100, session.JobEmail.EmailContent.Length)) ?? "N/A",
            Answers = session.Answers.Select(a => new SessionAnswerDto
            {
                AnswerId = a.AnswerId,
                QuestionText = a.Question?.QuestionText ?? "N/A",
                TranscriptText = a.TranscriptText,
                AudioDuration = a.AudioDuration,
                WordCount = a.WordCount,
                FillerWordCount = a.FillerWordCount,
                SpeakingPaceWPM = a.SpeakingPaceWPM,
                AnsweredAt = a.AnsweredAt
            }).ToList()
        };
    }

    public async Task<SessionStatsDto> GetSessionStatsAsync()
    {
        var totalSessions = await _context.InterviewSessions.CountAsync();
        var completedSessions = await _context.InterviewSessions.CountAsync(s => s.Status == SessionStatus.Completed);
        var inProgressSessions = await _context.InterviewSessions.CountAsync(s => s.Status == SessionStatus.InProgress);
        var abandonedSessions = await _context.InterviewSessions.CountAsync(s => s.Status == SessionStatus.Abandoned);

        var averageScore = await _context.InterviewReports.AnyAsync()
            ? await _context.InterviewReports.AverageAsync(r => r.OverallScore)
            : 0;

        double completionRate = totalSessions > 0 ? (double)completedSessions / totalSessions * 100 : 0;

        return new SessionStatsDto
        {
            TotalSessions = totalSessions,
            CompletedSessions = completedSessions,
            InProgressSessions = inProgressSessions,
            AbandonedSessions = abandonedSessions,
            AverageScore = averageScore,
            CompletionRate = Math.Round(completionRate, 1)
        };
    }

    public async Task<List<SessionAnswerDto>> GetSessionTranscriptAsync(int sessionId)
    {
        return await _context.SessionAnswers
            .Where(a => a.SessionId == sessionId)
            .OrderBy(a => a.AnsweredAt)
            .Select(a => new SessionAnswerDto
            {
                AnswerId = a.AnswerId,
                QuestionText = a.Question.QuestionText,
                TranscriptText = a.TranscriptText,
                AudioDuration = a.AudioDuration,
                WordCount = a.WordCount,
                FillerWordCount = a.FillerWordCount,
                SpeakingPaceWPM = a.SpeakingPaceWPM,
                AnsweredAt = a.AnsweredAt
            })
            .ToListAsync();
    }
}
