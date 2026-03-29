// GeminiAIService.cs - Handles communication with Gemini AI via OpenRouter API.
// This service extracts skills from job descriptions, generates interview questions,
// and evaluates user answers to provide content quality scores and feedback.
// Uses prompt engineering to get structured JSON responses from the AI model.

using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using InterviewHub.API.Models;

namespace InterviewHub.API.Services.Candidate;

// Interface for AI operations - defines what the AI service must be able to do.
public interface IGeminiAIService
{
    Task<List<ExtractedSkillResult>> ExtractSkillsAsync(string jobDescription);
    Task<List<GeneratedQuestionResult>> GenerateQuestionsAsync(string jobDescription, List<string> skills, int questionsPerSkill = 3);
    Task<AnswerEvaluationResult> EvaluateAnswerAsync(string question, string answer, string? sampleAnswer = null);
}

// DTO for skill extraction response
public class ExtractedSkillResult
{
    public string SkillName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public float Confidence { get; set; } = 1.0f;
}

// DTO for generated question response
public class GeneratedQuestionResult
{
    public string SkillName { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string? SampleAnswer { get; set; }
}

// DTO for AI answer evaluation result
public class AnswerEvaluationResult
{
    public int Score { get; set; } = 0;  // 0-100 score
    public int RelevanceScore { get; set; } = 0;  // How well answer addresses question
    public int CompletenessScore { get; set; } = 0;  // Covers key points
    public int ClarityScore { get; set; } = 0;  // Clear explanation
    public string Feedback { get; set; } = string.Empty;  // Personalized feedback
    public List<string> Strengths { get; set; } = new();  // What was good
    public List<string> Improvements { get; set; } = new();  // What to improve
    public string? IdealAnswer { get; set; }  // Sample ideal answer
}

// Main implementation - connects to OpenRouter API which hosts the Gemini AI model.
// We send carefully crafted prompts and parse the JSON responses.
public class GeminiAIService : IGeminiAIService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly ILogger<GeminiAIService> _logger;
    private const string OpenRouterApiUrl = "https://openrouter.ai/api/v1/chat/completions";

    public GeminiAIService(IConfiguration configuration, ILogger<GeminiAIService> logger)
    {
        _httpClient = new HttpClient();
        _apiKey = configuration["OpenRouterSettings:ApiKey"] 
            ?? throw new InvalidOperationException("OpenRouter API key not configured");
        _model = configuration["OpenRouterSettings:Model"] ?? "google/gemini-2.0-flash-001";
        _logger = logger;
        
        // Required headers for OpenRouter API
        _httpClient.DefaultRequestHeaders.Add("HTTP-Referer", "http://localhost:5052");
        _httpClient.DefaultRequestHeaders.Add("X-Title", "InterviewHub");
    }

    // Extracts skills from job description using AI with confidence scores
    public async Task<List<ExtractedSkillResult>> ExtractSkillsAsync(string jobDescription)
    {
        var skills = new List<ExtractedSkillResult>();

        try
        {
            var prompt = $@"Analyze the following job description and extract all skills mentioned. 
For each skill, categorize it as:
- Technical (programming languages, frameworks, tools, technologies)
- SoftSkill (communication, leadership, teamwork, problem-solving)
- Business (project management, strategy, agile, scrum)
- Industry (domain-specific knowledge)

Also provide a confidence score (0.0 to 1.0) for how certain you are this is a required skill.

Return ONLY a valid JSON array with no additional text. Format:
[
  {{""skillName"": ""React"", ""category"": ""Technical"", ""confidence"": 0.95}},
  {{""skillName"": ""Communication"", ""category"": ""SoftSkill"", ""confidence"": 0.8}}
]

Job Description:
{jobDescription}";

            var response = await CallOpenRouterApiAsync(prompt);
            
            if (!string.IsNullOrEmpty(response))
            {
                // Extract JSON array from response text
                var jsonStart = response.IndexOf('[');
                var jsonEnd = response.LastIndexOf(']');
                
                if (jsonStart >= 0 && jsonEnd > jsonStart)
                {
                    var jsonString = response.Substring(jsonStart, jsonEnd - jsonStart + 1);
                    var extractedSkills = JsonSerializer.Deserialize<List<ExtractedSkillResult>>(jsonString, 
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    
                    if (extractedSkills != null)
                        skills = extractedSkills;
                }
            }

            _logger.LogInformation("Extracted {Count} skills from job description", skills.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting skills with OpenRouter API");
        }

        return skills;
    }

    // Generates interview questions for specific skills using AI
    public async Task<List<GeneratedQuestionResult>> GenerateQuestionsAsync(
        string jobDescription, 
        List<string> skills, 
        int questionsPerSkill = 3)
    {
        var questions = new List<GeneratedQuestionResult>();

        try
        {
            var skillsText = string.Join(", ", skills);
            var prompt = $@"Based on the following job description and skills, generate interview questions.

For each skill, generate {questionsPerSkill} questions with variety in:
- Question Type: Technical (explain concepts, solve problems), Behavioral (past experiences), Situational (hypothetical scenarios)
- Difficulty: Easy, Medium, Hard

Return ONLY a valid JSON array with no additional text. Format:
[
  {{
    ""skillName"": ""React"",
    ""questionText"": ""Explain how React's virtual DOM works and why it improves performance."",
    ""questionType"": ""Technical"",
    ""difficulty"": ""Medium"",
    ""sampleAnswer"": ""Brief answer hint""
  }}
]

Skills to cover: {skillsText}

Job Description:
{jobDescription}";

            var response = await CallOpenRouterApiAsync(prompt);
            
            if (!string.IsNullOrEmpty(response))
            {
                // Parse JSON array from response
                var jsonStart = response.IndexOf('[');
                var jsonEnd = response.LastIndexOf(']');
                
                if (jsonStart >= 0 && jsonEnd > jsonStart)
                {
                    var jsonString = response.Substring(jsonStart, jsonEnd - jsonStart + 1);
                    var generatedQuestions = JsonSerializer.Deserialize<List<GeneratedQuestionResult>>(jsonString,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    
                    if (generatedQuestions != null)
                        questions = generatedQuestions;
                }
            }

            _logger.LogInformation("Generated {Count} questions for {SkillCount} skills", 
                questions.Count, skills.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating questions with OpenRouter API");
        }

        return questions;
    }

    // Sends prompt to OpenRouter API and returns response text
    private async Task<string> CallOpenRouterApiAsync(string prompt)
    {
        try
        {
            var requestBody = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "user", content = prompt }
                },
                temperature = 0.7,
                max_tokens = 4096
            };
            //serialize convert c# to
            var jsonContent = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            using var request = new HttpRequestMessage(HttpMethod.Post, OpenRouterApiUrl);
            request.Content = content;
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseJson);
                
                // Extract text from OpenAI-compatible response format
                var choices = doc.RootElement.GetProperty("choices");
                if (choices.GetArrayLength() > 0)
                {
                    var firstChoice = choices[0];
                    var message = firstChoice.GetProperty("message");
                    return message.GetProperty("content").GetString() ?? string.Empty;
                }
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("OpenRouter API error: {StatusCode} - {Content}", 
                    response.StatusCode, errorContent);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling OpenRouter API");
        }

        return string.Empty;
    }

    // Evaluates an interview answer using AI and provides detailed feedback
    public async Task<AnswerEvaluationResult> EvaluateAnswerAsync(
        string question, 
        string answer, 
        string? sampleAnswer = null)
    {
        var result = new AnswerEvaluationResult();

        try
        {
            // Handle empty answers
            if (string.IsNullOrWhiteSpace(answer) || answer.Length < 10)
            {
                return new AnswerEvaluationResult
                {
                    Score = 0,
                    RelevanceScore = 0,
                    CompletenessScore = 0,
                    ClarityScore = 0,
                    Feedback = "No answer provided or answer too short.",
                    Improvements = new List<string> { "Provide a complete answer addressing the question" }
                };
            }

            var sampleContext = !string.IsNullOrEmpty(sampleAnswer) 
                ? $"\n\nReference answer for comparison:\n{sampleAnswer}" 
                : "";

            var prompt = $@"You are an expert interview evaluator. Evaluate the following interview answer.

QUESTION: {question}

CANDIDATE'S ANSWER: {answer}{sampleContext}

Evaluate and score the answer on these criteria (0-100 each):
1. Relevance: How well does the answer address the question?
2. Completeness: Does it cover the key points expected?
3. Clarity: Is the explanation clear and well-structured?

Return ONLY valid JSON with no additional text:
{{
  ""score"": 75,
  ""relevanceScore"": 80,
  ""completenessScore"": 70,
  ""clarityScore"": 75,
  ""feedback"": ""Brief overall feedback in 1-2 sentences"",
  ""strengths"": [""Good point 1"", ""Good point 2""],
  ""improvements"": [""Could improve on X"", ""Consider adding Y""],
  ""idealAnswer"": ""A concise ideal answer in 2-3 sentences""
}}";

            var response = await CallOpenRouterApiAsync(prompt);

            if (!string.IsNullOrEmpty(response))
            {
                // Parse JSON response
                var jsonStart = response.IndexOf('{');
                var jsonEnd = response.LastIndexOf('}');

                if (jsonStart >= 0 && jsonEnd > jsonStart)
                {
                    var jsonString = response.Substring(jsonStart, jsonEnd - jsonStart + 1);
                    var evaluation = JsonSerializer.Deserialize<AnswerEvaluationResult>(jsonString,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (evaluation != null)
                        return evaluation;
                }
            }

            _logger.LogWarning("Failed to parse AI evaluation, using fallback scoring");
            
            // Fallback scoring based on answer length
            var wordCount = answer.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
            var baseScore = Math.Min(100, wordCount * 2);
            
            return new AnswerEvaluationResult
            {
                Score = baseScore,
                RelevanceScore = baseScore,
                CompletenessScore = baseScore,
                ClarityScore = baseScore,
                Feedback = "Answer received. AI evaluation temporarily unavailable.",
                Strengths = new List<string> { "Answer provided" },
                Improvements = new List<string> { "Continue practicing for better responses" }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating answer with AI");
            return result;
        }
    }
}
