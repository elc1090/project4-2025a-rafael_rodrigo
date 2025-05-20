using backend.Models;
using LiteDB;

namespace backend.Services;

/// <summary>
/// Servico que gerencia os documentos.
/// </summary>
public class DocumentService
{
    private readonly LiteDatabase database;
    
    public DocumentService(UserService userService)
    {
        database = userService.Database;
    }

    /// <summary>
    /// Retorna uma lista com todos os documentos que um usuario tem.
    /// </summary>
    /// <param name="userId">O id do usuario a ser procurado</param>
    /// <returns>Um enumerador com os documentos desse usuario</returns>
    public List<CompiledDocument> GetUserDocuments(Guid userId)
    {
        var col = database.GetCollection<CompiledDocument>();
        col.EnsureIndex(x => x.UserId);
        return col.Query()
            .Where(x => x.UserId == userId)
            .ToList();
    }

    /// <summary>
    /// Retorna uma <see cref="MemoryStream"/> com o conteudo deste documento.
    /// </summary>
    /// <remarks>
    /// O usuario eh responsavel por chamar <see cref="Stream.Dispose"/>
    /// no resultado.
    /// </remarks>
    /// <param name="documentId">O id do documento a ser buscado</param>
    /// <returns>Uma stream com o conteudo do arquivo ou null se o arquivo nao existe</returns>
    public Stream? GetDocument(Guid documentId)
    {
        var fs = database.GetStorage<Guid>();
        
        var file = fs.FindById(documentId);
        if (file is null)
        {
            return null;
        }
        var stream = new MemoryStream();
        file.CopyTo(stream);
        return stream;
    }
    
    /// <summary>
    /// Adiciona um novo documento ao banco de dados.
    /// </summary>
    /// <param name="document">O objeto com os metadados do documento</param>
    /// <param name="content">Uma stream com o conteudo do arquivo</param>
    public void AddDocument(CompiledDocument document, Stream content)
    {
        if (document.Id == Guid.Empty)
        {
            throw new ArgumentException("Document ID cannot be empty");
        }
        if (string.IsNullOrEmpty(document.Name))
        {
            throw new ArgumentException("Document name cannot be empty");
        }
        if (document.UserId == Guid.Empty)
        {
            throw new ArgumentException("User ID cannot be empty");
        }
        
        var col = database.GetCollection<CompiledDocument>();
        col.EnsureIndex(x => x.UserId);
        col.Insert(document);
        
        var fs = database.GetStorage<Guid>();
        var fileinfo = fs.Upload(document.Id, document.Name);
        using var ws = fileinfo.OpenWrite();
        content.CopyTo(ws);
    }
    
    /// <summary>
    /// Remove um documento permanentemente do banco de dados.
    /// </summary>
    /// <param name="documentId">O id do documento a ser removido</param>
    public void RemoveDocument(Guid documentId)
    {
        var col = database.GetCollection<CompiledDocument>();
        col.Delete(documentId);
        
        var fs = database.GetStorage<Guid>();
        fs.Delete(documentId);
    }
}