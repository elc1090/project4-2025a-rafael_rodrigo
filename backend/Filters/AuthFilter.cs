using backend.Services;
using Microsoft.AspNetCore.DataProtection.AuthenticatedEncryption.ConfigurationModel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Filters;

/// <summary>
/// Filtro de autenticacao de requests.
/// </summary>
public class AuthFilter : IAsyncActionFilter {

    private readonly UserService db;
    private readonly ILogger<AuthFilter> logger;

    public AuthFilter(UserService db, ILogger<AuthFilter> logger) {
        this.db = db;
        this.logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next) {
        var request = context.HttpContext.Request;
        var authHeader = request.Headers["Authorization"].FirstOrDefault();

        if (authHeader == null || !authHeader.StartsWith("Bearer ")) {
            logger.LogWarning("Unauthorized request: Missing or invalid Authorization header.");
            context.Result = new UnauthorizedResult();
            return;
        }

        var token = authHeader.Substring("Bearer ".Length).Trim();

        // Aqui tu verifica o token (por exemplo, se tá em uma lista de tokens válidos, ou decodifica ele, etc)
        Guid id = IsTokenValid(token);
        if (id == Guid.Empty) {
            logger.LogWarning("Unauthorized request: Invalid token.");
            context.Result = new UnauthorizedResult();
            return;
        }

        // Se quiser, tu pode colocar informações do "usuário autenticado" no contexto:
        request.HttpContext.Items["UserId"] = id;

        await next();
    }

    private Guid IsTokenValid(string token) => db.GetUserByToken(token);
}
