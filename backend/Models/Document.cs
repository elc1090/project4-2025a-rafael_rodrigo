using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;

namespace backend.Models;

/// <summary>
/// Representa um documento na plataforma que pertence a um usuario
/// </summary>
public class Document
{
    /// <summary>
    /// O id unico deste documento.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Id unico do dono deste documento.
    /// </summary>
    public Guid Owner { get; set; }

    /// <summary>
    /// O titulo do documento.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Define se este documento pode ser visto por outros usuarios.
    /// </summary>
    public bool IsPublic { get; set; } = true;

    /// <summary>
    /// A versao do documento. Eh um hash gerado a partir do codigo
    /// fonte atual.
    /// </summary>
    public string CurrentVersion { get; set; } = string.Empty;

    /// <summary>
    /// O codigo fonte deste documento. Pode atualmente ser Markdown ou Latex.
    /// </summary>
    public string SourceCode { get; set; } = string.Empty;

    /// <summary>
    /// Data da ultima modificacao
    /// </summary>
    public DateTime LastModificationTime { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// O tipo de documento. Pode ser <see cref="DocumentLanguage.Latex"/> ou <see cref="DocumentLanguage.Markdown"/>
    /// </summary>
    public DocumentLanguage DocumentLanguage { get; set; } = DocumentLanguage.Unknown;

    public static string CalculateVersion(string sourceCode, DocumentLanguage language)
    {
        var hash = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(sourceCode + language.ToString()));
        return Convert.ToBase64String(hash);
    }
}