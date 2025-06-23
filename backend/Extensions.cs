using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace backend;

public static class Extensions
{
    public static Guid GetLoggedUser(this HttpContext context)
    {
        if (context.Items.TryGetValue("UserId", out var userIdObj) && userIdObj is Guid userId)
        {
            return userId;
        }
        throw new UnauthorizedAccessException("Usuario nao autenticado.");
    }

    public static bool IsAuthorized(this HttpContext context)
    {
        var request = context.Request;
        var authHeader = request.Headers["Authorization"].FirstOrDefault();

        if (authHeader == null || !authHeader.StartsWith("Bearer "))
        {
            return false;
        }

        return true;
    }

    public static string GetBearerToken(this HttpContext context)
    {
        var request = context.Request;
        var authHeader = request.Headers["Authorization"].FirstOrDefault();
        if (authHeader == null || !authHeader.StartsWith("Bearer "))
        {
            throw new UnauthorizedAccessException("Token de autenticação não encontrado.");
        }
        return authHeader.Substring("Bearer ".Length).Trim();
    }
}
