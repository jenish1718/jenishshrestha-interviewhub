/*
 * QuestionController.cs - Interview Question Management
 * Handles AI-powered question generation and CRUD operations.
 * Uses Gemini AI to create skill-specific interview questions.
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
[Route("api")]
[Authorize]
public class QuestionController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IGeminiAIService _aiService;
    private readonly ILogger<QuestionController> _logger;

    public QuestionController(ApplicationDbContext context, IGeminiAIService aiService, ILogger<QuestionController> logger)
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

    // Lists all questions for a job email, optionally grouped by skill
    [HttpGet("emails/{emailId}/questions")]
    [ProducesResponseType(typeof(QuestionListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQuestions(int emailId, [FromQuery] bool groupBySkill = false)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new QuestionListResponse { Success = false, Message = "User not authenticated" });

        var email = await _context.JobEmails.FirstOrDefaultAsync(e => e.EmailId == emailId && e.UserId == userId);
        if (email == null)
            return NotFound(new QuestionListResponse { Success = false, Message = "Email not found" });

        var questions = await _context.Questions
            .Where(q => q.EmailId == emailId)
            .Include(q => q.Skill)
            .OrderBy(q => q.SkillId)
            .ThenBy(q => q.Difficulty)
            .ToListAsync();

        var response = new QuestionListResponse
        {
            Success = true,
            Message = "Questions retrieved successfully",
            Questions = questions.Select(MapToResponse).ToList(),
            TotalCount = questions.Count
        };

        if (groupBySkill)
        {
            response.GroupedBySkill = questions
                .GroupBy(q => q.Skill?.SkillName ?? "General")
                .ToDictionary(g => g.Key, g => g.Select(MapToResponse).ToList());
        }

        return Ok(response);
    }

    // Generates interview questions using Gemini AI based on skills
    [HttpPost("emails/{emailId}/generate-questions")]
    [ProducesResponseType(typeof(GenerateQuestionsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateQuestions(int emailId, [FromBody] GenerateQuestionsRequest? request)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new GenerateQuestionsResponse { Success = false, Message = "User not authenticated" });

        var email = await _context.JobEmails.FirstOrDefaultAsync(e => e.EmailId == emailId && e.UserId == userId);
        if (email == null)
            return NotFound(new GenerateQuestionsResponse { Success = false, Message = "Email not found" });

        try
        {
            // Filter by specific skill if provided
            var skillsQuery = _context.Skills.Where(s => s.EmailId == emailId);
            if (request?.SkillId.HasValue == true)
                skillsQuery = skillsQuery.Where(s => s.SkillId == request.SkillId.Value);

            var skills = await skillsQuery.ToListAsync();
            
            if (skills.Count == 0)
            {
                return BadRequest(new GenerateQuestionsResponse
                {
                    Success = false,
                    Message = "No skills found. Extract skills first using /api/emails/{emailId}/skills/extract"
                });
            }

            var skillNames = skills.Select(s => s.SkillName).ToList();
            var content = email.CleanedContent ?? email.EmailContent;
            var questionsPerSkill = request?.QuestionsPerSkill ?? 3;

            // AI generates tailored questions for each skill
            var generatedQuestions = await _aiService.GenerateQuestionsAsync(content, skillNames, questionsPerSkill);

            if (generatedQuestions.Count == 0)
            {
                return Ok(new GenerateQuestionsResponse
                {
                    Success = true,
                    Message = "No questions could be generated. Try again.",
                    NewQuestionsCount = 0
                });
            }

            // Map AI-generated questions to database entities
            var skillMap = skills.ToDictionary(s => s.SkillName.ToLower(), s => s.SkillId);

            var questions = generatedQuestions.Select(q =>
            {
                skillMap.TryGetValue(q.SkillName.ToLower(), out var skillId);
                return new Question
                {
                    EmailId = emailId,
                    SkillId = skillId > 0 ? skillId : null,
                    QuestionText = q.QuestionText,
                    QuestionType = ParseQuestionType(q.QuestionType),
                    Difficulty = ParseDifficulty(q.Difficulty),
                    SampleAnswer = q.SampleAnswer,
                    GeneratedAt = DateTime.UtcNow
                };
            }).ToList();

            _context.Questions.AddRange(questions);
            await _context.SaveChangesAsync();

            var savedQuestions = await _context.Questions
                .Where(q => q.EmailId == emailId)
                .Include(q => q.Skill)
                .OrderByDescending(q => q.GeneratedAt)
                .Take(questions.Count)
                .ToListAsync();

            _logger.LogInformation("Generated {Count} questions for email {EmailId}", questions.Count, emailId);

            return Ok(new GenerateQuestionsResponse
            {
                Success = true,
                Message = $"Successfully generated {questions.Count} questions",
                Questions = savedQuestions.Select(MapToResponse).ToList(),
                NewQuestionsCount = questions.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating questions for email {EmailId}", emailId);
            return StatusCode(500, new GenerateQuestionsResponse
            {
                Success = false,
                Message = "An error occurred while generating questions"
            });
        }
    }

    // Updates question text, difficulty, or favorite status
    [HttpPut("questions/{questionId}")]
    [ProducesResponseType(typeof(QuestionSingleResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateQuestion(int questionId, [FromBody] UpdateQuestionRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new QuestionSingleResponse { Success = false, Message = "User not authenticated" });

        var question = await _context.Questions
            .Include(q => q.JobEmail)
            .Include(q => q.Skill)
            .FirstOrDefaultAsync(q => q.QuestionId == questionId && q.JobEmail != null && q.JobEmail.UserId == userId);

        if (question == null)
            return NotFound(new QuestionSingleResponse { Success = false, Message = "Question not found" });

        if (!string.IsNullOrEmpty(request.QuestionText))
            question.QuestionText = request.QuestionText;
        
        if (!string.IsNullOrEmpty(request.Difficulty))
            question.Difficulty = ParseDifficulty(request.Difficulty);
        
        if (request.IsFavorite.HasValue)
            question.IsFavorite = request.IsFavorite.Value;

        await _context.SaveChangesAsync();

        return Ok(new QuestionSingleResponse
        {
            Success = true,
            Message = "Question updated successfully",
            Question = MapToResponse(question)
        });
    }

    // Toggles question as favorite for quick access
    [HttpPost("questions/{questionId}/favorite")]
    [ProducesResponseType(typeof(QuestionSingleResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleFavorite(int questionId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new QuestionSingleResponse { Success = false, Message = "User not authenticated" });

        var question = await _context.Questions
            .Include(q => q.JobEmail)
            .Include(q => q.Skill)
            .FirstOrDefaultAsync(q => q.QuestionId == questionId && q.JobEmail != null && q.JobEmail.UserId == userId);

        if (question == null)
            return NotFound(new QuestionSingleResponse { Success = false, Message = "Question not found" });

        question.IsFavorite = !question.IsFavorite;
        await _context.SaveChangesAsync();

        return Ok(new QuestionSingleResponse
        {
            Success = true,
            Message = question.IsFavorite ? "Added to favorites" : "Removed from favorites",
            Question = MapToResponse(question)
        });
    }

    // Removes question from database
    [HttpDelete("questions/{questionId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteQuestion(int questionId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new { success = false, message = "User not authenticated" });

        var question = await _context.Questions
            .Include(q => q.JobEmail)
            .FirstOrDefaultAsync(q => q.QuestionId == questionId && q.JobEmail != null && q.JobEmail.UserId == userId);

        if (question == null)
            return NotFound(new { success = false, message = "Question not found" });

        _context.Questions.Remove(question);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Question deleted successfully" });
    }

    // Lists all questions marked as favorite
    [HttpGet("questions/favorites")]
    [ProducesResponseType(typeof(QuestionListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFavorites()
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new QuestionListResponse { Success = false, Message = "User not authenticated" });

        var questions = await _context.Questions
            .Include(q => q.JobEmail)
            .Include(q => q.Skill)
            .Where(q => q.JobEmail != null && q.JobEmail.UserId == userId && q.IsFavorite)
            .OrderByDescending(q => q.GeneratedAt)
            .ToListAsync();

        return Ok(new QuestionListResponse
        {
            Success = true,
            Message = "Favorite questions retrieved",
            Questions = questions.Select(MapToResponse).ToList(),
            TotalCount = questions.Count
        });
    }

    // Parses question type from string to enum
    private static QuestionType ParseQuestionType(string type)
    {
        return type.ToLower() switch
        {
            "technical" => QuestionType.Technical,
            "behavioral" => QuestionType.Behavioral,
            "situational" => QuestionType.Situational,
            _ => QuestionType.Technical
        };
    }

    // Parses difficulty level from string to enum
    private static QuestionDifficulty ParseDifficulty(string difficulty)
    {
        return difficulty.ToLower() switch
        {
            "easy" => QuestionDifficulty.Easy,
            "medium" => QuestionDifficulty.Medium,
            "hard" => QuestionDifficulty.Hard,
            _ => QuestionDifficulty.Medium
        };
    }

    // Maps entity to DTO for API response
    private static QuestionResponse MapToResponse(Question q)
    {
        return new QuestionResponse
        {
            QuestionId = q.QuestionId,
            EmailId = q.EmailId,
            SkillId = q.SkillId,
            SkillName = q.Skill?.SkillName,
            QuestionText = q.QuestionText,
            QuestionType = q.QuestionType.ToString(),
            Difficulty = q.Difficulty.ToString(),
            IsFavorite = q.IsFavorite,
            SampleAnswer = q.SampleAnswer,
            GeneratedAt = q.GeneratedAt
        };
    }
}
