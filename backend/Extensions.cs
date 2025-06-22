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
}
