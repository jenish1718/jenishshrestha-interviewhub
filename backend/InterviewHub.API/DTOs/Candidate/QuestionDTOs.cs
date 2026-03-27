namespace InterviewHub.API.DTOs.Candidate;

/// <summary>
/// A question returned when filtering by skill.
/// </summary>
public class QuestionsBySkillDto
{
    public int QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string SkillName { get; set; } = string.Empty;
    public int UsageCount { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public string? SampleAnswer { get; set; }
}

/// <summary>
/// A record of a question the user encountered in a session.
/// </summary>
public class UserQuestionHistoryDto
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string SkillName { get; set; } = string.Empty;
    public int? SessionId { get; set; }
    public string? JobTitle { get; set; }
    public DateTime AskedAt { get; set; }
    public string? UserAnswer { get; set; }
}

/// <summary>
/// Represents a skill available for the user to filter by.
/// </summary>
public class UserSkillDto
{
    public int SkillId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
}

/// <summary>
/// Paginated response wrapper used by the questions endpoints.
/// </summary>
public class PaginatedQuestionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<QuestionsBySkillDto> Questions { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class UserQuestionHistoryResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<UserQuestionHistoryDto> History { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class UserSkillsResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<UserSkillDto> Skills { get; set; } = new();
    public int TotalCount { get; set; }
}
