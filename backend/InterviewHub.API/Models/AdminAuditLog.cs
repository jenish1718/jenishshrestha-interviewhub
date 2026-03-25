using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterviewHub.API.Models;

// Tracks admin actions for security auditing (login, user changes, deletions)
public class AdminAuditLog
{
    [Key]
    public int LogId { get; set; }

    [Required]
    public int AdminUserId { get; set; }

    [ForeignKey("AdminUserId")]
    public virtual User AdminUser { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty; // e.g., "Login", "DisableUser", "DeleteJobEmail"

    [MaxLength(500)]
    public string? Details { get; set; } // Additional context about the action

    public int? TargetUserId { get; set; } // User affected by the action (if applicable)

    public int? TargetEntityId { get; set; } // ID of the entity affected (JobEmail, etc.)

    [MaxLength(100)]
    public string? TargetEntityType { get; set; } // "User", "JobEmail", etc.

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
}
