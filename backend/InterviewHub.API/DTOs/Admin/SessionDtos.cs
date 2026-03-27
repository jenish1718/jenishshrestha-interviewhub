namespace InterviewHub.API.DTOs.Admin;

public class SessionListDto
{
    public int SessionId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalQuestions { get; set; }
    public int AnsweredQuestions { get; set; }
    public decimal? OverallScore { get; set; }
}

public class SessionDetailDto : SessionListDto
{
    public string JobTitle { get; set; } = string.Empty;
    public int EmailId { get; set; }
    public List<SessionAnswerDto> Answers { get; set; } = new();
}

public class SessionAnswerDto
{
    public int AnswerId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string? TranscriptText { get; set; }
    public int AudioDuration { get; set; }
    public int WordCount { get; set; }
    public int FillerWordCount { get; set; }
    public decimal SpeakingPaceWPM { get; set; }
    public DateTime AnsweredAt { get; set; }
}

public class SessionStatsDto
{
    public int TotalSessions { get; set; }
    public int CompletedSessions { get; set; }
    public int InProgressSessions { get; set; }
    public int AbandonedSessions { get; set; }
    public decimal AverageScore { get; set; }
    public double CompletionRate { get; set; }
}
