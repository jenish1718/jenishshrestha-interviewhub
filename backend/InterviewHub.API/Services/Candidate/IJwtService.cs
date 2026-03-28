/*
 * IJwtService.cs - JWT Service Interface
 * Defines token generation and validation operations.
 */

using InterviewHub.API.Models;

namespace InterviewHub.API.Services.Candidate;

/// <summary>
/// Interface for JWT token operations
/// </summary>
public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    bool ValidateRefreshToken(string token);
}
