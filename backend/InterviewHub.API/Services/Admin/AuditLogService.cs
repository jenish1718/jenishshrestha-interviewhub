using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Data;
using InterviewHub.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace InterviewHub.API.Services.Admin;

public interface IAuditLogService
{
    Task<(IEnumerable<AuditLogDto> Logs, int TotalCount)> GetAuditLogsAsync(int page, int pageSize, int? adminId, string? action, DateTime? from, DateTime? to);
    Task<(IEnumerable<ActivityLogDto> Logs, int TotalCount)> GetActivityLogsAsync(int page, int pageSize, int? userId, DateTime? from, DateTime? to);
    Task<byte[]> ExportLogsAsync(DateTime? from, DateTime? to);
}

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _context;

    public AuditLogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<AuditLogDto> Logs, int TotalCount)> GetAuditLogsAsync(int page, int pageSize, int? adminId, string? action, DateTime? from, DateTime? to)
    {
        var query = _context.AdminAuditLogs.AsQueryable();

        if (adminId.HasValue)
            query = query.Where(l => l.AdminUserId == adminId.Value);

        if (!string.IsNullOrEmpty(action))
            query = query.Where(l => l.Action.Contains(action));

        if (from.HasValue)
            query = query.Where(l => l.PerformedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(l => l.PerformedAt <= to.Value);

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(l => l.PerformedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AuditLogDto
            {
                LogId = l.LogId,
                AdminUserId = l.AdminUserId,
                AdminName = l.AdminUser.FirstName + " " + l.AdminUser.LastName,
                Action = l.Action,
                Details = l.Details,
                TargetUserId = l.TargetUserId,
                TargetEntityId = l.TargetEntityId,
                TargetEntityType = l.TargetEntityType,
                IpAddress = l.IpAddress,
                PerformedAt = l.PerformedAt
            })
            .ToListAsync();

        return (logs, totalCount);
    }

    public async Task<(IEnumerable<ActivityLogDto> Logs, int TotalCount)> GetActivityLogsAsync(int page, int pageSize, int? userId, DateTime? from, DateTime? to)
    {
        var query = _context.UserActivityLogs.AsQueryable();

        if (userId.HasValue)
            query = query.Where(l => l.UserId == userId.Value);

        if (from.HasValue)
            query = query.Where(l => l.CreatedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(l => l.CreatedAt <= to.Value);

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new ActivityLogDto
            {
                Id = l.Id,
                UserId = l.UserId,
                UserName = l.User.FirstName + " " + l.User.LastName,
                Action = l.Action,
                Details = l.Details,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();

        return (logs, totalCount);
    }

    public async Task<byte[]> ExportLogsAsync(DateTime? from, DateTime? to)
    {
        var query = _context.AdminAuditLogs.AsQueryable();

        if (from.HasValue)
            query = query.Where(l => l.PerformedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(l => l.PerformedAt <= to.Value);

        var logs = await query
            .OrderByDescending(l => l.PerformedAt)
            .Select(l => new
            {
                l.LogId,
                AdminName = l.AdminUser.FirstName + " " + l.AdminUser.LastName,
                l.Action,
                l.Details,
                l.TargetEntityType,
                l.TargetEntityId,
                l.IpAddress,
                l.PerformedAt
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("LogId,Admin,Action,Details,EntityType,EntityId,IP,Date");

        foreach (var log in logs)
        {
            sb.AppendLine($"{log.LogId},{EscapeCsv(log.AdminName)},{EscapeCsv(log.Action)},{EscapeCsv(log.Details ?? "")},{log.TargetEntityType},{log.TargetEntityId},{log.IpAddress},{log.PerformedAt:yyyy-MM-dd HH:mm:ss}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string EscapeCsv(string field)
    {
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n'))
            return $"\"{field.Replace("\"", "\"\"")}\"";
        return field;
    }
}
