using InterviewHub.API.DTOs;
using Microsoft.AspNetCore.Http;

namespace InterviewHub.API.Services.Admin;

public interface ISkillManagementService
{
    Task<(IEnumerable<SkillDto> Skills, int TotalCount)> GetAllSkillsAsync(int page, int pageSize, string? search, string? category, bool? isGlobal);
    Task<SkillDto?> GetSkillByIdAsync(int id);
    Task<SkillDto> CreateSkillAsync(CreateSkillDto dto);
    Task<SkillDto?> UpdateSkillAsync(int id, UpdateSkillDto dto);
    Task<bool> DeleteSkillAsync(int id);
    Task<SkillStatsDto> GetStatsAsync();
    Task<int> ImportSkillsFromCsvAsync(IFormFile file);
    Task<byte[]> ExportSkillsToCsvAsync();
}
