namespace backend.Models;

/// <summary>
/// Classe que representa as informacoes retornadas apos a requisicao
/// de login do usuario.
/// </summary>
public class LoginResult {

    /// <summary>
    /// Token de autenticacao gerado para o usuario.
    /// </summary>
    public required string AuthToken { get; set; }

    /// <summary>
    /// Define se essa requisicao criou um usuario ou apenas logou.
    /// </summary>
    public required bool NewAccount { get; set; }
}
