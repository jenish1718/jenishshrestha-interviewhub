/*
 * JobEmailParserService.cs - Job Description Parser
 * Extracts job title, company, skills, responsibilities, and qualifications
 * from pasted job descriptions using regex pattern matching.
 */

using System.Text.RegularExpressions;
using InterviewHub.API.Models;

namespace InterviewHub.API.Services.Candidate;

/// <summary>
/// Interface for parsing job descriptions
/// </summary>
public interface IJobEmailParserService
{
    ParsedJobEmail ParseEmail(string content);
}

/// <summary>
/// DTO containing all extracted information from a job description
/// </summary>
public class ParsedJobEmail
{
    public string? JobTitle { get; set; }
    public string? CompanyName { get; set; }
    public string CleanedContent { get; set; } = string.Empty;
    public List<string> Responsibilities { get; set; } = new();
    public List<string> RequiredQualifications { get; set; } = new();
    public List<string> PreferredSkills { get; set; } = new();
    public List<string> ExtractedSkills { get; set; } = new();
    public string? JobDescription { get; set; }
    public bool ParseSuccessful { get; set; }
    public string? ParseError { get; set; }
}

/// <summary>
/// Parses job descriptions using regex patterns to extract structured data.
/// Identifies job titles, company names, skills, and section content.
/// </summary>
public class JobEmailParserService : IJobEmailParserService
{
    private readonly ILogger<JobEmailParserService> _logger;

    // Patterns for extracting job titles
    private static readonly string[] JobTitlePatterns = new[]
    {
        @"(?i)(?:job\s*title|position|role)\s*[:\-]?\s*(.+?)(?:\n|$)",
        @"(?i)(?:we\s+are\s+(?:looking|hiring|seeking)\s+(?:for\s+)?(?:a|an)?\s*)(.+?)(?:\s+to\s+join|\s+who|\.|$)",
        @"(?i)^(.+?(?:engineer|developer|manager|analyst|designer|architect|lead|specialist|consultant|director|coordinator|administrator))\s*[-–]",
        @"(?i)(?:hiring|opening|vacancy)\s+(?:for\s+)?(?:a|an)?\s*(.+?)(?:\n|$)",
    };

    // Patterns for extracting company names
    private static readonly string[] CompanyPatterns = new[]
    {
        @"(?i)(?:company|organization|employer)\s*[:\-]?\s*(.+?)(?:\n|$)",
        @"(?i)(?:at|join)\s+(.+?(?:Inc\.?|LLC|Ltd\.?|Corp\.?|Corporation|Company|Co\.?))",
        @"(?i)(?:about|welcome\s+to)\s+(.+?)(?:\n|\.|\,|!|$)",
        @"(?i)^From:\s*.+?@(.+?)\.(com|org|net|io)",
    };

    // Section headers for extracting specific parts
    private static readonly Dictionary<string, string[]> SectionPatterns = new()
    {
        ["responsibilities"] = new[] {
            @"(?i)(?:responsibilities|duties|what\s+you['']?ll\s+do|your\s+role|key\s+responsibilities)\s*[:\-]?\s*\n?([\s\S]+?)(?=\n\s*(?:requirements|qualifications|skills|about|benefits|what\s+we|preferred|$))",
        },
        ["qualifications"] = new[] {
            @"(?i)(?:requirements|qualifications|what\s+we['']?re\s+looking\s+for|must\s+have|required)\s*[:\-]?\s*\n?([\s\S]+?)(?=\n\s*(?:preferred|nice\s+to\s+have|benefits|about|responsibilities|$))",
        },
        ["preferred"] = new[] {
            @"(?i)(?:preferred|nice\s+to\s+have|bonus|plus|desired)\s*(?:skills|qualifications)?\s*[:\-]?\s*\n?([\s\S]+?)(?=\n\s*(?:benefits|about|salary|how\s+to|$))",
        },
        ["description"] = new[] {
            @"(?i)(?:job\s+description|about\s+(?:the\s+)?(?:role|position|job)|overview)\s*[:\-]?\s*\n?([\s\S]+?)(?=\n\s*(?:responsibilities|requirements|qualifications|$))",
        }
    };

    // Known technical skills for keyword matching
    private static readonly string[] TechnicalSkills = new[]
    {
        // Programming Languages
        "JavaScript", "TypeScript", "Python", "Java", "C#", "C\\+\\+", "Ruby", "Go", "Rust", "PHP", "Swift", "Kotlin",
        // Frontend
        "React", "Angular", "Vue", "Next\\.js", "HTML", "CSS", "SASS", "Tailwind", "Bootstrap",
        // Backend
        "Node\\.js", "Express", "Django", "Flask", "Spring", "ASP\\.NET", "Laravel", "Rails",
        // Databases
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "DynamoDB", "Firebase",
        // Cloud & DevOps
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "Terraform",
        // Tools
        "Git", "REST", "GraphQL", "Microservices", "Agile", "Scrum", "JIRA",
        // AI/ML
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision",
    };

    public JobEmailParserService(ILogger<JobEmailParserService> logger)
    {
        _logger = logger;
    }

    // Main parsing method - orchestrates all extraction steps
    public ParsedJobEmail ParseEmail(string content)
    {
        var result = new ParsedJobEmail();

        try
        {
            result.CleanedContent = CleanContent(content);
            result.JobTitle = ExtractJobTitle(result.CleanedContent);
            result.CompanyName = ExtractCompanyName(result.CleanedContent);
            result.Responsibilities = ExtractSection(result.CleanedContent, "responsibilities");
            result.RequiredQualifications = ExtractSection(result.CleanedContent, "qualifications");
            result.PreferredSkills = ExtractSection(result.CleanedContent, "preferred");
            result.JobDescription = ExtractJobDescription(result.CleanedContent);
            result.ExtractedSkills = ExtractTechnicalSkills(result.CleanedContent);

            result.ParseSuccessful = true;
            _logger.LogInformation("Parsed email. Title: {Title}, Company: {Company}, Skills: {Count}",
                result.JobTitle, result.CompanyName, result.ExtractedSkills.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing email content");
            result.ParseSuccessful = false;
            result.ParseError = ex.Message;
            result.CleanedContent = content;
        }

        return result;
    }

    // Removes HTML, URLs, and normalizes whitespace
    private string CleanContent(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return string.Empty;

        var cleaned = Regex.Replace(content, @"<[^>]+>", " "); // Remove HTML
        cleaned = Regex.Replace(cleaned, @"&[a-zA-Z]+;", " "); // HTML entities
        cleaned = Regex.Replace(cleaned, @"&#\d+;", " ");
        cleaned = Regex.Replace(cleaned, @"https?://\S+", " "); // URLs
        cleaned = Regex.Replace(cleaned, @"[\t\r]+", " ");
        cleaned = Regex.Replace(cleaned, @"\n{3,}", "\n\n");
        cleaned = Regex.Replace(cleaned, @"[ ]{2,}", " ");
        cleaned = Regex.Replace(cleaned, @"[^\w\s\-.,;:!?()'\""\/\n@#$%&*+]", " ");

        return cleaned.Trim();
    }

    // Extracts job title using pattern matching
    private string? ExtractJobTitle(string content)
    {
        foreach (var pattern in JobTitlePatterns)
        {
            var match = Regex.Match(content, pattern, RegexOptions.Multiline);
            if (match.Success && match.Groups.Count > 1)
            {
                var title = match.Groups[1].Value.Trim();
                title = Regex.Replace(title, @"\s+", " ");
                title = title.TrimEnd('.', ',', ':', '-');
                
                if (title.Length >= 3 && title.Length <= 100)
                    return title;
            }
        }

        // Fallback: look for job keywords in first lines
        var lines = content.Split('\n').Take(10);
        foreach (var line in lines)
        {
            if (Regex.IsMatch(line, @"(?i)(engineer|developer|manager|analyst|designer|lead|senior|junior|staff)"))
            {
                var cleanLine = line.Trim();
                if (cleanLine.Length >= 5 && cleanLine.Length <= 80)
                    return cleanLine;
            }
        }

        return null;
    }

    // Extracts company name using pattern matching
    private string? ExtractCompanyName(string content)
    {
        foreach (var pattern in CompanyPatterns)
        {
            var match = Regex.Match(content, pattern, RegexOptions.Multiline);
            if (match.Success && match.Groups.Count > 1)
            {
                var company = match.Groups[1].Value.Trim();
                company = Regex.Replace(company, @"\s+", " ");
                company = company.TrimEnd('.', ',', ':', '-');

                if (company.Length >= 2 && company.Length <= 100)
                    return company;
            }
        }

        return null;
    }

    // Extracts content from specific sections
    private List<string> ExtractSection(string content, string sectionType)
    {
        var items = new List<string>();

        if (!SectionPatterns.TryGetValue(sectionType, out var patterns))
            return items;

        foreach (var pattern in patterns)
        {
            var match = Regex.Match(content, pattern, RegexOptions.Multiline | RegexOptions.Singleline);
            if (match.Success && match.Groups.Count > 1)
            {
                var sectionContent = match.Groups[1].Value;
                items.AddRange(ExtractListItems(sectionContent));
                if (items.Count > 0) break;
            }
        }

        return items.Take(15).ToList(); // Limit items
    }

    // Parses bullet points from section content
    private List<string> ExtractListItems(string content)
    {
        var items = new List<string>();
        var lines = Regex.Split(content, @"(?:\n\s*[-•*▪▸→]\s*|\n\s*\d+[.)]\s*|\n{2,})");

        foreach (var line in lines)
        {
            var cleaned = line.Trim();
            cleaned = Regex.Replace(cleaned, @"^[-•*▪▸→\d.)\s]+", "");
            cleaned = cleaned.Trim();

            if (cleaned.Length >= 10 && cleaned.Length <= 500)
                items.Add(cleaned);
        }

        return items;
    }

    // Extracts job description paragraph
    private string? ExtractJobDescription(string content)
    {
        foreach (var pattern in SectionPatterns["description"])
        {
            var match = Regex.Match(content, pattern, RegexOptions.Multiline | RegexOptions.Singleline);
            if (match.Success && match.Groups.Count > 1)
            {
                var description = match.Groups[1].Value.Trim();
                if (description.Length >= 50)
                    return description.Length > 1000 ? description.Substring(0, 1000) + "..." : description;
            }
        }

        // Fallback: use first paragraph
        var paragraphs = content.Split(new[] { "\n\n" }, StringSplitOptions.RemoveEmptyEntries);
        if (paragraphs.Length > 0)
        {
            var firstPara = paragraphs[0].Trim();
            if (firstPara.Length >= 50)
                return firstPara.Length > 500 ? firstPara.Substring(0, 500) + "..." : firstPara;
        }

        return null;
    }

    // Identifies technical skills mentioned in content
    private List<string> ExtractTechnicalSkills(string content)
    {
        var foundSkills = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var skill in TechnicalSkills)
        {
            var pattern = $@"\b{skill}\b";
            if (Regex.IsMatch(content, pattern, RegexOptions.IgnoreCase))
            {
                var normalizedSkill = skill.Replace("\\.", ".").Replace("\\+", "+");
                foundSkills.Add(normalizedSkill);
            }
        }

        // Also extract from "X years experience" patterns
        var expPatterns = Regex.Matches(content, 
            @"(\d+)\+?\s*(?:years?|yrs?)?\s*(?:of\s+)?(?:experience\s+(?:with|in|using)\s+)?([A-Za-z#\+\.]+)", 
            RegexOptions.IgnoreCase);
        
        foreach (Match match in expPatterns)
        {
            if (match.Groups.Count > 2)
            {
                var tech = match.Groups[2].Value;
                if (tech.Length >= 2 && tech.Length <= 20)
                    foundSkills.Add(tech);
            }
        }

        return foundSkills.OrderBy(s => s).ToList();
    }
}
