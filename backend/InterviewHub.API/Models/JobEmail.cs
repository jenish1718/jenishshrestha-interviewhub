using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterviewHub.API.Models;

public class JobEmail
{
    [Key]
    public int EmailId { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    [MaxLength(200)]
    public string? JobTitle { get; set; }

    [MaxLength(200)]
    public string? CompanyName { get; set; }

    [Required]
    public string EmailContent { get; set; } = string.Empty;

    // Cleaned/normalized content
    public string? CleanedContent { get; set; }

    public DateTime UploadDate { get; set; } = DateTime.UtcNow;

    // Store parsed data as JSON strings
    public string? ParsedSkills { get; set; }
    public string? Responsibilities { get; set; }
    public string? RequiredQualifications { get; set; }
    public string? PreferredSkills { get; set; }
    public string? JobDescription { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "Pending"; // Pending, Parsed, Failed

    public string? ParseError { get; set; }

    [MaxLength(255)]
    public string? OriginalFileName { get; set; }

    [MaxLength(50)]
    public string? FileType { get; set; } // txt, pdf, eml, or paste

    public DateTime? ParsedAt { get; set; }
    
    // Computed fields for admin
    public DateTime? ProcessedAt { get; set; }
    public string? RawEmailContent { get; set; }
}

