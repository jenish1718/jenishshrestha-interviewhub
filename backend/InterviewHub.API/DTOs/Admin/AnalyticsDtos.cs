namespace InterviewHub.API.DTOs.Admin;

public class DashboardStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int TotalSessions { get; set; }
    public int TotalQuestions { get; set; }
    public int TotalSkills { get; set; }
    public decimal AverageScore { get; set; }
    public double CompletionRate { get; set; }
}

public class ChartDataDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
}

public class TimeSeriesDto
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}
