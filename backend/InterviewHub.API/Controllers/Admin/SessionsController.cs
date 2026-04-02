using InterviewHub.API.Services.Admin;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Admin;

[ApiController]
[Route("api/admin/sessions")]
public class SessionsController : ControllerBase
{
    private readonly ISessionMonitoringService _sessionService;

    public SessionsController(ISessionMonitoringService sessionService)
    {
        _sessionService = sessionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] int? userId = null, [FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null, [FromQuery] string? status = null)
    {
        var result = await _sessionService.GetAllSessionsAsync(page, pageSize, userId, dateFrom, dateTo, status);
        return Ok(new { Data = result.Sessions, TotalCount = result.TotalCount, Page = page, PageSize = pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var session = await _sessionService.GetSessionDetailAsync(id);
        if (session == null) return NotFound();
        return Ok(session);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _sessionService.GetSessionStatsAsync();
        return Ok(stats);
    }

    [HttpGet("{id}/transcript")]
    public async Task<IActionResult> GetTranscript(int id)
    {
        var transcript = await _sessionService.GetSessionTranscriptAsync(id);
        return Ok(transcript);
    }
}
