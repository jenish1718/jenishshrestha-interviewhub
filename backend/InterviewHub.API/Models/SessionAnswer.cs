using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterviewHub.API.Models;

// Stores the user's answer for a single question during an interview session.
// Includes the transcribed text from speech-to-text and speaking metrics.
// This data is used to calculate the speech score in the final report.
public class SessionAnswer
{
    [Key]
    public int AnswerId { get; set; }

    [Required]
    public int SessionId { get; set; }

    [ForeignKey("SessionId")]
    public virtual InterviewSession Session { get; set; } = null!;

    [Required]
    public int QuestionId { get; set; }

    [ForeignKey("QuestionId")]
    public virtual Question Question { get; set; } = null!;

    // Speech-to-text transcript of the user's answer
    public string? TranscriptText { get; set; }

    // Audio/speaking metrics
    public int AudioDuration { get; set; } // Duration in seconds

    public int WordCount { get; set; }

    public int FillerWordCount { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal SpeakingPaceWPM { get; set; } // Words per minute

    // Pause/silence metrics
    public int PauseCount { get; set; }

    public int TotalPauseDuration { get; set; } // Total pause time in seconds

    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;

    // Optional: Store detected filler words for display
    public string? DetectedFillerWords { get; set; } // JSON array of filler words found
}
