/*
 * AdminAuthController.cs - Admin Authentication Endpoints
 * Handles admin login, token validation, password change, and profile retrieval.
 * All endpoints except login require admin authentication.
 */

using System.Security.Claims;
using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Admin;

[ApiController]
[Route("api/admin/auth")]
public class AdminAuthController : ControllerBase
{
    private readonly IAdminAuthService _adminAuthService;

    public AdminAuthController(IAdminAuthService adminAuthService)
    {
        _adminAuthService = adminAuthService;
    }

    // POST /api/admin/auth/login — Admin login (no auth required)
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AdminLoginRequestDto request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _adminAuthService.LoginAsync(request, ipAddress);

        if (!result.Success)
            return Unauthorized(result);

        return Ok(result);
    }

    // POST /api/admin/auth/validate — Check if token is still valid
    [HttpPost("validate")]
    [Authorize]
    [AdminAuthorize]
    public async Task<IActionResult> ValidateToken()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(new { message = "Invalid token" });

        var (success, message) = await _adminAuthService.ValidateTokenAsync(userId.Value);

        if (!success)
            return Unauthorized(new { message });

        return Ok(new { success = true, message });
    }

    // POST /api/admin/auth/change-password — Change admin password
    [HttpPost("change-password")]
    [Authorize]
    [AdminAuthorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var (success, message) = await _adminAuthService.ChangePasswordAsync(userId.Value, request);

        if (!success)
            return BadRequest(new { success = false, message });

        return Ok(new { success = true, message });
    }

    // GET /api/admin/auth/profile — Get admin profile
    [HttpGet("profile")]
    [Authorize]
    [AdminAuthorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var profile = await _adminAuthService.GetProfileAsync(userId.Value);
        if (profile == null)
            return NotFound(new { message = "Admin profile not found" });

        return Ok(new { success = true, admin = profile });
    }

    // Helper: extract user ID from JWT claims
    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
