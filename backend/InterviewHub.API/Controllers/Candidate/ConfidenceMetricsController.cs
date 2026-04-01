/*
 * ConfidenceMetricsController.cs - Visual Confidence Analysis
 * Stores and retrieves visual confidence metrics from webcam analysis.
 * Tracks smile score, eye contact, head nods during interview.
 */

using InterviewHub.API.Data;
using InterviewHub.API.DTOs.Candidate;
using InterviewHub.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace InterviewHub.API.Controllers.Candidate;

[ApiController]
[Route("api/sessions/{sessionId}/confidence-metrics")]
[Authorize]
public class ConfidenceMetricsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ConfidenceMetricsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    // Stores visual confidence data from frontend face analysis
    [HttpPost]
    public async Task<ActionResult<ConfidenceMetricsResponse>> SubmitMetrics(
        int sessionId,
        [FromBody] SubmitConfidenceMetricsRequest request)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { message = "Invalid token" });

        var session = await _context.InterviewSessions
            .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

        if (session == null)
            return NotFound(new { message = "Session not found" });

        // Upsert: update existing or create new metrics record
        var existing = await _context.ConfidenceMetrics
            .FirstOrDefaultAsync(c => c.SessionId == sessionId && c.QuestionId == request.QuestionId);

        if (existing != null)
        {
            existing.SmileScore = request.SmileScore;
            existing.EyeContactScore = request.EyeContactScore;
            existing.NodCount = request.NodCount;
            existing.HeadPoseScore = request.HeadPoseScore;
            existing.AnalysisTimestamp = DateTime.UtcNow;
        }
        else
        {
            existing = new ConfidenceMetrics
            {
                SessionId = sessionId,
                QuestionId = request.QuestionId,
                SmileScore = request.SmileScore,
                EyeContactScore = request.EyeContactScore,
                NodCount = request.NodCount,
                HeadPoseScore = request.HeadPoseScore,
                AnalysisTimestamp = DateTime.UtcNow
            };
            _context.ConfidenceMetrics.Add(existing);
        }

        await _context.SaveChangesAsync();

        return Ok(new ConfidenceMetricsResponse
        {
            MetricId = existing.MetricId,
            SessionId = existing.SessionId,
            QuestionId = existing.QuestionId,
            SmileScore = existing.SmileScore,
            EyeContactScore = existing.EyeContactScore,
            NodCount = existing.NodCount,
            HeadPoseScore = existing.HeadPoseScore,
            AnalysisTimestamp = existing.AnalysisTimestamp
        });
    }

    // Returns all confidence metrics for a session
    [HttpGet]
    public async Task<ActionResult<List<ConfidenceMetricsResponse>>> GetSessionMetrics(int sessionId)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { message = "Invalid token" });

        var session = await _context.InterviewSessions
            .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

        if (session == null)
            return NotFound(new { message = "Session not found" });

        var metrics = await _context.ConfidenceMetrics
            .Where(c => c.SessionId == sessionId)
            .Select(c => new ConfidenceMetricsResponse
            {
                MetricId = c.MetricId,
                SessionId = c.SessionId,
                QuestionId = c.QuestionId,
                SmileScore = c.SmileScore,
                EyeContactScore = c.EyeContactScore,
                NodCount = c.NodCount,
                HeadPoseScore = c.HeadPoseScore,
                AnalysisTimestamp = c.AnalysisTimestamp
            })
            .ToListAsync();

        return Ok(metrics);
    }

    // Returns aggregated confidence summary for the session
    [HttpGet("summary")]
    public async Task<ActionResult<ConfidenceSummary>> GetSummary(int sessionId)
    {
        var userId = GetUserId();
        if (userId == 0)
            return Unauthorized(new { message = "Invalid token" });

        var session = await _context.InterviewSessions
            .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

        if (session == null)
            return NotFound(new { message = "Session not found" });

        var metrics = await _context.ConfidenceMetrics
            .Where(c => c.SessionId == sessionId)
            .ToListAsync();

        if (metrics.Count == 0)
        {
            return Ok(new ConfidenceSummary { QuestionsAnalyzed = 0 });
        }

        // Calculate averages across all questions
        return Ok(new ConfidenceSummary
        {
            AverageSmileScore = Math.Round(metrics.Average(m => m.SmileScore), 2),
            AverageEyeContactScore = Math.Round(metrics.Average(m => m.EyeContactScore), 2),
            TotalNodCount = metrics.Sum(m => m.NodCount),
            AverageHeadPoseScore = Math.Round(metrics.Average(m => m.HeadPoseScore), 2),
            QuestionsAnalyzed = metrics.Count
        });
    }
}
