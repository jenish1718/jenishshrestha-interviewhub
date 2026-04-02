using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Services.Admin;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Admin;

[ApiController]
[Route("api/admin/moderation")]
public class ModerationController : ControllerBase
{
    private readonly IContentModerationService _moderationService;

    public ModerationController(IContentModerationService moderationService)
    {
        _moderationService = moderationService;
    }

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? type = null, [FromQuery] string? status = null)
    {
        var result = await _moderationService.GetModerationQueueAsync(page, pageSize, type, status);
        return Ok(new { Data = result.Items, TotalCount = result.TotalCount, Page = page, PageSize = pageSize });
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ModerationActionDto dto)
    {
        var result = await _moderationService.ApproveContentAsync(id, 1, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] ModerationActionDto dto)
    {
        var result = await _moderationService.RejectContentAsync(id, 1, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _moderationService.GetModerationHistoryAsync(page, pageSize);
        return Ok(new { Data = result.Items, TotalCount = result.TotalCount, Page = page, PageSize = pageSize });
    }
}
