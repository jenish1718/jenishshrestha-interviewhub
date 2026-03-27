namespace InterviewHub.API.DTOs.Admin;

public class AuditLogDto
{
    public int LogId { get; set; }
    public int AdminUserId { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public int? TargetUserId { get; set; }
    public int? TargetEntityId { get; set; }
    public string? TargetEntityType { get; set; }
    public string? IpAddress { get; set; }
    public DateTime PerformedAt { get; set; }
}

public class ActivityLogDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; }
}
