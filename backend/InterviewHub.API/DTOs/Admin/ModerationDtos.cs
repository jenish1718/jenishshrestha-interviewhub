namespace InterviewHub.API.DTOs.Admin;

public class FlaggedContentDto
{
    public int Id { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public int ContentId { get; set; }
    public string ContentPreview { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? ReportedBy { get; set; }
    public string? ReporterName { get; set; }
    public int? ModeratedBy { get; set; }
    public string? ModeratorName { get; set; }
    public string? ModeratorNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModeratedAt { get; set; }
}

public class ModerationActionDto
{
    public string? Notes { get; set; }
}
