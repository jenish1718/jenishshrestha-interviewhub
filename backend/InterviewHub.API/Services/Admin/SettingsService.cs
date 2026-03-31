using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Data;
using InterviewHub.API.Models;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Services.Admin;

public interface ISettingsService
{
    Task<List<SettingDto>> GetAllSettingsAsync();
    Task<SettingDto?> GetSettingByKeyAsync(string key);
    Task<SettingDto?> UpdateSettingAsync(string key, UpdateSettingDto dto);
    Task ResetDefaultsAsync();
}

public class SettingsService : ISettingsService
{
    private readonly ApplicationDbContext _context;

    public SettingsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SettingDto>> GetAllSettingsAsync()
    {
        return await _context.SystemSettings
            .OrderBy(s => s.Category)
            .ThenBy(s => s.Key)
            .Select(s => new SettingDto
            {
                Id = s.Id,
                Key = s.Key,
                Value = s.Value,
                Type = s.Type,
                Description = s.Description,
                Category = s.Category,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<SettingDto?> GetSettingByKeyAsync(string key)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null) return null;

        return new SettingDto
        {
            Id = setting.Id,
            Key = setting.Key,
            Value = setting.Value,
            Type = setting.Type,
            Description = setting.Description,
            Category = setting.Category,
            UpdatedAt = setting.UpdatedAt
        };
    }

    public async Task<SettingDto?> UpdateSettingAsync(string key, UpdateSettingDto dto)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null) return null;

        setting.Value = dto.Value;
        setting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new SettingDto
        {
            Id = setting.Id,
            Key = setting.Key,
            Value = setting.Value,
            Type = setting.Type,
            Description = setting.Description,
            Category = setting.Category,
            UpdatedAt = setting.UpdatedAt
        };
    }

    public async Task ResetDefaultsAsync()
    {
        var defaultSettings = GetDefaultSettings();

        // Remove all existing settings
        _context.SystemSettings.RemoveRange(_context.SystemSettings);
        await _context.SaveChangesAsync();

        // Re-add defaults
        _context.SystemSettings.AddRange(defaultSettings);
        await _context.SaveChangesAsync();
    }

    public static List<SystemSetting> GetDefaultSettings()
    {
        return new List<SystemSetting>
        {
            new() { Key = "session.maxDuration", Value = "60", Type = "number", Description = "Maximum interview session duration in minutes", Category = "Session" },
            new() { Key = "session.timeout", Value = "5", Type = "number", Description = "Session timeout in minutes of inactivity", Category = "Session" },
            new() { Key = "session.maxQuestions", Value = "10", Type = "number", Description = "Maximum questions per session", Category = "Session" },
            new() { Key = "scoring.passThreshold", Value = "60", Type = "number", Description = "Minimum score to pass (out of 100)", Category = "Scoring" },
            new() { Key = "scoring.excellentThreshold", Value = "85", Type = "number", Description = "Score threshold for excellent grade", Category = "Scoring" },
            new() { Key = "ai.confidenceThreshold", Value = "0.7", Type = "number", Description = "AI confidence threshold for auto-approval", Category = "AI" },
            new() { Key = "ai.enabled", Value = "true", Type = "boolean", Description = "Enable AI-powered features", Category = "AI" },
            new() { Key = "email.notificationsEnabled", Value = "true", Type = "boolean", Description = "Enable email notifications", Category = "Email" },
            new() { Key = "features.mockInterview", Value = "true", Type = "boolean", Description = "Enable mock interview feature", Category = "Features" },
            new() { Key = "features.reportGeneration", Value = "true", Type = "boolean", Description = "Enable report generation", Category = "Features" },
            new() { Key = "maintenance.enabled", Value = "false", Type = "boolean", Description = "Enable maintenance mode", Category = "Maintenance" },
            new() { Key = "maintenance.message", Value = "System is under maintenance. Please try again later.", Type = "string", Description = "Maintenance mode message", Category = "Maintenance" },
        };
    }
}
