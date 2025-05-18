namespace backend.Models;

/// <summary>
/// Representa um usuario da aplicacao
/// </summary>
public class User {

    /// <summary>
    /// Id unico de cada usuario.
    /// </summary>
    /// <remarks>Um campo chamado Id ou uma propriedade
    /// com atributo [BsonId] deve existir para o banco
    /// de dados</remarks>
    public Guid Id { get; set; }

    /// <summary>
    /// Nome de usuario do usuario.
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// Email do usuario. Atualmente nao utilizado
    /// </summary>
    public string Email { get; set; }

    /// <summary>
    /// A senha do usuario.
    /// </summary>
    public string Password { get; set; }

    /// <summary>
    /// Dia que o usuario criou a conta. Atualmente nao utilizado
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Dia que o usuario atualizou a conta. Atualmente nao utilizado
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Token de autenticacao gerado para o usuario.
    /// </summary>
    public string AuthToken { get; set; }

    public User()
    {
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
