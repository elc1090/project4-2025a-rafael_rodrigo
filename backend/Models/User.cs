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

    public UserType UserType { get; set; }

    #region Native Users

    /// <summary>
    /// Nome de usuario do usuario.
    /// </summary>
    public string Name { get; set; }

    /// <summary>
    /// A senha do usuario.
    /// </summary>
    public string Password { get; set; }

    #endregion

    #region GitHub Users

    public string GithubAccessToken { get; set; } = string.Empty;
    public string GithubLogin { get; set; } = string.Empty;
    public string GithubName { get; set; } = string.Empty;
    public string GithubAvatarUrl { get; set; } = string.Empty;

    #endregion

    /// <summary>
    /// Token de autenticacao gerado para o usuario.
    /// </summary>
    public string AuthToken { get; set; }

    public User()
    {
    }
}

public enum UserType
{
    Native,
    GitHub
}