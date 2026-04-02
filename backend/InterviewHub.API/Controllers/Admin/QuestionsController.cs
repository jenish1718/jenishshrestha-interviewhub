using InterviewHub.API.DTOs.Admin;
using InterviewHub.API.Services.Admin;
using Microsoft.AspNetCore.Mvc;

namespace InterviewHub.API.Controllers.Admin;

[ApiController]
[Route("api/admin/questions")]
public class QuestionsController : ControllerBase
{
    private readonly IQuestionManagementService _questionService;

    public QuestionsController(IQuestionManagementService questionService)
    {
        _questionService = questionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null, [FromQuery] string? type = null, [FromQuery] int? skillId = null, [FromQuery] bool? approved = null)
    {
        var result = await _questionService.GetAllQuestionsAsync(page, pageSize, search, type, skillId, approved);
        return Ok(new { Data = result.Questions, TotalCount = result.TotalCount, Page = page, PageSize = pageSize });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuestionDto dto)
    {
        var question = await _questionService.CreateQuestionAsync(dto);
        return Ok(question);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateQuestionDto dto)
    {
        var question = await _questionService.UpdateQuestionAsync(id, dto);
        if (question == null) return NotFound();
        return Ok(question);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _questionService.DeleteQuestionAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        // For now use admin user ID 1; in production extract from JWT claims
        var question = await _questionService.ApproveQuestionAsync(id, 1);
        if (question == null) return NotFound();
        return Ok(question);
    }

    [HttpGet("pending-approval")]
    public async Task<IActionResult> GetPendingApproval([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _questionService.GetPendingApprovalAsync(page, pageSize);
        return Ok(new { Data = result.Questions, TotalCount = result.TotalCount, Page = page, PageSize = pageSize });
    }
}
