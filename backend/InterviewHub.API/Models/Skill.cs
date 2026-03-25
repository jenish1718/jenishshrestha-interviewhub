using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InterviewHub.API.Models;

public class Skill
{
    [Key]
    public int SkillId { get; set; }

    /// <summary>
    /// Nullable for admin-created global skills
    /// </summary>
    public int? EmailId { get; set; }

    [ForeignKey("EmailId")]
    public virtual JobEmail? JobEmail { get; set; }

    [Required]
    [MaxLength(100)]
    public string SkillName { get; set; } = string.Empty;

    public SkillCategory Category { get; set; } = SkillCategory.Technical;

    public SkillDifficulty DifficultyLevel { get; set; } = SkillDifficulty.Intermediate;

    [Range(0, 1)]
    public float Confidence { get; set; } = 1.0f;

    public DateTime ExtractedAt { get; set; } = DateTime.UtcNow;

    // Admin management fields
    public bool IsDeleted { get; set; } = false;
    
    /// <summary>
    /// True for admin-created skills available to all users
    /// </summary>
    public bool IsGlobal { get; set; } = false;
    
    /// <summary>
    /// Admin who created the global skill
    /// </summary>
    public int? CreatedBy { get; set; }
}
