using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterviewHub.API.Models
{
    // Stores visual confidence metrics captured from the user's webcam during an interview.
    // MediaPipe Face Mesh (in the frontend) detects facial landmarks and calculates these scores.
    // This data is used to calculate the visual score (eye contact, smile, posture) in the report.
    public class ConfidenceMetrics
    {
        [Key]
        public int MetricId { get; set; }

        [Required]
        public int SessionId { get; set; }

        [Required]
        public int QuestionId { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal SmileScore { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal EyeContactScore { get; set; }

        public int NodCount { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal HeadPoseScore { get; set; }

        public DateTime AnalysisTimestamp { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("SessionId")]
        public virtual InterviewSession Session { get; set; } = null!;

        [ForeignKey("QuestionId")]
        public virtual Question Question { get; set; } = null!;
    }
}
