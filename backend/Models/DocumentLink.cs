namespace backend.Models;

/// <summary>
/// Classe que representa um link compartilhavel de uma versao de um documento.
/// </summary>
public class DocumentLink
{
    /// <summary>
    /// Id unico deste link compartilhavel
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Nome curto deste link, usado para facilitar o compartilhamento
    /// </summary>
    public string ShortLink { get; set; } = string.Empty;

    /// <summary>
    /// Id do documento ao qual este link esta associado.
    /// </summary>
    public Guid DocumentId { get; set; } = Guid.Empty;
}
