using System.ComponentModel.DataAnnotations;

namespace InterviewHub.API.Models;

// This class represents a user account in the database.
// Each user can be either a Candidate (practicing interviews) or an Admin.
// Entity Framework maps this class to the "Users" table in SQL Server.
public class User
{
    [Key]
    public int UserId { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.Candidate;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
    
    // Password reset fields
    public string? PasswordResetToken { get; set; }
    
    public DateTime? PasswordResetTokenExpiry { get; set; }

    // Admin management fields
    public bool IsSuspended { get; set; } = false;
    
    public bool IsDeleted { get; set; } = false;
    
    public DateTime? DeletedAt { get; set; }
    
    public DateTime? LastLoginAt { get; set; }
    
    public DateTime? LastActivityAt { get; set; }

    // Navigation property
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
