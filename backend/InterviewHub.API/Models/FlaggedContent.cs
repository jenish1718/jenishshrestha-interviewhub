using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterviewHub.API.Models;

public class FlaggedContent
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string ContentType { get; set; } = string.Empty; // "JobEmail", "Question", "Feedback"

    public int ContentId { get; set; }

    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

    public int? ReportedBy { get; set; }

    [ForeignKey("ReportedBy")]
    public virtual User? Reporter { get; set; }

    public int? ModeratedBy { get; set; }

    [ForeignKey("ModeratedBy")]
    public virtual User? Moderator { get; set; }

    [MaxLength(500)]
    public string? ModeratorNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ModeratedAt { get; set; }
}
