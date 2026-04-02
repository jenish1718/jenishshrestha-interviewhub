using InterviewHub.API.DTOs;
using InterviewHub.API.Services.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Admin;

[ApiController]
[Route("api/admin/skills")]
// [Authorize(Roles = "Admin")]
public class SkillsController : ControllerBase
{
    private readonly ISkillManagementService _skillService;

    public SkillsController(ISkillManagementService skillService)
    {
        _skillService = skillService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllSkills([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? category = null, [FromQuery] bool? isGlobal = null)
    {
        var result = await _skillService.GetAllSkillsAsync(page, pageSize, search, category, isGlobal);
        return Ok(new { Data = result.Skills, TotalCount = result.TotalCount, Page = page, PageSize = pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSkillById(int id)
    {
        var skill = await _skillService.GetSkillByIdAsync(id);
        if (skill == null) return NotFound();
        return Ok(skill);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSkill([FromBody] CreateSkillDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var skill = await _skillService.CreateSkillAsync(dto);
        return CreatedAtAction(nameof(GetSkillById), new { id = skill.SkillId }, skill);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSkill(int id, [FromBody] UpdateSkillDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var skill = await _skillService.UpdateSkillAsync(id, dto);
        if (skill == null) return NotFound();
        return Ok(skill);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSkill(int id)
    {
        var success = await _skillService.DeleteSkillAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _skillService.GetStatsAsync();
        return Ok(stats);
    }

    [HttpPost("import")]
    public async Task<IActionResult> ImportSkills(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("File is empty");
        if (!file.FileName.EndsWith(".csv")) return BadRequest("Only CSV files are allowed");

        try
        {
            var count = await _skillService.ImportSkillsFromCsvAsync(file);
            return Ok(new { Message = $"Successfully imported {count} skills", Count = count });
        }
        catch (Exception ex)
        {
            return BadRequest($"Error importing skills: {ex.Message}");
        }
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportSkills()
    {
        var data = await _skillService.ExportSkillsToCsvAsync();
        return File(data, "text/csv", $"skills_export_{DateTime.UtcNow:yyyyMMddHHmm}.csv");
    }
}
