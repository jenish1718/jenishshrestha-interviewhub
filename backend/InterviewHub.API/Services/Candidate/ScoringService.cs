// ScoringService.cs - Main scoring engine for interview performance.
// This service combines speech metrics, visual confidence, and AI content analysis
// to generate a comprehensive performance report with grades and recommendations.
// Scoring weights: 50% content quality, 30% speech metrics, 20% visual confidence.

using InterviewHub.API.Data;
using InterviewHub.API.DTOs.Candidate;
using InterviewHub.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace InterviewHub.API.Services.Candidate;

// Interface defines the contract - any class implementing this must provide these methods.
public interface IScoringService
{
    Task<ReportResponse> GenerateReportAsync(int sessionId, int userId);
    string CalculateGrade(decimal overallScore);
    decimal CalculateSpeechScore(List<SessionAnswer> answers);
    decimal CalculateVisualScore(List<ConfidenceMetrics> metrics);
}

// Main implementation of the scoring logic.
public class ScoringService : IScoringService
{
    private readonly ApplicationDbContext _context;
    private readonly IGeminiAIService _aiService;

    public ScoringService(ApplicationDbContext context, IGeminiAIService aiService)
    {
        _context = context;
        _aiService = aiService;
    }

    // Main report generation - combines all metrics and saves to database
    public async Task<ReportResponse> GenerateReportAsync(int sessionId, int userId)
    {
        var session = await _context.InterviewSessions
            .Include(s => s.Answers)
            .Include(s => s.JobEmail)
            .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.UserId == userId);

        if (session == null)
            throw new InvalidOperationException("Session not found");

        // Get ALL questions for this session (not just answered ones)
        // This ensures unanswered questions also appear in the report
        var allSessionQuestionIds = await _context.UserQuestionHistories
            .Where(h => h.SessionId == sessionId && h.UserId == userId)
            .Select(h => h.QuestionId)
            .ToListAsync();

        var questions = await _context.Questions
            .Include(q => q.Skill)
            .Where(q => allSessionQuestionIds.Contains(q.QuestionId))
            .ToListAsync();

        // Fallback: if no history entries, get questions by EmailId
        if (!questions.Any() && session.Answers.Any())
        {
            questions = await _context.Questions
                .Include(q => q.Skill)
                .Where(q => session.Answers.Select(a => a.QuestionId).Contains(q.QuestionId))
                .ToListAsync();
        }

        var confidenceMetrics = await _context.ConfidenceMetrics
            .Where(c => c.SessionId == sessionId)
            .ToListAsync();

        var answers = session.Answers?.ToList() ?? new List<SessionAnswer>();

        // Calculate speech and visual scores (from answered questions only)
        var speechScore = CalculateSpeechScore(answers);
        var visualScore = CalculateVisualScore(confidenceMetrics);

        // Build detailed breakdown metrics
        var speechMetrics = CalculateSpeechMetricsBreakdown(answers);
        var visualMetrics = CalculateVisualMetricsBreakdown(confidenceMetrics);

        var duration = session.EndTime.HasValue
            ? (int)(session.EndTime.Value - session.StartTime).TotalMinutes
            : 0;

        // Build report items for ALL questions (answered + unanswered)
        var questionItems = await BuildQuestionReportItemsAsync(
            answers, 
            questions, 
            confidenceMetrics,
            session.TotalQuestions
        );

        // Calculate overall score including AI content evaluation
        // Uses the per-question content scores for a true overall picture
        var answeredItems = questionItems.Where(q => q.AnswerStatus != "NotAnswered").ToList();
        var totalQuestionCount = questionItems.Count;
        
        decimal contentScore = 0;
        if (answeredItems.Any())
        {
            // Average content score across answered questions, penalized by unanswered ratio
            var avgContentScore = answeredItems.Average(q => q.ContentScore);
            var answerRatio = (decimal)answeredItems.Count / totalQuestionCount;
            contentScore = avgContentScore * answerRatio;
        }

        // Overall: 50% content quality, 30% speech, 20% visual
        // This matches the per-question formula and properly rewards good answers
        var overallScore = (contentScore * 0.5m) + (speechScore * 0.3m) + (visualScore * 0.2m);
        overallScore = Math.Round(Math.Max(0, Math.Min(100, overallScore)), 2);
        var grade = CalculateGrade(overallScore);

        // Generate personalized recommendations
        var (strengths, improvements) = GenerateRecommendations(speechMetrics, visualMetrics, overallScore);

        // Add recommendation about unanswered questions
        var unansweredCount = totalQuestionCount - answeredItems.Count;
        if (unansweredCount > 0)
        {
            improvements.Insert(0, $"{unansweredCount} of {totalQuestionCount} questions were not answered — try to answer all questions for a better score");
        }

        // Persist report (upsert pattern)
        var existingReport = await _context.InterviewReports
            .FirstOrDefaultAsync(r => r.SessionId == sessionId);

        var report = existingReport ?? new InterviewReport
        {
            SessionId = sessionId,
            UserId = userId,
        };

        report.OverallScore = overallScore;
        report.SpeechScore = speechScore;
        report.VisualScore = visualScore;
        report.Grade = grade;
        report.Strengths = JsonSerializer.Serialize(strengths);
        report.Improvements = JsonSerializer.Serialize(improvements);
        report.DetailedMetrics = JsonSerializer.Serialize(new { speechMetrics, visualMetrics });
        report.GeneratedAt = DateTime.UtcNow;

        if (existingReport == null)
            _context.InterviewReports.Add(report);

        await _context.SaveChangesAsync();

        return new ReportResponse
        {
            ReportId = report.ReportId,
            SessionId = sessionId,
            UserId = userId,
            JobTitle = session.JobEmail?.JobTitle,
            CompanyName = session.JobEmail?.CompanyName,
            InterviewDate = session.StartTime,
            DurationMinutes = duration,
            OverallScore = overallScore,
            SpeechScore = speechScore,
            VisualScore = visualScore,
            Grade = grade,
            SpeechMetrics = speechMetrics,
            VisualMetrics = visualMetrics,
            Strengths = strengths,
            Improvements = improvements,
            Questions = questionItems,
            GeneratedAt = report.GeneratedAt
        };
    }

    // Calculates speech score from word count, filler usage, pace, and pauses
    public decimal CalculateSpeechScore(List<SessionAnswer> answers)
    {
        if (answers == null || answers.Count == 0) return 0;

        var totalScore = 0m;

        foreach (var answer in answers)
        {
            var answerScore = 0m;

            // Answer Completeness (30%) - target: 80-150 words
            var wordCountScore = answer.WordCount switch
            {
                >= 80 and <= 150 => 100,
                >= 50 and < 80 => 70,
                >= 150 and < 200 => 80,
                >= 30 and < 50 => 50,
                > 200 => 60,
                _ => 30
            };
            answerScore += wordCountScore * 0.3m;

            // Fluency (30%) - penalize filler words
            var fillerRatio = answer.WordCount > 0 
                ? (decimal)answer.FillerWordCount / answer.WordCount 
                : 0;
            var fluencyScore = fillerRatio switch
            {
                <= 0.02m => 100,
                <= 0.05m => 80,
                <= 0.10m => 60,
                <= 0.15m => 40,
                _ => 20
            };
            answerScore += fluencyScore * 0.3m;

            // Pace (20%) - target: 120-160 WPM
            var paceScore = answer.SpeakingPaceWPM switch
            {
                >= 120 and <= 160 => 100,
                >= 100 and < 120 => 80,
                >= 160 and < 180 => 80,
                >= 80 and < 100 => 60,
                >= 180 and < 200 => 60,
                _ => 40
            };
            answerScore += paceScore * 0.2m;

            // Clarity (20%) - natural pause patterns (2-5 pauses ideal)
            var pauseScore = answer.PauseCount switch
            {
                >= 2 and <= 5 => 100,
                <= 1 => 80,
                >= 6 and <= 10 => 70,
                _ => 50
            };
            answerScore += pauseScore * 0.2m;

            totalScore += answerScore;
        }

        return Math.Round(totalScore / answers.Count, 2);
    }

    // Calculates visual confidence from eye contact, smile, and nods
    public decimal CalculateVisualScore(List<ConfidenceMetrics> metrics)
    {
        if (metrics == null || metrics.Count == 0) 
            return 50; // Default when no webcam data available

        var totalScore = 0m;

        foreach (var metric in metrics)
        {
            var metricScore = 0m;

            // Eye Contact (50%) - most important for virtual interviews
            metricScore += metric.EyeContactScore * 0.5m;

            // Smile/Facial Expression (30%)
            metricScore += metric.SmileScore * 0.3m;

            // Head Nods (20%) - optimal: 2-5 nods per answer
            decimal nodScore = metric.NodCount switch
            {
                >= 2 and <= 5 => 100,
                1 => 70,
                >= 6 and <= 8 => 80,
                0 => 50,
                _ => 60
            };
            metricScore += nodScore * 0.2m;

            totalScore += metricScore;
        }

        return Math.Round(totalScore / metrics.Count, 2);
    }

    // Maps score to letter grade (interview-appropriate scale)
    public string CalculateGrade(decimal overallScore)
    {
        return overallScore switch
        {
            >= 90 => "A+",
            >= 80 => "A",
            >= 70 => "B+",
            >= 60 => "B",
            >= 50 => "C",
            >= 40 => "D",
            _ => "F"
        };
    }

    // Builds detailed speech metrics for report
    private SpeechMetricsBreakdown CalculateSpeechMetricsBreakdown(List<SessionAnswer> answers)
    {
        if (answers == null || answers.Count == 0)
            return new SpeechMetricsBreakdown();

        var avgWPM = answers.Average(a => a.SpeakingPaceWPM);
        var totalFillers = answers.Sum(a => a.FillerWordCount);
        var totalWords = answers.Sum(a => a.WordCount);
        var avgDuration = (decimal)answers.Average(a => a.AudioDuration);

        var avgWordCount = totalWords / answers.Count;
        var fillerRatio = totalWords > 0 ? (decimal)totalFillers / totalWords : 0;

        return new SpeechMetricsBreakdown
        {
            AverageWPM = Math.Round(avgWPM, 1),
            TotalFillerWords = totalFillers,
            TotalWordCount = totalWords,
            AverageAnswerDuration = Math.Round(avgDuration, 1),
            FluencyScore = Math.Round(100 - (fillerRatio * 500), 2),
            PaceScore = CalculatePaceScore(avgWPM),
            CompletenessScore = CalculateCompletenessScore(avgWordCount),
            ClarityScore = 75 // Placeholder - would need audio analysis
        };
    }

    // Builds detailed visual metrics for report
    private VisualMetricsBreakdown CalculateVisualMetricsBreakdown(List<ConfidenceMetrics> metrics)
    {
        if (metrics == null || metrics.Count == 0)
            return new VisualMetricsBreakdown { EngagementScore = 50 };

        var avgSmile = metrics.Average(m => m.SmileScore);
        var avgEyeContact = metrics.Average(m => m.EyeContactScore);
        var avgHeadPose = metrics.Average(m => m.HeadPoseScore);
        var avgNodCount = (decimal)metrics.Average(m => m.NodCount);

        return new VisualMetricsBreakdown
        {
            AverageSmileScore = Math.Round(avgSmile, 1),
            AverageEyeContactScore = Math.Round(avgEyeContact, 1),
            TotalNodCount = metrics.Sum(m => m.NodCount),
            AverageHeadPoseScore = Math.Round(avgHeadPose, 1),
            EngagementScore = Math.Round(
                (avgEyeContact * 0.5m) +
                (avgSmile * 0.3m) +
                (Math.Min(avgNodCount, 5) * 20 * 0.2m), 
                1)
        };
    }

    private decimal CalculatePaceScore(decimal avgWPM) => avgWPM switch
    {
        >= 120 and <= 160 => 100,
        >= 100 and < 120 => 80,
        >= 160 and < 180 => 80,
        >= 80 and < 100 => 60,
        >= 180 and < 200 => 60,
        _ => 40
    };

    private decimal CalculateCompletenessScore(int avgWordCount) => avgWordCount switch
    {
        >= 80 and <= 150 => 100,
        >= 60 and < 80 => 80,
        >= 150 and < 200 => 85,
        >= 40 and < 60 => 60,
        > 200 => 70,
        _ => 40
    };

    // Generates personalized feedback based on performance
    private (List<string> Strengths, List<string> Improvements) GenerateRecommendations(
        SpeechMetricsBreakdown speech, 
        VisualMetricsBreakdown visual,
        decimal overallScore)
    {
        var strengths = new List<string>();
        var improvements = new List<string>();

        // Speech-based feedback
        if (speech.AverageWPM >= 120 && speech.AverageWPM <= 160)
            strengths.Add("Excellent speaking pace - clear and easy to follow");
        else if (speech.AverageWPM < 100)
            improvements.Add("Try to speak a bit faster to maintain engagement (target: 120-160 WPM)");
        else if (speech.AverageWPM > 180)
            improvements.Add("Slow down slightly for better clarity (target: 120-160 WPM)");

        if (speech.TotalFillerWords <= 5)
            strengths.Add("Minimal use of filler words - shows confidence and preparation");
        else if (speech.TotalFillerWords > 15)
            improvements.Add($"Reduce filler words like 'um', 'uh', 'like' (used {speech.TotalFillerWords} times)");

        if (speech.CompletenessScore >= 80)
            strengths.Add("Comprehensive answers with good detail");
        else
            improvements.Add("Provide more detailed answers (target: 80-150 words per answer)");

        // Visual-based feedback
        if (visual.AverageEyeContactScore >= 70)
            strengths.Add("Excellent eye contact - shows confidence and engagement");
        else if (visual.AverageEyeContactScore < 50)
            improvements.Add("Maintain more consistent eye contact with the camera");

        if (visual.AverageSmileScore >= 50)
            strengths.Add("Good facial expressions - appears approachable and positive");
        else
            improvements.Add("Try to smile more naturally to appear more approachable");

        if (visual.TotalNodCount > 0)
            strengths.Add("Good use of head nods to show active listening");
        else
            improvements.Add("Use subtle head nods to show engagement and understanding");

        if (overallScore >= 85)
            strengths.Add("Overall strong interview performance!");

        return (strengths, improvements);
    }

    // Builds per-question analysis with AI-powered content evaluation
    // Includes ALL questions — answered ones get AI evaluation, unanswered get "NotAnswered" status
    private async Task<List<QuestionReportItem>> BuildQuestionReportItemsAsync(
        List<SessionAnswer> answers,
        List<Question> questions,
        List<ConfidenceMetrics> metrics,
        int totalQuestions)
    {
        var items = new List<QuestionReportItem>();

        // Process all questions (both answered and unanswered)
        foreach (var question in questions.Take(totalQuestions))
        {
            var answer = answers.FirstOrDefault(a => a.QuestionId == question.QuestionId);
            var metric = metrics.FirstOrDefault(m => m.QuestionId == question.QuestionId);

            if (answer != null && !string.IsNullOrWhiteSpace(answer.TranscriptText))
            {
                // ANSWERED question — evaluate with AI
                var speechScore = CalculateSpeechScore(new List<SessionAnswer> { answer });
                var visualScore = metric != null 
                    ? CalculateVisualScore(new List<ConfidenceMetrics> { metric }) 
                    : 50;

                // Get AI evaluation for content quality
                var aiEvaluation = await _aiService.EvaluateAnswerAsync(
                    question.QuestionText,
                    answer.TranscriptText,
                    question.SampleAnswer
                );

                var contentScore = (decimal)aiEvaluation.Score;

                // Combined scoring: 50% content, 30% speech, 20% visual
                var overallScore = (contentScore * 0.5m) + (speechScore * 0.3m) + (visualScore * 0.2m);

                items.Add(new QuestionReportItem
                {
                    QuestionId = question.QuestionId,
                    QuestionText = question.QuestionText,
                    AnswerText = answer.TranscriptText,
                    
                    // Scores
                    ConfidenceScore = Math.Round(overallScore, 1),
                    ContentScore = Math.Round(contentScore, 1),
                    SpeechScore = Math.Round(speechScore, 1),
                    VisualScore = Math.Round(visualScore, 1),
                    
                    // Speech metrics
                    WordCount = answer.WordCount,
                    WPM = Math.Round(answer.SpeakingPaceWPM, 1),
                    FillerWordCount = answer.FillerWordCount,
                    AnswerDuration = answer.AudioDuration,
                    
                    // Visual metrics  
                    SmileScore = metric?.SmileScore ?? 0,
                    EyeContactScore = metric?.EyeContactScore ?? 0,
                    NodCount = metric?.NodCount ?? 0,
                    
                    // AI feedback
                    Feedback = aiEvaluation.Feedback,
                    Strengths = aiEvaluation.Strengths ?? new List<string>(),
                    Improvements = aiEvaluation.Improvements ?? new List<string>(),
                    Tip = GenerateTip(speechScore, visualScore, answer.FillerWordCount, answer.SpeakingPaceWPM),
                    SampleAnswer = aiEvaluation.IdealAnswer ?? question.SampleAnswer,

                    // Answer marking based on AI content score
                    AnswerStatus = contentScore switch
                    {
                        >= 70 => "Correct",
                        >= 40 => "Partial",
                        > 0 => "Incorrect",
                        _ => "NotEvaluated"
                    }
                });
            }
            else
            {
                // UNANSWERED question — mark as NotAnswered with zero scores
                items.Add(new QuestionReportItem
                {
                    QuestionId = question.QuestionId,
                    QuestionText = question.QuestionText,
                    AnswerText = null,
                    
                    ConfidenceScore = 0,
                    ContentScore = 0,
                    SpeechScore = 0,
                    VisualScore = 0,
                    
                    WordCount = 0,
                    WPM = 0,
                    FillerWordCount = 0,
                    AnswerDuration = 0,
                    
                    SmileScore = 0,
                    EyeContactScore = 0,
                    NodCount = 0,
                    
                    Feedback = "No answer was provided for this question.",
                    Strengths = new List<string>(),
                    Improvements = new List<string> { "Make sure to answer all questions to improve your overall score" },
                    Tip = "Try to provide an answer, even a brief one, for every question",
                    SampleAnswer = question.SampleAnswer,
                    AnswerStatus = "NotAnswered"
                });
            }
        }

        return items;
    }

    // Generates contextual tip for specific answer
    private string? GenerateTip(decimal speechScore, decimal visualScore, int fillers, decimal wpm)
    {
        if (fillers > 3)
            return "Try to reduce filler words in this answer";
        if (wpm < 100)
            return "Speak with more confidence and energy";
        if (wpm > 180)
            return "Slow down slightly for better clarity";
        if (visualScore < 50)
            return "Maintain better eye contact with the camera";
        if (speechScore >= 90 && visualScore >= 80)
            return "Excellent answer! Keep up this performance";
        
        return null;
    }
}
