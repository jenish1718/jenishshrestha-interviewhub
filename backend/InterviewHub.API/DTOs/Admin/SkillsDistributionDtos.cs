namespace InterviewHub.API.DTOs.Admin;

/// <summary>
/// Stats for a single skill's interview frequency, used for the pie chart.
/// </summary>
public class SkillInterviewStatsDto
{
    public string SkillName { get; set; } = string.Empty;
    public int InterviewCount { get; set; }
    public decimal Percentage { get; set; }
}

/// <summary>
/// Response wrapper for the skills distribution endpoint.
/// </summary>
public class SkillsDistributionResponse
{
    public List<SkillInterviewStatsDto> Skills { get; set; } = new();
    public int TotalInterviews { get; set; }
    public string DateFrom { get; set; } = string.Empty;
    public string DateTo { get; set; } = string.Empty;
}
