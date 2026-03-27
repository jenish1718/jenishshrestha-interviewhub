using InterviewHub.API.Models;
using System.ComponentModel.DataAnnotations;

namespace InterviewHub.API.DTOs;

public class SkillDto
{
    public int SkillId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // using string representation for frontend
    public string DifficultyLevel { get; set; } = string.Empty;
    public int UsageCount { get; set; }
    public bool IsGlobal { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateSkillDto
{
    [Required]
    [MaxLength(100)]
    public string SkillName { get; set; } = string.Empty;

    [Required]
    public SkillCategory Category { get; set; }

    [Required]
    public SkillDifficulty DifficultyLevel { get; set; }

    public bool IsGlobal { get; set; } = true;
}

public class UpdateSkillDto
{
    [Required]
    [MaxLength(100)]
    public string SkillName { get; set; } = string.Empty;

    [Required]
    public SkillCategory Category { get; set; }

    [Required]
    public SkillDifficulty DifficultyLevel { get; set; }
    
    public bool IsGlobal { get; set; }
}

public class SkillStatsDto
{
    public int TotalSkills { get; set; }
    public int TechnicalSkills { get; set; }
    public int SoftSkills { get; set; }
    public int MostUsedSkillId { get; set; }
    public string MostUsedSkillName { get; set; } = string.Empty;
    public int MostUsedSkillCount { get; set; }
}
