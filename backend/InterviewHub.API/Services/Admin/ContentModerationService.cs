using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Data;
using InterviewHub.API.Models;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Services.Admin;

public interface IContentModerationService
{
    Task<(IEnumerable<FlaggedContentDto> Items, int TotalCount)> GetModerationQueueAsync(int page, int pageSize, string? type, string? status);
    Task<FlaggedContentDto?> ApproveContentAsync(int id, int adminUserId, ModerationActionDto dto);
    Task<FlaggedContentDto?> RejectContentAsync(int id, int adminUserId, ModerationActionDto dto);
    Task<(IEnumerable<FlaggedContentDto> Items, int TotalCount)> GetModerationHistoryAsync(int page, int pageSize);
}

public class ContentModerationService : IContentModerationService
{
    private readonly ApplicationDbContext _context;

    public ContentModerationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<FlaggedContentDto> Items, int TotalCount)> GetModerationQueueAsync(int page, int pageSize, string? type, string? status)
    {
        var query = _context.FlaggedContents.AsQueryable();

        if (!string.IsNullOrEmpty(type))
            query = query.Where(f => f.ContentType == type);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(f => f.Status == status);
        else
            query = query.Where(f => f.Status == "Pending");

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FlaggedContentDto
            {
                Id = f.Id,
                ContentType = f.ContentType,
                ContentId = f.ContentId,
                Reason = f.Reason,
                Status = f.Status,
                ReportedBy = f.ReportedBy,
                ReporterName = f.Reporter != null ? f.Reporter.FirstName + " " + f.Reporter.LastName : null,
                ModeratedBy = f.ModeratedBy,
                ModeratorName = f.Moderator != null ? f.Moderator.FirstName + " " + f.Moderator.LastName : null,
                ModeratorNotes = f.ModeratorNotes,
                CreatedAt = f.CreatedAt,
                ModeratedAt = f.ModeratedAt
            })
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<FlaggedContentDto?> ApproveContentAsync(int id, int adminUserId, ModerationActionDto dto)
    {
        var item = await _context.FlaggedContents.FindAsync(id);
        if (item == null) return null;

        item.Status = "Approved";
        item.ModeratedBy = adminUserId;
        item.ModeratorNotes = dto.Notes;
        item.ModeratedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new FlaggedContentDto
        {
            Id = item.Id,
            ContentType = item.ContentType,
            ContentId = item.ContentId,
            Reason = item.Reason,
            Status = item.Status,
            ModeratedBy = item.ModeratedBy,
            ModeratorNotes = item.ModeratorNotes,
            CreatedAt = item.CreatedAt,
            ModeratedAt = item.ModeratedAt
        };
    }

    public async Task<FlaggedContentDto?> RejectContentAsync(int id, int adminUserId, ModerationActionDto dto)
    {
        var item = await _context.FlaggedContents.FindAsync(id);
        if (item == null) return null;

        item.Status = "Rejected";
        item.ModeratedBy = adminUserId;
        item.ModeratorNotes = dto.Notes;
        item.ModeratedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new FlaggedContentDto
        {
            Id = item.Id,
            ContentType = item.ContentType,
            ContentId = item.ContentId,
            Reason = item.Reason,
            Status = item.Status,
            ModeratedBy = item.ModeratedBy,
            ModeratorNotes = item.ModeratorNotes,
            CreatedAt = item.CreatedAt,
            ModeratedAt = item.ModeratedAt
        };
    }

    public async Task<(IEnumerable<FlaggedContentDto> Items, int TotalCount)> GetModerationHistoryAsync(int page, int pageSize)
    {
        var query = _context.FlaggedContents.Where(f => f.Status != "Pending");

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(f => f.ModeratedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FlaggedContentDto
            {
                Id = f.Id,
                ContentType = f.ContentType,
                ContentId = f.ContentId,
                Reason = f.Reason,
                Status = f.Status,
                ReportedBy = f.ReportedBy,
                ReporterName = f.Reporter != null ? f.Reporter.FirstName + " " + f.Reporter.LastName : null,
                ModeratedBy = f.ModeratedBy,
                ModeratorName = f.Moderator != null ? f.Moderator.FirstName + " " + f.Moderator.LastName : null,
                ModeratorNotes = f.ModeratorNotes,
                CreatedAt = f.CreatedAt,
                ModeratedAt = f.ModeratedAt
            })
            .ToListAsync();

        return (items, totalCount);
    }
}
