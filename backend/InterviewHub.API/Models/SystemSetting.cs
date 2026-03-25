using System.ComponentModel.DataAnnotations;

namespace InterviewHub.API.Models;

public class SystemSetting
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Key { get; set; } = string.Empty;

    [Required]
    public string Value { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Type { get; set; } = "string"; // string, number, boolean, json

    [MaxLength(200)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = "General"; // General, Session, Scoring, AI, Email, Features

    public int? UpdatedBy { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
