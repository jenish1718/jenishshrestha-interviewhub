namespace InterviewHub.API.DTOs.Admin;

public class SettingDto
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

public class UpdateSettingDto
{
    public string Value { get; set; } = string.Empty;
}
