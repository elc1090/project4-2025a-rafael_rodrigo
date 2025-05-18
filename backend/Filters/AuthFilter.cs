using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Filters;

/// <summary>
/// Filtro de autenticacao de requests.
/// </summary>
public class AuthFilter : IAsyncActionFilter {

    private readonly DatabaseService db;

    public AuthFilter(DatabaseService db) {
        this.db = db;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next) {
        var request = context.HttpContext.Request;
        var authHeader = request.Headers["Authorization"].FirstOrDefault();

        if (authHeader == null || !authHeader.StartsWith("Bearer ")) {
            context.Result = new UnauthorizedResult();
            return;
        }

        var token = authHeader.Substring("Bearer ".Length).Trim();

        // Aqui tu verifica o token (por exemplo, se tá em uma lista de tokens válidos, ou decodifica ele, etc)
        Guid id = IsTokenValid(token);
        if (id == Guid.Empty) {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Se quiser, tu pode colocar informações do "usuário autenticado" no contexto:
        request.HttpContext.Items["UserId"] = id;

        await next();
    }

    private Guid IsTokenValid(string token) => db.GetUserByToken(token);
}
