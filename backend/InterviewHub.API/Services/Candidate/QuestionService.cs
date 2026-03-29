using InterviewHub.API.Data;
using InterviewHub.API.DTOs.Candidate;
using InterviewHub.API.Models;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Services.Candidate;

public interface IQuestionService
{
    Task<PaginatedQuestionResponse> GetQuestionsBySkillAsync(int userId, int skillId, string? search, int page, int pageSize);
    Task<UserQuestionHistoryResponse> GetUserQuestionHistoryAsync(int userId, string? search, int? skillId, int page, int pageSize);
    Task<UserSkillsResponse> GetAllSkillsForUserAsync(int userId);
    Task RecordQuestionHistoryAsync(int userId, int sessionId, int questionId, string? userAnswer);
}

public class QuestionService : IQuestionService
{
    private readonly ApplicationDbContext _context;

    public QuestionService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all questions linked to a specific skill that the user has encountered.
    /// </summary>
    public async Task<PaginatedQuestionResponse> GetQuestionsBySkillAsync(
        int userId, int skillId, string? search, int page, int pageSize)
    {
        // Get question IDs the user has seen
        var userQuestionIds = _context.UserQuestionHistories
            .Where(h => h.UserId == userId)
            .Select(h => h.QuestionId)
            .Distinct();

        var query = _context.Questions
            .Include(q => q.Skill)
            .Where(q => q.SkillId == skillId && !q.IsDeleted)
            .Where(q => userQuestionIds.Contains(q.QuestionId));

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(q => q.QuestionText.Contains(search));
        }

        var totalCount = await query.CountAsync();

        var questions = await query
            .OrderByDescending(q => q.GeneratedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(q => new QuestionsBySkillDto
            {
                QuestionId = q.QuestionId,
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType.ToString(),
                Difficulty = q.Difficulty.ToString(),
                SkillName = q.Skill != null ? q.Skill.SkillName : "Unknown",
                UsageCount = q.UsageCount,
                Source = q.Source.ToString(),
                GeneratedAt = q.GeneratedAt,
                SampleAnswer = q.SampleAnswer
            })
            .ToListAsync();

        return new PaginatedQuestionResponse
        {
            Success = true,
            Message = "Questions retrieved successfully",
            Questions = questions,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };
    }

    /// <summary>
    /// Get full question history for a user, with optional skill filter and search.
    /// </summary>
    public async Task<UserQuestionHistoryResponse> GetUserQuestionHistoryAsync(
        int userId, string? search, int? skillId, int page, int pageSize)
    {
        var query = _context.UserQuestionHistories
            .Include(h => h.Question)
                .ThenInclude(q => q.Skill)
            .Include(h => h.Session)
                .ThenInclude(s => s!.JobEmail)
            .Where(h => h.UserId == userId);

        if (skillId.HasValue)
        {
            query = query.Where(h => h.Question.SkillId == skillId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(h => h.Question.QuestionText.Contains(search));
        }

        var totalCount = await query.CountAsync();

        var history = await query
            .OrderByDescending(h => h.AskedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new UserQuestionHistoryDto
            {
                Id = h.Id,
                QuestionId = h.QuestionId,
                QuestionText = h.Question.QuestionText,
                QuestionType = h.Question.QuestionType.ToString(),
                Difficulty = h.Question.Difficulty.ToString(),
                SkillName = h.Question.Skill != null ? h.Question.Skill.SkillName : "Unknown",
                SessionId = h.SessionId,
                JobTitle = h.Session != null && h.Session.JobEmail != null ? h.Session.JobEmail.JobTitle : null,
                AskedAt = h.AskedAt,
                UserAnswer = h.UserAnswer
            })
            .ToListAsync();

        return new UserQuestionHistoryResponse
        {
            Success = true,
            Message = "History retrieved successfully",
            History = history,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        };
    }

    /// <summary>
    /// Get all unique skills the user has encountered questions for.
    /// </summary>
    public async Task<UserSkillsResponse> GetAllSkillsForUserAsync(int userId)
    {
        var skillIds = await _context.UserQuestionHistories
            .Where(h => h.UserId == userId)
            .Select(h => h.Question.SkillId)
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToListAsync();

        var skills = await _context.Skills
            .Where(s => skillIds.Contains(s.SkillId) && !s.IsDeleted)
            .Select(s => new UserSkillDto
            {
                SkillId = s.SkillId,
                SkillName = s.SkillName,
                Category = s.Category.ToString(),
                QuestionCount = _context.UserQuestionHistories
                    .Count(h => h.UserId == userId && h.Question.SkillId == s.SkillId)
            })
            .OrderByDescending(s => s.QuestionCount)
            .ToListAsync();

        return new UserSkillsResponse
        {
            Success = true,
            Message = "Skills retrieved successfully",
            Skills = skills,
            TotalCount = skills.Count
        };
    }

    /// <summary>
    /// Record that a user was asked a question in a session. Also increments UsageCount.
    /// Called when a session is started and questions are generated.
    /// </summary>
    public async Task RecordQuestionHistoryAsync(int userId, int sessionId, int questionId, string? userAnswer)
    {
        // Avoid duplicates
        var exists = await _context.UserQuestionHistories
            .AnyAsync(h => h.UserId == userId && h.QuestionId == questionId && h.SessionId == sessionId);

        if (!exists)
        {
            _context.UserQuestionHistories.Add(new UserQuestionHistory
            {
                UserId = userId,
                QuestionId = questionId,
                SessionId = sessionId,
                AskedAt = DateTime.UtcNow,
                UserAnswer = userAnswer
            });

            // Increment usage count on the question
            var question = await _context.Questions.FindAsync(questionId);
            if (question != null)
            {
                question.UsageCount++;
            }

            await _context.SaveChangesAsync();
        }
    }
}
