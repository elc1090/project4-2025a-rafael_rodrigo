using LiteDB;

namespace backend.Models;

/// <summary>
/// Representa uma snapshot de um <see cref="Document"/> que
/// foi convertida para o formato imutavel de PDF.
/// </summary>
public class RenderedDocument
{
    /// <summary>
    /// Id unico desta renderizacao
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Id do documento original que foi renderizado.
    /// </summary>
    public Guid DocumentId { get; set; }

    /// <summary>
    /// O numero da versao desta renderizacao.
    /// </summary>
    public string DocumentVersion { get; set; } = string.Empty;
}
