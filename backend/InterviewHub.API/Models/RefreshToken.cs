using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterviewHub.API.Models;

public class RefreshToken
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsRevoked { get; set; } = false;

    public DateTime? RevokedAt { get; set; }

    // Foreign key
    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    
    public bool IsActive => !IsRevoked && !IsExpired;
}
