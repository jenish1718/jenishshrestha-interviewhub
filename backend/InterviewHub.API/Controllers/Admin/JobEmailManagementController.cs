/*
 * JobEmailManagementController.cs - Admin Job Email Management Endpoints
 * Handles listing, viewing, editing, deleting job emails and statistics.
 */

using System.Security.Claims;
using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Admin;

[ApiController]
[Route("api/admin/job-emails")]
[Authorize]
[AdminAuthorize]
public class JobEmailManagementController : ControllerBase
{
    private readonly IJobEmailManagementService _jobEmailManagementService;

    public JobEmailManagementController(IJobEmailManagementService jobEmailManagementService)
    {
        _jobEmailManagementService = jobEmailManagementService;
    }

    // GET /api/admin/job-emails?page=1&pageSize=10&search=&userId=&dateFrom=&dateTo=
    [HttpGet]
    public async Task<IActionResult> GetJobEmails(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] int? userId = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 10;

        var result = await _jobEmailManagementService.GetJobEmailsAsync(page, pageSize, search, userId, dateFrom, dateTo);
        return Ok(result);
    }

    // GET /api/admin/job-emails/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetJobEmailStats()
    {
        var stats = await _jobEmailManagementService.GetJobEmailStatsAsync();
        return Ok(new { success = true, stats });
    }

    // GET /api/admin/job-emails/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetJobEmail(int id)
    {
        var email = await _jobEmailManagementService.GetJobEmailByIdAsync(id);
        if (email == null) return NotFound(new { message = "Job email not found" });
        return Ok(new { success = true, email });
    }

    // PUT /api/admin/job-emails/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateJobEmail(int id, [FromBody] UpdateJobEmailDto request)
    {
        var adminUserId = GetCurrentUserId();
        if (adminUserId == null) return Unauthorized();

        var (success, message) = await _jobEmailManagementService.UpdateJobEmailAsync(id, request, adminUserId.Value);

        if (!success) return BadRequest(new { success = false, message });
        return Ok(new { success = true, message });
    }

    // DELETE /api/admin/job-emails/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteJobEmail(int id)
    {
        var adminUserId = GetCurrentUserId();
        if (adminUserId == null) return Unauthorized();

        var (success, message) = await _jobEmailManagementService.DeleteJobEmailAsync(id, adminUserId.Value);

        if (!success) return BadRequest(new { success = false, message });
        return Ok(new { success = true, message });
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
