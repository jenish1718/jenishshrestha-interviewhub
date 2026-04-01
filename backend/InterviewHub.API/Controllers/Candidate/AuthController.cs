/*
 * AuthController.cs - User Authentication API
 * Handles user registration, login, token refresh, and password reset.
 * Uses JWT for stateless auth with refresh token rotation for security.
 */

using InterviewHub.API.DTOs.Candidate;
using InterviewHub.API.Models;
using InterviewHub.API.Services.Candidate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Candidate;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    // Registers a new user and returns access + refresh tokens
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new AuthResponse
            {
                Success = false,
                Message = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage))
            });
        }

        try
        {
            var result = await _authService.RegisterAsync(request);
            
            if (!result.Success)
                return BadRequest(result);

            _logger.LogInformation("User registered: {Email}", request.Email);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration error for {Email}", request.Email);
            return StatusCode(500, new AuthResponse
            {
                Success = false,
                Message = "Registration failed. Please try again."
            });
        }
    }

    // Authenticates user and issues JWT + refresh token
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new AuthResponse
            {
                Success = false,
                Message = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage))
            });
        }

        try
        {
            var result = await _authService.LoginAsync(request);
            
            if (!result.Success)
            {
                _logger.LogWarning("Failed login for {Email}", request.Email);
                return Unauthorized(result);
            }

            _logger.LogInformation("User logged in: {Email}", request.Email);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login error for {Email}", request.Email);
            return StatusCode(500, new AuthResponse
            {
                Success = false,
                Message = "Login failed. Please try again."
            });
        }
    }

    // Issues new access token using valid refresh token (token rotation)
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new AuthResponse
            {
                Success = false,
                Message = "Refresh token is required"
            });
        }

        try
        {
            var result = await _authService.RefreshTokenAsync(request.RefreshToken);
            
            if (!result.Success)
                return Unauthorized(result);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token refresh error");
            return StatusCode(500, new AuthResponse
            {
                Success = false,
                Message = "Token refresh failed."
            });
        }
    }

    // Initiates password reset flow; sends reset token via email
    [HttpPost("password-reset/request")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> RequestPasswordReset([FromBody] PasswordResetRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new AuthResponse
            {
                Success = false,
                Message = "Valid email is required"
            });
        }

        try
        {
            var result = await _authService.RequestPasswordResetAsync(request.Email);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Password reset request error");
            // Return success to prevent email enumeration attacks
            return Ok(new AuthResponse
            {
                Success = true,
                Message = "If your email is registered, you will receive a password reset link"
            });
        }
    }

    // Validates reset token and sets new password
    [HttpPost("password-reset/confirm")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmPasswordReset([FromBody] PasswordResetConfirmDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new AuthResponse
            {
                Success = false,
                Message = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage))
            });
        }

        try
        {
            var result = await _authService.ResetPasswordAsync(request);
            
            if (!result.Success)
                return BadRequest(result);

            _logger.LogInformation("Password reset completed");
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Password reset confirmation error");
            return StatusCode(500, new AuthResponse
            {
                Success = false,
                Message = "Password reset failed."
            });
        }
    }

    // Invalidates user's refresh token (logout)
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        await _authService.RevokeRefreshTokenAsync(request.RefreshToken);
        return Ok(new { message = "Logged out successfully" });
    }

    // Returns current user's info from JWT claims
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var email = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value 
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        return Ok(new UserInfo
        {
            UserId = int.Parse(userId ?? "0"),
            Email = email ?? "",
            FirstName = name?.Split(' ').FirstOrDefault() ?? "",
            LastName = name?.Split(' ').Skip(1).FirstOrDefault() ?? "",
            Role = role ?? "User"
        });
    }

    // Test endpoint for admin-only access
    [HttpGet("admin-only")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult AdminOnly()
    {
        return Ok(new { message = "Welcome, Admin! You have access to this protected resource." });
    }

    // DEV ONLY - Reset admin password for testing
    [HttpPost("reset-admin")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetAdminPassword()
    {
        try
        {
            var result = await _authService.ResetAdminPasswordAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin password reset error");
            return StatusCode(500, new { success = false, message = "Failed to reset admin password" });
        }
    }
}
