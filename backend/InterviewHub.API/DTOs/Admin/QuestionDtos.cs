using InterviewHub.API.Models;

namespace InterviewHub.API.DTOs.Admin;

public class QuestionDto
{
    public int QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public int? SkillId { get; set; }
    public string? SkillName { get; set; }
    public bool IsAI { get; set; }
    public bool IsApproved { get; set; }
    public int? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? SampleAnswer { get; set; }
    public DateTime GeneratedAt { get; set; }
}

public class CreateQuestionDto
{
    public string QuestionText { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public QuestionDifficulty Difficulty { get; set; }
    public int? SkillId { get; set; }
    public string? SampleAnswer { get; set; }
}

public class UpdateQuestionDto
{
    public string QuestionText { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public QuestionDifficulty Difficulty { get; set; }
    public int? SkillId { get; set; }
    public string? SampleAnswer { get; set; }
}
