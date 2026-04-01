/*
 * InterviewSessionController.cs - Interview Session Management
 * Manages the complete interview lifecycle: starting sessions, submitting answers,
 * tracking progress, and completing interviews with auto-report generation.
 */

using System.Security.Claims;
using InterviewHub.API.Data;
using InterviewHub.API.DTOs.Candidate;
using InterviewHub.API.Models;
using InterviewHub.API.Services.Candidate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Controllers.Candidate;

[ApiController]
[Route("api/sessions")]
[Authorize]
public class InterviewSessionController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IGeminiAIService _geminiService;
    private readonly IScoringService _scoringService;
    private readonly IQuestionService _questionService;
    private readonly ILogger<InterviewSessionController> _logger;

    public InterviewSessionController(
        ApplicationDbContext context,
        IGeminiAIService geminiService,
        IScoringService scoringService,
        IQuestionService questionService,
        ILogger<InterviewSessionController> logger)
    {
        _context = context;
        _geminiService = geminiService;
        _scoringService = scoringService;
        _questionService = questionService;
        _logger = logger;
    }

    // Starts new session; extracts skills and generates questions via AI
    [HttpPost("start")]
    public async Task<ActionResult<SessionResponse>> StartSession([FromBody] StartSessionRequest request)
    {
        try
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Invalid token");

            var jobEmail = await _context.JobEmails
                .FirstOrDefaultAsync(e => e.EmailId == request.EmailId && e.UserId == userId);

            if (jobEmail == null)
                return NotFound("Job email not found");

            // Get or extract skills for the job posting
            var skills = await _context.Skills
                .Where(s => s.EmailId == request.EmailId)
                .Select(s => s.SkillName)
                .ToListAsync();

            if (!skills.Any())
            {
                // Use Gemini AI to extract skills from job description
                var extractedSkills = await _geminiService.ExtractSkillsAsync(jobEmail.EmailContent);
                foreach (var skill in extractedSkills)
                {
                    var newSkill = new Skill
                    {
                        EmailId = request.EmailId,
                        SkillName = skill.SkillName,
                        Category = Enum.TryParse<SkillCategory>(skill.Category, out var cat) ? cat : SkillCategory.Technical,
                        Confidence = skill.Confidence
                    };
                    _context.Skills.Add(newSkill);
                }
                await _context.SaveChangesAsync();
                skills = extractedSkills.Select(s => s.SkillName).ToList();
            }

            // Generate personalized interview questions using Gemini AI
            var questionsPerSkill = Math.Max(1, request.QuestionCount / Math.Max(1, skills.Count));
            var generatedQuestions = await _geminiService.GenerateQuestionsAsync(
                jobEmail.EmailContent, 
                skills, 
                questionsPerSkill);

            // Persist questions to database
            var savedQuestions = new List<Question>();
            foreach (var gq in generatedQuestions.Take(request.QuestionCount))
            {
                var skill = await _context.Skills
                    .FirstOrDefaultAsync(s => s.EmailId == request.EmailId && s.SkillName == gq.SkillName);

                var question = new Question
                {
                    EmailId = request.EmailId,
                    SkillId = skill?.SkillId,
                    QuestionText = gq.QuestionText,
                    QuestionType = Enum.TryParse<QuestionType>(gq.QuestionType, out var qt) ? qt : QuestionType.Technical,
                    Difficulty = Enum.TryParse<QuestionDifficulty>(gq.Difficulty, out var qd) ? qd : QuestionDifficulty.Medium,
                    SampleAnswer = gq.SampleAnswer
                };
                _context.Questions.Add(question);
                savedQuestions.Add(question);
            }
            await _context.SaveChangesAsync();

            // Create interview session record
            var session = new InterviewSession
            {
                UserId = userId.Value,
                EmailId = request.EmailId,
                TotalQuestions = savedQuestions.Count,
                Status = SessionStatus.InProgress
            };
            _context.InterviewSessions.Add(session);
            await _context.SaveChangesAsync();

            // Build response with session details and questions
            var response = new SessionResponse
            {
                SessionId = session.SessionId,
                EmailId = session.EmailId,
                JobTitle = jobEmail.JobTitle,
                CompanyName = jobEmail.CompanyName,
                StartTime = session.StartTime,
                Status = session.Status.ToString(),
                TotalQuestions = session.TotalQuestions,
                CurrentQuestionIndex = 0,
                Questions = savedQuestions.Select((q, idx) => new SessionQuestionDto
                {
                    QuestionId = q.QuestionId,
                    QuestionText = q.QuestionText,
                    QuestionType = q.QuestionType.ToString(),
                    Difficulty = q.Difficulty.ToString(),
                    SkillName = q.Skill?.SkillName,
                    SampleAnswer = q.SampleAnswer
                }).ToList(),
                Answers = new List<SessionAnswerDto>()
            };

            _logger.LogInformation("Session {SessionId} started with {Count} questions", 
                session.SessionId, savedQuestions.Count);

            // Record question history for the user
            foreach (var q in savedQuestions)
            {
                await _questionService.RecordQuestionHistoryAsync(userId.Value, session.SessionId, q.QuestionId, null);
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting session");
            return StatusCode(500, "Failed to start session");
        }
    }

    // Stores user's spoken answer with speech metrics (WPM, fillers, etc.)
    [HttpPost("{sessionId}/answer")]
    public async Task<ActionResult<SessionAnswerDto>> SubmitAnswer(
        int sessionId, 
        [FromBody] SubmitAnswerRequest request)
    {
        try
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Invalid token");

            var session = await _context.InterviewSessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound("Session not found");

            if (session.Status != SessionStatus.InProgress)
                return BadRequest("Session is not in progress");

            // Update existing answer or create new one
            var existingAnswer = await _context.SessionAnswers
                .FirstOrDefaultAsync(a => a.SessionId == sessionId && a.QuestionId == request.QuestionId);

            if (existingAnswer != null)
            {
                existingAnswer.TranscriptText = request.TranscriptText;
                existingAnswer.AudioDuration = request.AudioDuration;
                existingAnswer.WordCount = request.WordCount;
                existingAnswer.FillerWordCount = request.FillerWordCount;
                existingAnswer.SpeakingPaceWPM = request.SpeakingPaceWPM;
                existingAnswer.PauseCount = request.PauseCount;
                existingAnswer.TotalPauseDuration = request.TotalPauseDuration;
                existingAnswer.DetectedFillerWords = request.DetectedFillerWords;
                existingAnswer.AnsweredAt = DateTime.UtcNow;
            }
            else
            {
                existingAnswer = new SessionAnswer
                {
                    SessionId = sessionId,
                    QuestionId = request.QuestionId,
                    TranscriptText = request.TranscriptText,
                    AudioDuration = request.AudioDuration,
                    WordCount = request.WordCount,
                    FillerWordCount = request.FillerWordCount,
                    SpeakingPaceWPM = request.SpeakingPaceWPM,
                    PauseCount = request.PauseCount,
                    TotalPauseDuration = request.TotalPauseDuration,
                    DetectedFillerWords = request.DetectedFillerWords
                };
                _context.SessionAnswers.Add(existingAnswer);
            }

            await _context.SaveChangesAsync();

            // Save confidence metrics from webcam analysis
            var existingMetric = await _context.ConfidenceMetrics
                .FirstOrDefaultAsync(c => c.SessionId == sessionId && c.QuestionId == request.QuestionId);

            if (existingMetric != null)
            {
                existingMetric.SmileScore = request.SmileScore;
                existingMetric.EyeContactScore = request.EyeContactScore;
                existingMetric.NodCount = request.NodCount;
                existingMetric.HeadPoseScore = request.HeadPoseScore;
                existingMetric.AnalysisTimestamp = DateTime.UtcNow;
            }
            else
            {
                _context.ConfidenceMetrics.Add(new ConfidenceMetrics
                {
                    SessionId = sessionId,
                    QuestionId = request.QuestionId,
                    SmileScore = request.SmileScore,
                    EyeContactScore = request.EyeContactScore,
                    NodCount = request.NodCount,
                    HeadPoseScore = request.HeadPoseScore,
                    AnalysisTimestamp = DateTime.UtcNow
                });
            }
            await _context.SaveChangesAsync();

            var question = await _context.Questions.FindAsync(request.QuestionId);

            return Ok(new SessionAnswerDto
            {
                AnswerId = existingAnswer.AnswerId,
                QuestionId = existingAnswer.QuestionId,
                QuestionText = question?.QuestionText ?? "",
                TranscriptText = existingAnswer.TranscriptText,
                AudioDuration = existingAnswer.AudioDuration,
                WordCount = existingAnswer.WordCount,
                FillerWordCount = existingAnswer.FillerWordCount,
                SpeakingPaceWPM = existingAnswer.SpeakingPaceWPM,
                PauseCount = existingAnswer.PauseCount,
                TotalPauseDuration = existingAnswer.TotalPauseDuration,
                DetectedFillerWords = existingAnswer.DetectedFillerWords,
                AnsweredAt = existingAnswer.AnsweredAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error submitting answer for session {SessionId}", sessionId);
            return StatusCode(500, "Failed to submit answer");
        }
    }

    // Updates which question user is currently on
    [HttpPut("{sessionId}/progress")]
    public async Task<ActionResult> UpdateProgress(
        int sessionId, 
        [FromBody] UpdateProgressRequest request)
    {
        try
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Invalid token");

            var session = await _context.InterviewSessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound("Session not found");

            session.CurrentQuestionIndex = request.CurrentQuestionIndex;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Progress updated", currentIndex = request.CurrentQuestionIndex });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating progress for session {SessionId}", sessionId);
            return StatusCode(500, "Failed to update progress");
        }
    }

    // Marks session complete and triggers report generation
    [HttpPut("{sessionId}/complete")]
    public async Task<ActionResult<SessionSummaryDto>> CompleteSession(int sessionId)
    {
        try
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Invalid token");

            var session = await _context.InterviewSessions
                .Include(s => s.JobEmail)
                .Include(s => s.Answers)
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound("Session not found");

            // Mark session as completed
            session.Status = SessionStatus.Completed;
            session.EndTime = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Auto-generate performance report
            try
            {
                await _scoringService.GenerateReportAsync(sessionId, userId.Value);
                _logger.LogInformation("Report generated for session {SessionId}", sessionId);
            }
            catch (Exception reportEx)
            {
                _logger.LogWarning(reportEx, "Report generation failed for session {SessionId}", sessionId);
            }

            // Calculate session statistics
            var answers = session.Answers?.ToList() ?? new List<SessionAnswer>();
            var summary = new SessionSummaryDto
            {
                SessionId = session.SessionId,
                JobTitle = session.JobEmail?.JobTitle,
                CompanyName = session.JobEmail?.CompanyName,
                StartTime = session.StartTime,
                EndTime = session.EndTime,
                TotalDurationMinutes = session.EndTime.HasValue 
                    ? (int)(session.EndTime.Value - session.StartTime).TotalMinutes 
                    : 0,
                TotalQuestions = session.TotalQuestions,
                QuestionsAnswered = answers.Count,
                AverageWPM = answers.Any() ? answers.Average(a => a.SpeakingPaceWPM) : 0,
                TotalFillerWords = answers.Sum(a => a.FillerWordCount),
                TotalWordCount = answers.Sum(a => a.WordCount),
                AverageAnswerDuration = answers.Any() ? (decimal)answers.Average(a => a.AudioDuration) : 0
            };

            _logger.LogInformation("Session {SessionId} completed with {Count} answers", sessionId, answers.Count);

            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing session {SessionId}", sessionId);
            return StatusCode(500, new { message = "Failed to complete session", error = ex.Message });
        }
    }

    // Returns session details with all questions and answers
    [HttpGet("{sessionId}")]
    public async Task<ActionResult<SessionResponse>> GetSession(int sessionId)
    {
        try
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Invalid token");

            var session = await _context.InterviewSessions
                .Include(s => s.JobEmail)
                .Include(s => s.Answers)
                    .ThenInclude(a => a.Question)
                        .ThenInclude(q => q.Skill)
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound("Session not found");

            // Get questions specific to THIS session via history table
            var sessionQuestionIds = await _context.UserQuestionHistories
                .Where(h => h.SessionId == sessionId && h.UserId == userId)
                .Select(h => h.QuestionId)
                .ToListAsync();

            var allQuestions = await _context.Questions
                .Include(q => q.Skill)
                .Where(q => sessionQuestionIds.Contains(q.QuestionId))
                .ToListAsync();

            // Fallback: if no history entries, use answer-based lookup
            if (!allQuestions.Any() && session.Answers.Any())
            {
                allQuestions = await _context.Questions
                    .Include(q => q.Skill)
                    .Where(q => session.Answers.Select(a => a.QuestionId).Contains(q.QuestionId))
                    .ToListAsync();
            }

            // Final fallback: use EmailId-based lookup (legacy behavior)
            if (!allQuestions.Any())
            {
                allQuestions = await _context.Questions
                    .Include(q => q.Skill)
                    .Where(q => q.EmailId == session.EmailId)
                    .OrderByDescending(q => q.QuestionId)
                    .Take(session.TotalQuestions)
                    .ToListAsync();
            }

            var response = new SessionResponse
            {
                SessionId = session.SessionId,
                EmailId = session.EmailId,
                JobTitle = session.JobEmail?.JobTitle,
                CompanyName = session.JobEmail?.CompanyName,
                StartTime = session.StartTime,
                EndTime = session.EndTime,
                Status = session.Status.ToString(),
                TotalQuestions = session.TotalQuestions,
                CurrentQuestionIndex = session.CurrentQuestionIndex,
                Questions = allQuestions.Take(session.TotalQuestions).Select(q => new SessionQuestionDto
                {
                    QuestionId = q.QuestionId,
                    QuestionText = q.QuestionText,
                    QuestionType = q.QuestionType.ToString(),
                    Difficulty = q.Difficulty.ToString(),
                    SkillName = q.Skill?.SkillName,
                    SampleAnswer = q.SampleAnswer
                }).ToList(),
                Answers = session.Answers.Select(a => new SessionAnswerDto
                {
                    AnswerId = a.AnswerId,
                    QuestionId = a.QuestionId,
                    QuestionText = a.Question?.QuestionText ?? "",
                    TranscriptText = a.TranscriptText,
                    AudioDuration = a.AudioDuration,
                    WordCount = a.WordCount,
                    FillerWordCount = a.FillerWordCount,
                    SpeakingPaceWPM = a.SpeakingPaceWPM,
                    PauseCount = a.PauseCount,
                    TotalPauseDuration = a.TotalPauseDuration,
                    DetectedFillerWords = a.DetectedFillerWords,
                    AnsweredAt = a.AnsweredAt
                }).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting session {SessionId}", sessionId);
            return StatusCode(500, "Failed to get session details");
        }
    }

    // Lists all sessions for current user with summary stats
    [HttpGet("user")]
    public async Task<ActionResult<UserSessionsResponse>> GetUserSessions()
    {
        try
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Invalid token");

            var sessions = await _context.InterviewSessions
                .Include(s => s.JobEmail)
                .Include(s => s.Answers)
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.StartTime)
                .ToListAsync();

            var response = new UserSessionsResponse
            {
                TotalSessions = sessions.Count,
                CompletedSessions = sessions.Count(s => s.Status == SessionStatus.Completed),
                Sessions = sessions.Select(s => new SessionSummaryDto
                {
                    SessionId = s.SessionId,
                    JobTitle = s.JobEmail?.JobTitle,
                    CompanyName = s.JobEmail?.CompanyName,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    TotalDurationMinutes = s.EndTime.HasValue 
                        ? (int)(s.EndTime.Value - s.StartTime).TotalMinutes 
                        : 0,
                    TotalQuestions = s.TotalQuestions,
                    QuestionsAnswered = s.Answers.Count,
                    AverageWPM = s.Answers.Any() ? s.Answers.Average(a => a.SpeakingPaceWPM) : 0,
                    TotalFillerWords = s.Answers.Sum(a => a.FillerWordCount),
                    TotalWordCount = s.Answers.Sum(a => a.WordCount),
                    AverageAnswerDuration = s.Answers.Any() ? (decimal)s.Answers.Average(a => a.AudioDuration) : 0
                }).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user sessions");
            return StatusCode(500, "Failed to get sessions");
        }
    }

    // Marks session as abandoned (user quit early)
    [HttpDelete("{sessionId}")]
    public async Task<ActionResult> AbandonSession(int sessionId)
    {
        try
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Invalid token");

            var session = await _context.InterviewSessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound("Session not found");

            session.Status = SessionStatus.Abandoned;
            session.EndTime = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Session {SessionId} abandoned", sessionId);

            return Ok(new { message = "Session abandoned" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error abandoning session {SessionId}", sessionId);
            return StatusCode(500, "Failed to abandon session");
        }
    }

    // Extracts user ID from JWT claims
    private int? GetUserIdFromToken()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out var userId))
            return userId;
        return null;
    }
}
