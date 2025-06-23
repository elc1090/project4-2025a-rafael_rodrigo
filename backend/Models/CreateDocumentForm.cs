namespace backend.Models;

/// <summary>
/// Formulario para registrar um novo documento.
/// </summary>
public class CreateDocumentForm
{
    /// <summary>
    /// O titulo do documento
    /// </summary>
    public string Name { get; set; } = "";
    
    /// <summary>
    /// A linguagem do documento. Nao pode ser <see cref="DocumentLanguage.Pdf"/>
    /// </summary>
    public DocumentLanguage Language { get; set; } = DocumentLanguage.Unknown;

    /// <summary>
    /// O codigo submitado pelo usuario. Pode ser Markdown ou Latex.
    /// </summary>
    public string SourceCode { get; set; } = string.Empty;

    /// <summary>
    /// Define se o documento pode ser visto por outros usuarios.
    /// </summary>
    public bool IsPublic { get; set; } = true;
}