/*
 * JobEmailController.cs - Job Description Management
 * Handles upload, parsing, and management of job descriptions.
 * Supports text paste and file uploads (TXT, PDF, EML).
 */

using System.Security.Claims;
using System.Text.Json;
using InterviewHub.API.Data;
using InterviewHub.API.DTOs.Candidate;
using InterviewHub.API.Models;
using InterviewHub.API.Services.Candidate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Controllers.Candidate;

[ApiController]
[Route("api/emails")]
[Authorize]
public class JobEmailController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IJobEmailParserService _parserService;
    private readonly ILogger<JobEmailController> _logger;
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB limit

    public JobEmailController(
        ApplicationDbContext context, 
        IJobEmailParserService parserService,
        ILogger<JobEmailController> logger)
    {
        _context = context;
        _parserService = parserService;
        _logger = logger;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    // Uploads job description text and parses for skills/qualifications
    [HttpPost("upload")]
    [ProducesResponseType(typeof(JobEmailSingleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(JobEmailSingleResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadEmail([FromBody] UploadEmailRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new JobEmailSingleResponse
            {
                Success = false,
                Message = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage))
            });
        }

        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new JobEmailSingleResponse { Success = false, Message = "User not authenticated" });

        try
        {
            // Parse job description to extract key information
            var parseResult = _parserService.ParseEmail(request.EmailContent);

            var jobEmail = new JobEmail
            {
                UserId = userId,
                JobTitle = request.JobTitle ?? parseResult.JobTitle,
                CompanyName = request.CompanyName ?? parseResult.CompanyName,
                EmailContent = request.EmailContent,
                CleanedContent = parseResult.CleanedContent,
                UploadDate = DateTime.UtcNow,
                Status = parseResult.ParseSuccessful ? "Parsed" : "Failed",
                ParseError = parseResult.ParseError,
                OriginalFileName = request.OriginalFileName,
                FileType = request.FileType ?? "paste",
                ParsedSkills = parseResult.ExtractedSkills.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.ExtractedSkills) : null,
                Responsibilities = parseResult.Responsibilities.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.Responsibilities) : null,
                RequiredQualifications = parseResult.RequiredQualifications.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.RequiredQualifications) : null,
                PreferredSkills = parseResult.PreferredSkills.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.PreferredSkills) : null,
                JobDescription = parseResult.JobDescription,
                ParsedAt = DateTime.UtcNow
            };

            _context.JobEmails.Add(jobEmail);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Job email uploaded by user {UserId}. Skills: {Count}", 
                userId, parseResult.ExtractedSkills.Count);

            return Ok(new JobEmailSingleResponse
            {
                Success = true,
                Message = parseResult.ParseSuccessful 
                    ? $"Email uploaded. Found {parseResult.ExtractedSkills.Count} skills."
                    : "Email uploaded but parsing encountered issues.",
                Email = MapToResponse(jobEmail)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading job email");
            return StatusCode(500, new JobEmailSingleResponse
            {
                Success = false,
                Message = "An error occurred while uploading the email"
            });
        }
    }

    // Uploads file and extracts job description content
    [HttpPost("upload-file")]
    [ProducesResponseType(typeof(JobEmailSingleResponse), StatusCodes.Status200OK)]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> UploadFile(IFormFile file, [FromForm] string? jobTitle, [FromForm] string? companyName)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new JobEmailSingleResponse { Success = false, Message = "User not authenticated" });

        if (file == null || file.Length == 0)
            return BadRequest(new JobEmailSingleResponse { Success = false, Message = "No file uploaded" });

        if (file.Length > MaxFileSize)
            return BadRequest(new JobEmailSingleResponse { Success = false, Message = "File size exceeds 5MB limit" });

        var allowedExtensions = new[] { ".txt", ".pdf", ".eml" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        
        if (!allowedExtensions.Contains(extension))
            return BadRequest(new JobEmailSingleResponse { Success = false, Message = "Invalid file type. Allowed: .txt, .pdf, .eml" });

        try
        {
            string content;
            using (var reader = new StreamReader(file.OpenReadStream()))
            {
                content = await reader.ReadToEndAsync();
            }

            var parseResult = _parserService.ParseEmail(content);

            var jobEmail = new JobEmail
            {
                UserId = userId,
                JobTitle = jobTitle ?? parseResult.JobTitle,
                CompanyName = companyName ?? parseResult.CompanyName,
                EmailContent = content,
                CleanedContent = parseResult.CleanedContent,
                UploadDate = DateTime.UtcNow,
                Status = parseResult.ParseSuccessful ? "Parsed" : "Failed",
                ParseError = parseResult.ParseError,
                OriginalFileName = file.FileName,
                FileType = extension.TrimStart('.'),
                ParsedSkills = parseResult.ExtractedSkills.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.ExtractedSkills) : null,
                Responsibilities = parseResult.Responsibilities.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.Responsibilities) : null,
                RequiredQualifications = parseResult.RequiredQualifications.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.RequiredQualifications) : null,
                PreferredSkills = parseResult.PreferredSkills.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.PreferredSkills) : null,
                JobDescription = parseResult.JobDescription,
                ParsedAt = DateTime.UtcNow
            };

            _context.JobEmails.Add(jobEmail);
            await _context.SaveChangesAsync();

            _logger.LogInformation("File {FileName} uploaded by user {UserId}", file.FileName, userId);

            return Ok(new JobEmailSingleResponse
            {
                Success = true,
                Message = $"File uploaded. Found {parseResult.ExtractedSkills.Count} skills.",
                Email = MapToResponse(jobEmail)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file");
            return StatusCode(500, new JobEmailSingleResponse
            {
                Success = false,
                Message = "An error occurred while uploading the file"
            });
        }
    }

    // Re-parses existing email to refresh extracted data
    [HttpPost("{emailId}/parse")]
    [ProducesResponseType(typeof(JobEmailSingleResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReparseEmail(int emailId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new JobEmailSingleResponse { Success = false, Message = "User not authenticated" });

        try
        {
            var email = await _context.JobEmails
                .FirstOrDefaultAsync(e => e.EmailId == emailId && e.UserId == userId);

            if (email == null)
                return NotFound(new JobEmailSingleResponse { Success = false, Message = "Email not found" });

            var parseResult = _parserService.ParseEmail(email.EmailContent);

            email.CleanedContent = parseResult.CleanedContent;
            email.JobTitle ??= parseResult.JobTitle;
            email.CompanyName ??= parseResult.CompanyName;
            email.Status = parseResult.ParseSuccessful ? "Parsed" : "Failed";
            email.ParseError = parseResult.ParseError;
            email.ParsedSkills = parseResult.ExtractedSkills.Count > 0 
                ? JsonSerializer.Serialize(parseResult.ExtractedSkills) : null;
            email.Responsibilities = parseResult.Responsibilities.Count > 0 
                ? JsonSerializer.Serialize(parseResult.Responsibilities) : null;
            email.RequiredQualifications = parseResult.RequiredQualifications.Count > 0 
                ? JsonSerializer.Serialize(parseResult.RequiredQualifications) : null;
            email.PreferredSkills = parseResult.PreferredSkills.Count > 0 
                ? JsonSerializer.Serialize(parseResult.PreferredSkills) : null;
            email.JobDescription = parseResult.JobDescription;
            email.ParsedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new JobEmailSingleResponse
            {
                Success = true,
                Message = $"Email re-parsed. Found {parseResult.ExtractedSkills.Count} skills.",
                Email = MapToResponse(email)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error re-parsing email {EmailId}", emailId);
            return StatusCode(500, new JobEmailSingleResponse
            {
                Success = false,
                Message = "An error occurred while re-parsing the email"
            });
        }
    }

    // Lists all job emails for current user
    [HttpGet("my-emails")]
    [ProducesResponseType(typeof(JobEmailListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyEmails()
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new JobEmailListResponse { Success = false, Message = "User not authenticated" });

        try
        {
            var emails = await _context.JobEmails
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.UploadDate)
                .ToListAsync();

            return Ok(new JobEmailListResponse
            {
                Success = true,
                Message = "Emails retrieved successfully",
                Emails = emails.Select(MapToResponse).ToList(),
                TotalCount = emails.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving emails for user {UserId}", userId);
            return StatusCode(500, new JobEmailListResponse
            {
                Success = false,
                Message = "An error occurred while retrieving emails"
            });
        }
    }

    // Gets specific email by ID
    [HttpGet("{emailId}")]
    [ProducesResponseType(typeof(JobEmailSingleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(JobEmailSingleResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEmail(int emailId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new JobEmailSingleResponse { Success = false, Message = "User not authenticated" });

        try
        {
            var email = await _context.JobEmails
                .FirstOrDefaultAsync(e => e.EmailId == emailId && e.UserId == userId);

            if (email == null)
                return NotFound(new JobEmailSingleResponse { Success = false, Message = "Email not found" });

            return Ok(new JobEmailSingleResponse
            {
                Success = true,
                Message = "Email retrieved successfully",
                Email = MapToResponse(email)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving email {EmailId}", emailId);
            return StatusCode(500, new JobEmailSingleResponse
            {
                Success = false,
                Message = "An error occurred while retrieving the email"
            });
        }
    }

    // Updates email metadata and optionally re-parses content
    [HttpPut("{emailId}")]
    [ProducesResponseType(typeof(JobEmailSingleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(JobEmailSingleResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateEmail(int emailId, [FromBody] UpdateEmailRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new JobEmailSingleResponse { Success = false, Message = "User not authenticated" });

        try
        {
            var email = await _context.JobEmails
                .FirstOrDefaultAsync(e => e.EmailId == emailId && e.UserId == userId);

            if (email == null)
                return NotFound(new JobEmailSingleResponse { Success = false, Message = "Email not found" });

            if (request.JobTitle != null) email.JobTitle = request.JobTitle;
            if (request.CompanyName != null) email.CompanyName = request.CompanyName;
            if (request.EmailContent != null) 
            {
                email.EmailContent = request.EmailContent;
                // Re-parse when content changes
                var parseResult = _parserService.ParseEmail(request.EmailContent);
                email.CleanedContent = parseResult.CleanedContent;
                email.Status = parseResult.ParseSuccessful ? "Parsed" : "Failed";
                email.ParsedSkills = parseResult.ExtractedSkills.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.ExtractedSkills) : null;
                email.Responsibilities = parseResult.Responsibilities.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.Responsibilities) : null;
                email.RequiredQualifications = parseResult.RequiredQualifications.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.RequiredQualifications) : null;
                email.PreferredSkills = parseResult.PreferredSkills.Count > 0 
                    ? JsonSerializer.Serialize(parseResult.PreferredSkills) : null;
                email.JobDescription = parseResult.JobDescription;
                email.ParsedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Email {EmailId} updated by user {UserId}", emailId, userId);

            return Ok(new JobEmailSingleResponse
            {
                Success = true,
                Message = "Email updated successfully",
                Email = MapToResponse(email)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating email {EmailId}", emailId);
            return StatusCode(500, new JobEmailSingleResponse
            {
                Success = false,
                Message = "An error occurred while updating the email"
            });
        }
    }

    // Deletes a job email
    [HttpDelete("{emailId}")]
    [ProducesResponseType(typeof(JobEmailSingleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(JobEmailSingleResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEmail(int emailId)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized(new JobEmailSingleResponse { Success = false, Message = "User not authenticated" });

        try
        {
            var email = await _context.JobEmails
                .FirstOrDefaultAsync(e => e.EmailId == emailId && e.UserId == userId);

            if (email == null)
                return NotFound(new JobEmailSingleResponse { Success = false, Message = "Email not found" });

            _context.JobEmails.Remove(email);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Email {EmailId} deleted by user {UserId}", emailId, userId);

            return Ok(new JobEmailSingleResponse
            {
                Success = true,
                Message = "Email deleted successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting email {EmailId}", emailId);
            return StatusCode(500, new JobEmailSingleResponse
            {
                Success = false,
                Message = "An error occurred while deleting the email"
            });
        }
    }

    // Maps entity to response DTO
    private static JobEmailResponse MapToResponse(JobEmail email)
    {
        return new JobEmailResponse
        {
            EmailId = email.EmailId,
            UserId = email.UserId,
            JobTitle = email.JobTitle,
            CompanyName = email.CompanyName,
            EmailContent = email.EmailContent,
            CleanedContent = email.CleanedContent,
            UploadDate = email.UploadDate,
            ParsedSkills = DeserializeList(email.ParsedSkills),
            Responsibilities = DeserializeList(email.Responsibilities),
            RequiredQualifications = DeserializeList(email.RequiredQualifications),
            PreferredSkills = DeserializeList(email.PreferredSkills),
            JobDescription = email.JobDescription,
            Status = email.Status,
            ParseError = email.ParseError,
            OriginalFileName = email.OriginalFileName,
            FileType = email.FileType,
            ParsedAt = email.ParsedAt
        };
    }

    // Safely deserializes JSON to list
    private static List<string>? DeserializeList(string? json)
    {
        if (string.IsNullOrEmpty(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json);
        }
        catch
        {
            return null;
        }
    }
}
