namespace backend.Models;

/// <summary>
/// Representa um documento que ainda nao foi compilado.
/// </summary>
public class RawDocument
{
    /// <summary>
    /// O id unico do documento.
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// O id do usuario que criou o documento.
    /// </summary>
    public Guid Owner { get; set; }

    /// <summary>
    /// O titulo do documento.
    /// </summary>
    public string Name { get; set; } = "";
    
    /// <summary>
    /// A linguagem de programacao do documento
    /// </summary>
    public DocumentLanguage Language { get; set; } = DocumentLanguage.Unknown;
}