using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterviewHub.API.Models;

// Enum to track the current state of an interview session.
// InProgress = user is answering questions, Completed = finished, Abandoned = user left early.
public enum SessionStatus
{
    InProgress,
    Completed,
    Abandoned
}

// This class represents one mock interview attempt by a user.
// It links the user to a specific job posting and tracks their progress through questions.
// Maps to the "InterviewSessions" table in SQL Server.
public class InterviewSession
{
    [Key]
    public int SessionId { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [Required]
    public int EmailId { get; set; }

    [ForeignKey("EmailId")]
    public virtual JobEmail JobEmail { get; set; } = null!;

    public DateTime StartTime { get; set; } = DateTime.UtcNow;

    public DateTime? EndTime { get; set; }

    public SessionStatus Status { get; set; } = SessionStatus.InProgress;

    public int TotalQuestions { get; set; }

    public int CurrentQuestionIndex { get; set; } = 0;

    // Navigation property for answers
    public virtual ICollection<SessionAnswer> Answers { get; set; } = new List<SessionAnswer>();
}
