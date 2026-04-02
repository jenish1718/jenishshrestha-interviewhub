using InterviewHub.API.Services.Admin;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Admin;

[ApiController]
[Route("api/admin")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet("analytics/dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var stats = await _analyticsService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    [HttpGet("analytics/user-growth")]
    public async Task<IActionResult> GetUserGrowth([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        from ??= DateTime.UtcNow.AddMonths(-6);
        to ??= DateTime.UtcNow;
        var data = await _analyticsService.GetUserGrowthAsync(from.Value, to.Value);
        return Ok(data);
    }

    [HttpGet("analytics/session-trends")]
    public async Task<IActionResult> GetSessionTrends([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        from ??= DateTime.UtcNow.AddMonths(-6);
        to ??= DateTime.UtcNow;
        var data = await _analyticsService.GetSessionTrendsAsync(from.Value, to.Value);
        return Ok(data);
    }

    [HttpGet("analytics/skill-popularity")]
    public async Task<IActionResult> GetSkillPopularity()
    {
        var data = await _analyticsService.GetSkillPopularityAsync();
        return Ok(data);
    }

    /// <summary>
    /// GET /api/admin/analytics/skills-distribution
    /// Returns top 10 skills by interview count + Others, for pie chart.
    /// </summary>
    [HttpGet("analytics/skills-distribution")]
    public async Task<IActionResult> GetSkillsDistribution(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var data = await _analyticsService.GetSkillsDistributionAsync(from, to);
        return Ok(data);
    }
}
