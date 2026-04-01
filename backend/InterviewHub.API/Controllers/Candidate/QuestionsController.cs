using System.Security.Claims;
using InterviewHub.API.DTOs.Candidate;
using InterviewHub.API.Services.Candidate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Candidate;

[ApiController]
[Route("api/questions")]
[Authorize]
public class QuestionsController : ControllerBase
{
    private readonly IQuestionService _questionService;
    private readonly ILogger<QuestionsController> _logger;

    public QuestionsController(IQuestionService questionService, ILogger<QuestionsController> logger)
    {
        _questionService = questionService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    /// <summary>
    /// GET /api/questions/by-skill/{skillId}
    /// Returns questions the user has encountered for a specific skill.
    /// </summary>
    [HttpGet("by-skill/{skillId}")]
    public async Task<IActionResult> GetQuestionsBySkill(
        int skillId,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(new { success = false, message = "User not authenticated" });

        try
        {
            var result = await _questionService.GetQuestionsBySkillAsync(userId, skillId, search, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting questions by skill {SkillId}", skillId);
            return StatusCode(500, new { success = false, message = "Failed to get questions" });
        }
    }

    /// <summary>
    /// GET /api/questions/my-history
    /// Returns the user's full question history with optional skill and search filters.
    /// </summary>
    [HttpGet("my-history")]
    public async Task<IActionResult> GetMyHistory(
        [FromQuery] string? search = null,
        [FromQuery] int? skillId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(new { success = false, message = "User not authenticated" });

        try
        {
            var result = await _questionService.GetUserQuestionHistoryAsync(userId, search, skillId, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting question history");
            return StatusCode(500, new { success = false, message = "Failed to get history" });
        }
    }

    /// <summary>
    /// GET /api/questions/skills
    /// Returns all skills the user has encountered questions for.
    /// </summary>
    [HttpGet("skills")]
    public async Task<IActionResult> GetMySkills()
    {
        var userId = GetCurrentUserId();
        if (userId == 0) return Unauthorized(new { success = false, message = "User not authenticated" });

        try
        {
            var result = await _questionService.GetAllSkillsForUserAsync(userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user skills");
            return StatusCode(500, new { success = false, message = "Failed to get skills" });
        }
    }
}
