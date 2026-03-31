/*
 * AdminAuthorizeAttribute.cs - Custom Authorization for Admin Endpoints
 * Validates that the authenticated user has the Admin role.
 * Applied to controllers/actions that require admin access.
 */

using System.Security.Claims;
using InterviewHub.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace InterviewHub.API.Services.Admin;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AdminAuthorizeAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        // Check if user is authenticated
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Authentication required" });
            return;
        }

        // Check if user has Admin role
        var roleClaim = user.FindFirst(ClaimTypes.Role)?.Value;
        if (roleClaim != UserRole.Admin.ToString())
        {
            context.Result = new ForbidResult();
            return;
        }
    }
}
