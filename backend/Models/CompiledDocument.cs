namespace backend.Models;

/// <summary>
/// Representa um documento compilado na plataforma
/// </summary>
public class CompiledDocument {
    /// <summary>
    /// O id unico do documento.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// O titulo do documento.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// O id do usuario que criou o documento.
    /// </summary>
    public Guid UserId { get; set; }
}
