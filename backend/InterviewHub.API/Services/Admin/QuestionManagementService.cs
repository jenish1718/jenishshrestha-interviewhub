using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Data;
using InterviewHub.API.Models;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Services.Admin;

public interface IQuestionManagementService
{
    Task<(IEnumerable<QuestionDto> Questions, int TotalCount)> GetAllQuestionsAsync(int page, int pageSize, string? search, string? type, int? skillId, bool? approved);
    Task<QuestionDto> CreateQuestionAsync(CreateQuestionDto dto);
    Task<QuestionDto?> UpdateQuestionAsync(int id, UpdateQuestionDto dto);
    Task<bool> DeleteQuestionAsync(int id);
    Task<QuestionDto?> ApproveQuestionAsync(int id, int adminUserId);
    Task<(IEnumerable<QuestionDto> Questions, int TotalCount)> GetPendingApprovalAsync(int page, int pageSize);
}

public class QuestionManagementService : IQuestionManagementService
{
    private readonly ApplicationDbContext _context;

    public QuestionManagementService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<QuestionDto> Questions, int TotalCount)> GetAllQuestionsAsync(int page, int pageSize, string? search, string? type, int? skillId, bool? approved)
    {
        var query = _context.Questions.Where(q => !q.IsDeleted).AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(q => q.QuestionText.Contains(search));

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<QuestionType>(type, true, out var qt))
            query = query.Where(q => q.QuestionType == qt);

        if (skillId.HasValue)
            query = query.Where(q => q.SkillId == skillId.Value);

        if (approved.HasValue)
            query = query.Where(q => q.IsApproved == approved.Value);

        var totalCount = await query.CountAsync();

        var questions = await query
            .OrderByDescending(q => q.GeneratedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(q => new QuestionDto
            {
                QuestionId = q.QuestionId,
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType.ToString(),
                Difficulty = q.Difficulty.ToString(),
                SkillId = q.SkillId,
                SkillName = q.Skill != null ? q.Skill.SkillName : null,
                IsAI = q.IsAI,
                IsApproved = q.IsApproved,
                ApprovedBy = q.ApprovedBy,
                ApprovedAt = q.ApprovedAt,
                SampleAnswer = q.SampleAnswer,
                GeneratedAt = q.GeneratedAt
            })
            .ToListAsync();

        return (questions, totalCount);
    }

    public async Task<QuestionDto> CreateQuestionAsync(CreateQuestionDto dto)
    {
        var question = new Question
        {
            QuestionText = dto.QuestionText,
            QuestionType = dto.QuestionType,
            Difficulty = dto.Difficulty,
            SkillId = dto.SkillId,
            SampleAnswer = dto.SampleAnswer,
            IsAI = false,
            IsApproved = true,
            GeneratedAt = DateTime.UtcNow
        };

        _context.Questions.Add(question);
        await _context.SaveChangesAsync();

        return new QuestionDto
        {
            QuestionId = question.QuestionId,
            QuestionText = question.QuestionText,
            QuestionType = question.QuestionType.ToString(),
            Difficulty = question.Difficulty.ToString(),
            SkillId = question.SkillId,
            IsAI = question.IsAI,
            IsApproved = question.IsApproved,
            GeneratedAt = question.GeneratedAt,
            SampleAnswer = question.SampleAnswer
        };
    }

    public async Task<QuestionDto?> UpdateQuestionAsync(int id, UpdateQuestionDto dto)
    {
        var question = await _context.Questions.FindAsync(id);
        if (question == null || question.IsDeleted) return null;

        question.QuestionText = dto.QuestionText;
        question.QuestionType = dto.QuestionType;
        question.Difficulty = dto.Difficulty;
        question.SkillId = dto.SkillId;
        question.SampleAnswer = dto.SampleAnswer;

        await _context.SaveChangesAsync();

        return new QuestionDto
        {
            QuestionId = question.QuestionId,
            QuestionText = question.QuestionText,
            QuestionType = question.QuestionType.ToString(),
            Difficulty = question.Difficulty.ToString(),
            SkillId = question.SkillId,
            IsAI = question.IsAI,
            IsApproved = question.IsApproved,
            GeneratedAt = question.GeneratedAt,
            SampleAnswer = question.SampleAnswer
        };
    }

    public async Task<bool> DeleteQuestionAsync(int id)
    {
        var question = await _context.Questions.FindAsync(id);
        if (question == null || question.IsDeleted) return false;

        question.IsDeleted = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<QuestionDto?> ApproveQuestionAsync(int id, int adminUserId)
    {
        var question = await _context.Questions.FindAsync(id);
        if (question == null || question.IsDeleted) return null;

        question.IsApproved = true;
        question.ApprovedBy = adminUserId;
        question.ApprovedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new QuestionDto
        {
            QuestionId = question.QuestionId,
            QuestionText = question.QuestionText,
            QuestionType = question.QuestionType.ToString(),
            Difficulty = question.Difficulty.ToString(),
            SkillId = question.SkillId,
            IsAI = question.IsAI,
            IsApproved = question.IsApproved,
            ApprovedBy = question.ApprovedBy,
            ApprovedAt = question.ApprovedAt,
            GeneratedAt = question.GeneratedAt
        };
    }

    public async Task<(IEnumerable<QuestionDto> Questions, int TotalCount)> GetPendingApprovalAsync(int page, int pageSize)
    {
        var query = _context.Questions.Where(q => !q.IsDeleted && !q.IsApproved && q.IsAI);

        var totalCount = await query.CountAsync();

        var questions = await query
            .OrderByDescending(q => q.GeneratedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(q => new QuestionDto
            {
                QuestionId = q.QuestionId,
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType.ToString(),
                Difficulty = q.Difficulty.ToString(),
                SkillId = q.SkillId,
                SkillName = q.Skill != null ? q.Skill.SkillName : null,
                IsAI = q.IsAI,
                IsApproved = q.IsApproved,
                GeneratedAt = q.GeneratedAt
            })
            .ToListAsync();

        return (questions, totalCount);
    }
}
