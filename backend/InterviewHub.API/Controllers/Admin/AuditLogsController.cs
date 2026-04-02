using InterviewHub.API.Services.Admin;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Admin;

[ApiController]
[Route("api/admin")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] int? adminId = null, [FromQuery] string? action = null, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var result = await _auditLogService.GetAuditLogsAsync(page, pageSize, adminId, action, from, to);
        return Ok(new { Data = result.Logs, TotalCount = result.TotalCount, Page = page, PageSize = pageSize });
    }

    [HttpGet("activity-logs")]
    public async Task<IActionResult> GetActivityLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] int? userId = null, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var result = await _auditLogService.GetActivityLogsAsync(page, pageSize, userId, from, to);
        return Ok(new { Data = result.Logs, TotalCount = result.TotalCount, Page = page, PageSize = pageSize });
    }

    [HttpPost("logs/export")]
    public async Task<IActionResult> ExportLogs([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var data = await _auditLogService.ExportLogsAsync(from, to);
        return File(data, "text/csv", $"audit_logs_{DateTime.UtcNow:yyyyMMddHHmm}.csv");
    }
}
