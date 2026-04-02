using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Services.Admin;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Admin;

[ApiController]
[Route("api/admin/settings")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;

    public SettingsController(ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var settings = await _settingsService.GetAllSettingsAsync();
        return Ok(settings);
    }

    [HttpGet("{key}")]
    public async Task<IActionResult> GetByKey(string key)
    {
        var setting = await _settingsService.GetSettingByKeyAsync(key);
        if (setting == null) return NotFound();
        return Ok(setting);
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Update(string key, [FromBody] UpdateSettingDto dto)
    {
        var setting = await _settingsService.UpdateSettingAsync(key, dto);
        if (setting == null) return NotFound();
        return Ok(setting);
    }

    [HttpPost("reset-defaults")]
    public async Task<IActionResult> ResetDefaults()
    {
        await _settingsService.ResetDefaultsAsync();
        return Ok(new { Message = "Settings reset to defaults" });
    }
}
