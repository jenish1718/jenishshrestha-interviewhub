/*
 * SkillController.cs - Skills Extraction API
 * Handles AI-powered skill extraction from job descriptions.
 * Uses Gemini AI to identify technical and soft skills.
 */

using System.Security.Claims;
using InterviewHub.API.Data;
using InterviewHub.API.DTOs.Candidate;
using InterviewHub.API.Models;
using InterviewHub.API.Services.Candidate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Controllers.Candidate;

[ApiController]
[Route("api/emails/{emailId}/skills")]
[Authorize]
public class SkillController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IGeminiAIService _aiService;
    private readonly ILogger<SkillController> _logger;

    public SkillController(ApplicationDbContext context, IGeminiAIService aiService, ILogger<SkillController> logger)
    {
        _context = context;
        _aiService = aiService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    // Lists all extracted skills for a job email
    [HttpGet]
    [ProducesResponseType(typeof(SkillListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSkills(int emailId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new SkillListResponse { Success = false, Message = "User not authenticated" });

        var email = await _context.JobEmails.FirstOrDefaultAsync(e => e.EmailId == emailId && e.UserId == userId);
        if (email == null)
            return NotFound(new SkillListResponse { Success = false, Message = "Email not found" });

        var skills = await _context.Skills
            .Where(s => s.EmailId == emailId)
            .OrderByDescending(s => s.Confidence)
            .Select(s => new SkillResponse
            {
                SkillId = s.SkillId,
                EmailId = s.EmailId,
                SkillName = s.SkillName,
                Category = s.Category.ToString(),
                Confidence = s.Confidence,
                ExtractedAt = s.ExtractedAt,
                QuestionCount = _context.Questions.Count(q => q.SkillId == s.SkillId && !q.IsDeleted)
            })
            .ToListAsync();

        return Ok(new SkillListResponse
        {
            Success = true,
            Message = "Skills retrieved successfully",
            Skills = skills,
            TotalCount = skills.Count
        });
    }

    // Uses Gemini AI to extract skills from job description text
    [HttpPost("extract")]
    [ProducesResponseType(typeof(ExtractSkillsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExtractSkills(int emailId, [FromBody] ExtractSkillsRequest? request)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new ExtractSkillsResponse { Success = false, Message = "User not authenticated" });

        var email = await _context.JobEmails.FirstOrDefaultAsync(e => e.EmailId == emailId && e.UserId == userId);
        if (email == null)
            return NotFound(new ExtractSkillsResponse { Success = false, Message = "Email not found" });

        try
        {
            // Re-extract skills if forced
            if (request?.ForceReExtract == true)
            {
                var existingSkills = await _context.Skills.Where(s => s.EmailId == emailId).ToListAsync();
                _context.Skills.RemoveRange(existingSkills);
                await _context.SaveChangesAsync();
            }
            else
            {
                // Return existing skills if already extracted
                var existingCount = await _context.Skills.CountAsync(s => s.EmailId == emailId);
                if (existingCount > 0)
                {
                    var existingSkills = await _context.Skills
                        .Where(s => s.EmailId == emailId)
                        .Select(s => new SkillResponse
                        {
                            SkillId = s.SkillId,
                            EmailId = s.EmailId,
                            SkillName = s.SkillName,
                            Category = s.Category.ToString(),
                            Confidence = s.Confidence,
                            ExtractedAt = s.ExtractedAt,
                            QuestionCount = _context.Questions.Count(q => q.SkillId == s.SkillId && !q.IsDeleted)
                        })
                        .ToListAsync();

                    return Ok(new ExtractSkillsResponse
                    {
                        Success = true,
                        Message = "Skills already extracted. Set forceReExtract=true to re-extract.",
                        Skills = existingSkills,
                        NewSkillsCount = 0
                    });
                }
            }

            // Extract skills using AI
            var content = email.CleanedContent ?? email.EmailContent;
            var extractedSkills = await _aiService.ExtractSkillsAsync(content);

            if (extractedSkills.Count == 0)
            {
                return Ok(new ExtractSkillsResponse
                {
                    Success = true,
                    Message = "No skills could be extracted. Try with more detailed content.",
                    NewSkillsCount = 0
                });
            }

            // Save extracted skills to database
            var skillsToSave = extractedSkills.Select(s => new Skill
            {
                EmailId = emailId,
                SkillName = s.SkillName,
                Category = ParseCategory(s.Category),
                Confidence = s.Confidence,
                ExtractedAt = DateTime.UtcNow
            }).ToList();

            _context.Skills.AddRange(skillsToSave);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Extracted {Count} skills for email {EmailId}", skillsToSave.Count, emailId);

            var savedSkills = skillsToSave.Select(s => new SkillResponse
            {
                SkillId = s.SkillId,
                EmailId = s.EmailId,
                SkillName = s.SkillName,
                Category = s.Category.ToString(),
                Confidence = s.Confidence,
                ExtractedAt = s.ExtractedAt,
                QuestionCount = 0
            }).ToList();

            return Ok(new ExtractSkillsResponse
            {
                Success = true,
                Message = $"Successfully extracted {skillsToSave.Count} skills",
                Skills = savedSkills,
                NewSkillsCount = skillsToSave.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting skills for email {EmailId}", emailId);
            return StatusCode(500, new ExtractSkillsResponse
            {
                Success = false,
                Message = "An error occurred while extracting skills"
            });
        }
    }

    // Removes a skill from the database
    [HttpDelete("{skillId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteSkill(int emailId, int skillId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User not authenticated" });

        var skill = await _context.Skills
            .Include(s => s.JobEmail)
            .FirstOrDefaultAsync(s => s.SkillId == skillId && s.EmailId == emailId && s.JobEmail != null && s.JobEmail.UserId == userId);

        if (skill == null)
            return NotFound(new { success = false, message = "Skill not found" });

        _context.Skills.Remove(skill);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Skill deleted successfully" });
    }

    // Parses skill category from string to enum
    private static SkillCategory ParseCategory(string category)
    {
        return category.ToLower() switch
        {
            "technical" => SkillCategory.Technical,
            "softskill" or "soft skill" or "soft" => SkillCategory.SoftSkill,
            "business" => SkillCategory.Business,
            "industry" => SkillCategory.Industry,
            _ => SkillCategory.Technical
        };
    }
}
