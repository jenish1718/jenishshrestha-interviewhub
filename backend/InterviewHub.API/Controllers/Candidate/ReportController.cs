/*
 * ReportController.cs - Interview Performance Reports
 * Generates and retrieves performance reports with speech/visual metrics.
 * Reports are auto-generated after session completion or on-demand.
 */

using InterviewHub.API.Data;
using InterviewHub.API.DTOs.Candidate;
using InterviewHub.API.Services.Candidate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace InterviewHub.API.Controllers.Candidate;

[ApiController]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IScoringService _scoringService;

    public ReportController(ApplicationDbContext context, IScoringService scoringService)
    {
        _context = context;
        _scoringService = scoringService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    // Triggers report generation for a completed session
    [HttpPost("api/sessions/{sessionId}/generate-report")]
    public async Task<ActionResult<GenerateReportResponse>> GenerateReport(int sessionId)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { message = "Invalid token" });

        var session = await _context.InterviewSessions
            .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

        if (session == null)
            return NotFound(new { message = "Session not found" });

        if (session.Status != Models.SessionStatus.Completed)
            return BadRequest(new { message = "Can only generate report for completed sessions" });

        try
        {
            var report = await _scoringService.GenerateReportAsync(sessionId, userId);

            return Ok(new GenerateReportResponse
            {
                ReportId = report.ReportId,
                OverallScore = report.OverallScore,
                Grade = report.Grade
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to generate report", error = ex.Message });
        }
    }

    // Retrieves full report with speech and visual breakdowns
    [HttpGet("api/sessions/{sessionId}/report")]
    public async Task<ActionResult<ReportResponse>> GetReport(int sessionId)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { message = "Invalid token" });

        // Always use ScoringService which does upsert and returns full data
        // including AI-evaluated content scores, feedback, and visual metrics
        try
        {
            var report = await _scoringService.GenerateReportAsync(sessionId, userId);
            return Ok(report);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get report", error = ex.Message });
        }
    }

    // Lists all reports for user's interview history
    [HttpGet("api/reports/history")]
    public async Task<ActionResult<List<ReportHistoryItem>>> GetReportHistory()
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { message = "Invalid token" });

        var reports = await _context.InterviewReports
            .Include(r => r.Session)
            .ThenInclude(s => s.JobEmail)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.GeneratedAt)
            .Select(r => new ReportHistoryItem
            {
                ReportId = r.ReportId,
                SessionId = r.SessionId,
                JobTitle = r.Session.JobEmail != null ? r.Session.JobEmail.JobTitle : null,
                CompanyName = r.Session.JobEmail != null ? r.Session.JobEmail.CompanyName : null,
                OverallScore = r.OverallScore,
                Grade = r.Grade,
                GeneratedAt = r.GeneratedAt
            })
            .ToListAsync();

        return Ok(reports);
    }

    // Returns report data for PDF export (client-side rendering)
    [HttpGet("api/sessions/{sessionId}/report/pdf")]
    public async Task<IActionResult> DownloadPdfReport(int sessionId)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { message = "Invalid token" });

        try
        {
            var report = await _scoringService.GenerateReportAsync(sessionId, userId);
            return Ok(new { 
                message = "PDF generation should be done client-side using jsPDF",
                report
            });
        }
        catch
        {
            return NotFound(new { message = "Report not found" });
        }
    }

    // Constructs complete report with all metrics and per-question data
    private async Task<ActionResult<ReportResponse>> BuildReportResponse(Models.InterviewReport report)
    {
        var session = await _context.InterviewSessions
            .Include(s => s.Answers)
            .Include(s => s.JobEmail)
            .FirstOrDefaultAsync(s => s.SessionId == report.SessionId);

        var questions = await _context.Questions
            .Where(q => session!.Answers.Select(a => a.QuestionId).Contains(q.QuestionId))
            .ToListAsync();

        var confidenceMetrics = await _context.ConfidenceMetrics
            .Where(c => c.SessionId == report.SessionId)
            .ToListAsync();

        var duration = session!.EndTime.HasValue
            ? (int)(session.EndTime.Value - session.StartTime).TotalMinutes
            : 0;

        // Parse stored JSON data for detailed metrics
        var strengths = new List<string>();
        var improvements = new List<string>();
        var speechMetrics = new SpeechMetricsBreakdown();
        var visualMetrics = new VisualMetricsBreakdown();

        try
        {
            strengths = JsonSerializer.Deserialize<List<string>>(report.Strengths) ?? new List<string>();
            improvements = JsonSerializer.Deserialize<List<string>>(report.Improvements) ?? new List<string>();
            
            if (!string.IsNullOrEmpty(report.DetailedMetrics))
            {
                var detailed = JsonSerializer.Deserialize<JsonElement>(report.DetailedMetrics);
                if (detailed.TryGetProperty("speechMetrics", out var speech))
                    speechMetrics = JsonSerializer.Deserialize<SpeechMetricsBreakdown>(speech.GetRawText()) ?? new SpeechMetricsBreakdown();
                if (detailed.TryGetProperty("visualMetrics", out var visual))
                    visualMetrics = JsonSerializer.Deserialize<VisualMetricsBreakdown>(visual.GetRawText()) ?? new VisualMetricsBreakdown();
            }
        }
        catch { }

        // Build per-question report items
        var questionItems = session.Answers.Select(answer =>
        {
            var question = questions.FirstOrDefault(q => q.QuestionId == answer.QuestionId);
            var metric = confidenceMetrics.FirstOrDefault(c => c.QuestionId == answer.QuestionId);

            return new QuestionReportItem
            {
                QuestionId = answer.QuestionId,
                QuestionText = question?.QuestionText ?? "",
                AnswerText = answer.TranscriptText,
                ConfidenceScore = 0,
                SpeechScore = 0,
                VisualScore = 0,
                WordCount = answer.WordCount,
                WPM = Math.Round(answer.SpeakingPaceWPM, 1),
                FillerWordCount = answer.FillerWordCount,
                AnswerDuration = answer.AudioDuration,
                SmileScore = metric?.SmileScore ?? 0,
                EyeContactScore = metric?.EyeContactScore ?? 0,
                NodCount = metric?.NodCount ?? 0
            };
        }).ToList();

        return Ok(new ReportResponse
        {
            ReportId = report.ReportId,
            SessionId = report.SessionId,
            UserId = report.UserId,
            JobTitle = session.JobEmail?.JobTitle,
            CompanyName = session.JobEmail?.CompanyName,
            InterviewDate = session.StartTime,
            DurationMinutes = duration,
            OverallScore = report.OverallScore,
            SpeechScore = report.SpeechScore,
            VisualScore = report.VisualScore,
            Grade = report.Grade,
            SpeechMetrics = speechMetrics,
            VisualMetrics = visualMetrics,
            Strengths = strengths,
            Improvements = improvements,
            Questions = questionItems,
            GeneratedAt = report.GeneratedAt
        });
    }
}
