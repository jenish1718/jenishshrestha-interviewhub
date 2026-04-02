/*
 * UserManagementController.cs - Admin User Management Endpoints
 * Handles user listing with pagination/search/filter, detail view,
 * status updates (enable/disable/suspend), deletion, and statistics.
 */

using System.Security.Claims;
using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Admin;

[ApiController]
[Route("api/admin/users")]
[Authorize]
[AdminAuthorize]
public class UserManagementController : ControllerBase
{
    private readonly IUserManagementService _userManagementService;

    public UserManagementController(IUserManagementService userManagementService)
    {
        _userManagementService = userManagementService;
    }

    // GET /api/admin/users?page=1&pageSize=10&search=&role=&status=
    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] string? status = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 10;

        var result = await _userManagementService.GetUsersAsync(page, pageSize, search, role, status);
        return Ok(result);
    }

    // GET /api/admin/users/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetUserStats()
    {
        var stats = await _userManagementService.GetUserStatsAsync();
        return Ok(new { success = true, stats });
    }

    // GET /api/admin/users/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _userManagementService.GetUserByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });
        return Ok(new { success = true, user });
    }

    // PUT /api/admin/users/{id}/status — Enable/Disable/Suspend user
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusDto request)
    {
        var adminUserId = GetCurrentUserId();
        if (adminUserId == null) return Unauthorized();

        var (success, message) = await _userManagementService.UpdateUserStatusAsync(id, request, adminUserId.Value);

        if (!success) return BadRequest(new { success = false, message });
        return Ok(new { success = true, message });
    }

    // DELETE /api/admin/users/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var adminUserId = GetCurrentUserId();
        if (adminUserId == null) return Unauthorized();

        var (success, message) = await _userManagementService.DeleteUserAsync(id, adminUserId.Value);

        if (!success) return BadRequest(new { success = false, message });
        return Ok(new { success = true, message });
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
