using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterviewHub.API.Models;

/// <summary>
/// Tracks when a user encounters a specific question during an interview session.
/// Used for the "My Questions" feature, allowing users to review past questions by skill.
/// </summary>
public class UserQuestionHistory
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [Required]
    public int QuestionId { get; set; }

    [ForeignKey("QuestionId")]
    public virtual Question Question { get; set; } = null!;

    public int? SessionId { get; set; }

    [ForeignKey("SessionId")]
    public virtual InterviewSession? Session { get; set; }

    public DateTime AskedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Optional: snapshot of user's answer text for quick reference
    /// </summary>
    [MaxLength(2000)]
    public string? UserAnswer { get; set; }
}
