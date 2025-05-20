namespace backend.Models;

/// <summary>
/// Formulario para registrar um novo documento.
/// </summary>
public class RegisterDocumentForm
{
    /// <summary>
    /// O titulo do documento
    /// </summary>
    public string Name { get; set; } = "";
    
    /// <summary>
    /// A linguagem do documento. Nao pode ser <see cref="DocumentLanguage.Pdf"/>
    /// </summary>
    public DocumentLanguage Language { get; set; } = DocumentLanguage.Unknown;
}