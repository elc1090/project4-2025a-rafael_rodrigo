namespace backend.Models;

/// <summary>
/// Enumerador com todas as possibilidades de linguagem e formato
/// de documento. Normalmente as entradas sao <see cref="Markdown"/>
/// ou <see cref="Latex"/> e as saidas sao <see cref="Pdf"/>.
/// </summary>
public enum DocumentLanguage
{
    Unknown,
    Markdown,
    Latex,
    Pdf
}