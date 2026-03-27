/*
 * UserDtos.cs - User-facing Data Transfer Objects
 * DTOs for auth, sessions, reports, skills, questions, job emails, and confidence metrics.
 * Organized by feature area for easy maintenance.
 */

using System.ComponentModel.DataAnnotations;

namespace InterviewHub.API.DTOs.Candidate;

#region Authentication DTOs

/// <summary>Standard auth response with tokens and user info</summary>
public class AuthResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? TokenExpiration { get; set; }
    public UserInfo? User { get; set; }
}

/// <summary>Authenticated user info</summary>
public class UserInfo
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

/// <summary>Login credentials</summary>
public class LoginRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; } = string.Empty;
}

/// <summary>New user registration with password requirements</summary>
public class RegisterRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$",
        ErrorMessage = "Password must contain uppercase, lowercase, number, and special character")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "First name is required")]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;
}

/// <summary>Refresh token submission</summary>
public class RefreshTokenRequest
{
    [Required(ErrorMessage = "Refresh token is required")]
    public string RefreshToken { get; set; } = string.Empty;
}

/// <summary>Password reset request (email only)</summary>
public class PasswordResetRequestDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

/// <summary>Password reset confirmation with token</summary>
public class PasswordResetConfirmDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Reset token is required")]
    public string Token { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")]
    public string NewPassword { get; set; } = string.Empty;
}

#endregion

#region Session DTOs

/// <summary>Request to start new interview session</summary>
public class StartSessionRequest
{
    [Required]
    public int EmailId { get; set; }
    public int QuestionCount { get; set; } = 10;
}

/// <summary>Session details with questions and answers</summary>
public class SessionResponse
{
    public int SessionId { get; set; }
    public int EmailId { get; set; }
    public string? JobTitle { get; set; }
    public string? CompanyName { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalQuestions { get; set; }
    public int CurrentQuestionIndex { get; set; }
    public List<SessionQuestionDto> Questions { get; set; } = new();
    public List<SessionAnswerDto> Answers { get; set; } = new();
}

/// <summary>Question info for display during interview</summary>
public class SessionQuestionDto
{
    public int QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string? SkillName { get; set; }
    public string? SampleAnswer { get; set; }
}

/// <summary>User's answer with speech metrics</summary>
public class SessionAnswerDto
{
    public int AnswerId { get; set; }
    public int QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string? TranscriptText { get; set; }
    public int AudioDuration { get; set; }
    public int WordCount { get; set; }
    public int FillerWordCount { get; set; }
    public decimal SpeakingPaceWPM { get; set; }
    public int PauseCount { get; set; }
    public int TotalPauseDuration { get; set; }
    public string? DetectedFillerWords { get; set; }
    public DateTime AnsweredAt { get; set; }
}

/// <summary>Submit answer with speech analysis data</summary>
public class SubmitAnswerRequest
{
    [Required]
    public int QuestionId { get; set; }
    public string? TranscriptText { get; set; }
    public int AudioDuration { get; set; }
    public int WordCount { get; set; }
    public int FillerWordCount { get; set; }
    public decimal SpeakingPaceWPM { get; set; }
    public int PauseCount { get; set; }
    public int TotalPauseDuration { get; set; }
    public string? DetectedFillerWords { get; set; }

    // Confidence metrics from webcam analysis
    public decimal SmileScore { get; set; }
    public decimal EyeContactScore { get; set; }
    public int NodCount { get; set; }
    public decimal HeadPoseScore { get; set; }
}

/// <summary>Update current question index</summary>
public class UpdateProgressRequest
{
    public int CurrentQuestionIndex { get; set; }
}

/// <summary>Session statistics summary</summary>
public class SessionSummaryDto
{
    public int SessionId { get; set; }
    public string? JobTitle { get; set; }
    public string? CompanyName { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int TotalDurationMinutes { get; set; }
    public int TotalQuestions { get; set; }
    public int QuestionsAnswered { get; set; }
    public decimal AverageWPM { get; set; }
    public int TotalFillerWords { get; set; }
    public int TotalWordCount { get; set; }
    public decimal AverageAnswerDuration { get; set; }
}

/// <summary>User's session history</summary>
public class UserSessionsResponse
{
    public List<SessionSummaryDto> Sessions { get; set; } = new();
    public int TotalSessions { get; set; }
    public int CompletedSessions { get; set; }
}

#endregion

#region Report DTOs

/// <summary>Full performance report with scores and feedback</summary>
public class ReportResponse
{
    public int ReportId { get; set; }
    public int SessionId { get; set; }
    public int UserId { get; set; }
    public string? JobTitle { get; set; }
    public string? CompanyName { get; set; }
    public DateTime InterviewDate { get; set; }
    public int DurationMinutes { get; set; }
    public decimal OverallScore { get; set; }
    public decimal SpeechScore { get; set; }
    public decimal VisualScore { get; set; }
    public string Grade { get; set; } = string.Empty;
    public SpeechMetricsBreakdown SpeechMetrics { get; set; } = new();
    public VisualMetricsBreakdown VisualMetrics { get; set; } = new();
    public List<string> Strengths { get; set; } = new();
    public List<string> Improvements { get; set; } = new();
    public List<QuestionReportItem> Questions { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
}

/// <summary>Speech metrics breakdown for report</summary>
public class SpeechMetricsBreakdown
{
    public decimal AverageWPM { get; set; }
    public int TotalFillerWords { get; set; }
    public int TotalWordCount { get; set; }
    public decimal AverageAnswerDuration { get; set; }
    public decimal FluencyScore { get; set; }
    public decimal PaceScore { get; set; }
    public decimal CompletenessScore { get; set; }
    public decimal ClarityScore { get; set; }
}

/// <summary>Visual confidence metrics breakdown</summary>
public class VisualMetricsBreakdown
{
    public decimal AverageSmileScore { get; set; }
    public decimal AverageEyeContactScore { get; set; }
    public int TotalNodCount { get; set; }
    public decimal AverageHeadPoseScore { get; set; }
    public decimal EngagementScore { get; set; }
}

/// <summary>Per-question analysis in report with AI evaluation</summary>
public class QuestionReportItem
{
    public int QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string? AnswerText { get; set; }
    
    // Overall scores
    public decimal ConfidenceScore { get; set; }  // Overall combined score
    public decimal ContentScore { get; set; }      // AI-evaluated answer quality (0-100)
    public decimal SpeechScore { get; set; }
    public decimal VisualScore { get; set; }
    
    // Speech metrics
    public int WordCount { get; set; }
    public decimal WPM { get; set; }
    public int FillerWordCount { get; set; }
    public int AnswerDuration { get; set; }
    
    // Visual metrics
    public decimal SmileScore { get; set; }
    public decimal EyeContactScore { get; set; }
    public int NodCount { get; set; }
    
    // AI-generated feedback
    public string? Feedback { get; set; }  // AI-generated personalized feedback
    public List<string> Strengths { get; set; } = new();  // What was good
    public List<string> Improvements { get; set; } = new();  // Areas to improve
    public string? Tip { get; set; }
    public string? SampleAnswer { get; set; }  // Ideal answer for comparison
    
    // Answer marking: "Correct", "Partial", "Incorrect", or "NotEvaluated"
    public string AnswerStatus { get; set; } = "NotEvaluated";
}

/// <summary>Report list item for history</summary>
public class ReportHistoryItem
{
    public int ReportId { get; set; }
    public int SessionId { get; set; }
    public string? JobTitle { get; set; }
    public string? CompanyName { get; set; }
    public decimal OverallScore { get; set; }
    public string Grade { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
}

/// <summary>Quick report generation response</summary>
public class GenerateReportResponse
{
    public int ReportId { get; set; }
    public decimal OverallScore { get; set; }
    public string Grade { get; set; } = string.Empty;
}

#endregion

#region Skill & Question DTOs

/// <summary>Extracted skill response</summary>
public class SkillResponse
{
    public int SkillId { get; set; }
    public int? EmailId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public float Confidence { get; set; }
    public DateTime ExtractedAt { get; set; }
    public int QuestionCount { get; set; }
}

public class SkillListResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<SkillResponse> Skills { get; set; } = new();
    public int TotalCount { get; set; }
}

public class ExtractSkillsRequest
{
    public bool ForceReExtract { get; set; } = false;
}

public class ExtractSkillsResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<SkillResponse> Skills { get; set; } = new();
    public int NewSkillsCount { get; set; }
}

/// <summary>Generated question response</summary>
public class QuestionResponse
{
    public int QuestionId { get; set; }
    public int? EmailId { get; set; }
    public int? SkillId { get; set; }
    public string? SkillName { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public bool IsFavorite { get; set; }
    public string? SampleAnswer { get; set; }
    public DateTime GeneratedAt { get; set; }
}

public class QuestionListResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<QuestionResponse> Questions { get; set; } = new();
    public int TotalCount { get; set; }
    public Dictionary<string, List<QuestionResponse>>? GroupedBySkill { get; set; }
}

public class GenerateQuestionsRequest
{
    public int? SkillId { get; set; }
    public int QuestionsPerSkill { get; set; } = 3;
}

public class GenerateQuestionsResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<QuestionResponse> Questions { get; set; } = new();
    public int NewQuestionsCount { get; set; }
}

public class UpdateQuestionRequest
{
    public string? QuestionText { get; set; }
    public string? Difficulty { get; set; }
    public bool? IsFavorite { get; set; }
}

public class QuestionSingleResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public QuestionResponse? Question { get; set; }
}

#endregion

#region Job Email DTOs

/// <summary>Upload job description request</summary>
public class UploadEmailRequest
{
    [MaxLength(200)]
    public string? JobTitle { get; set; }

    [MaxLength(200)]
    public string? CompanyName { get; set; }

    [Required(ErrorMessage = "Email content is required")]
    public string EmailContent { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? OriginalFileName { get; set; }

    [MaxLength(50)]
    public string? FileType { get; set; }
}

/// <summary>Update job email metadata</summary>
public class UpdateEmailRequest
{
    [MaxLength(200)]
    public string? JobTitle { get; set; }

    [MaxLength(200)]
    public string? CompanyName { get; set; }

    public string? EmailContent { get; set; }
}

/// <summary>Parsed job email with extracted data</summary>
public class JobEmailResponse
{
    public int EmailId { get; set; }
    public int UserId { get; set; }
    public string? JobTitle { get; set; }
    public string? CompanyName { get; set; }
    public string EmailContent { get; set; } = string.Empty;
    public string? CleanedContent { get; set; }
    public DateTime UploadDate { get; set; }
    public List<string>? ParsedSkills { get; set; }
    public List<string>? Responsibilities { get; set; }
    public List<string>? RequiredQualifications { get; set; }
    public List<string>? PreferredSkills { get; set; }
    public string? JobDescription { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ParseError { get; set; }
    public string? OriginalFileName { get; set; }
    public string? FileType { get; set; }
    public DateTime? ParsedAt { get; set; }
}

public class JobEmailListResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<JobEmailResponse> Emails { get; set; } = new();
    public int TotalCount { get; set; }
}

public class JobEmailSingleResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public JobEmailResponse? Email { get; set; }
}

#endregion

#region Confidence Metrics DTOs

/// <summary>Submit visual confidence data from webcam</summary>
public class SubmitConfidenceMetricsRequest
{
    [Required]
    public int QuestionId { get; set; }

    [Range(0, 100)]
    public decimal SmileScore { get; set; }

    [Range(0, 100)]
    public decimal EyeContactScore { get; set; }

    [Range(0, 1000)]
    public int NodCount { get; set; }

    [Range(0, 100)]
    public decimal HeadPoseScore { get; set; }
}

/// <summary>Confidence metrics response</summary>
public class ConfidenceMetricsResponse
{
    public int MetricId { get; set; }
    public int SessionId { get; set; }
    public int QuestionId { get; set; }
    public decimal SmileScore { get; set; }
    public decimal EyeContactScore { get; set; }
    public int NodCount { get; set; }
    public decimal HeadPoseScore { get; set; }
    public DateTime AnalysisTimestamp { get; set; }
}

/// <summary>Aggregated session confidence summary</summary>
public class ConfidenceSummary
{
    public decimal AverageSmileScore { get; set; }
    public decimal AverageEyeContactScore { get; set; }
    public int TotalNodCount { get; set; }
    public decimal AverageHeadPoseScore { get; set; }
    public int QuestionsAnalyzed { get; set; }
}

#endregion
