using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterviewHub.API.Models
{
    // Represents the final performance report generated after an interview session.
    // Contains overall score, speech/visual breakdown, grade (A-F), and personalized feedback.
    // The ScoringService calculates these values using: 50% content, 30% speech, 20% visual.
    public class InterviewReport
    {
        [Key]
        public int ReportId { get; set; }

        [Required]
        public int SessionId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal OverallScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal SpeechScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal VisualScore { get; set; }

        [StringLength(5)]
        public string Grade { get; set; } = string.Empty;

        // JSON array of strength strings
        public string Strengths { get; set; } = "[]";

        // JSON array of improvement strings
        public string Improvements { get; set; } = "[]";

        // Detailed breakdown (JSON)
        public string? DetailedMetrics { get; set; }

        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("SessionId")]
        public virtual InterviewSession Session { get; set; } = null!;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }
}
