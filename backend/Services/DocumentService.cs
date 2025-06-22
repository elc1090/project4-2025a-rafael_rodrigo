using backend.Models;
using LiteDB;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace backend.Services;

/// <summary>
/// Servico que gerencia os documentos.
/// </summary>
public class DocumentService
{
    private readonly UserService userService;
    private readonly HttpClient httpClient;
    private readonly RendererService renderer;
    private readonly ILogger<DocumentService> logger;
    private readonly LinkService linkService;


    public DocumentService(UserService userService, HttpClient httpClient, RendererService renderer, ILogger<DocumentService> logger, LinkService linkService)
    {
        this.userService = userService;
        this.httpClient = httpClient;
        this.renderer = renderer;
        this.logger = logger;
        this.linkService = linkService;
    }

    private LiteDatabase database => userService.Database;

    /// <summary>
    /// Retorna todos os documentos do banco de dados.
    /// </summary>
    /// <param name="ordered">Se os documentos devem ser ordenados em ordem descrescente de data</param>
    /// <returns>Um enumerador com todos os documentos existentes</returns>
    public IEnumerable<Document> GetDocuments(bool ordered)
    {
        var col = database.GetCollection<Document>();
        col.EnsureIndex(x => x.Id);
        if (ordered)
        {
            return col.Query()
                .Where(x => x.IsPublic)
                .OrderByDescending(x => x.LastModificationTime)
                .ToEnumerable();
        }
        return col.Query()
            .ToEnumerable();
    }
    
    /// <summary>
    /// Retorna uma lista com todos os documentos que um usuario tem.
    /// </summary>
    /// <param name="userId">O id do usuario a ser procurado</param>
    /// <returns>Um enumerador com os documentos desse usuario</returns>
    public List<Document> GetUserDocuments(Guid userId)
    {
        var col = database.GetCollection<Document>();
        col.EnsureIndex(x => x.Owner);
        return col.Query()
            .Where(x => x.Owner == userId)
            .ToList();
    }

    public Document? GetDocument(Guid documentId) {
        var col = database.GetCollection<Document>();
        col.EnsureIndex(x => x.Id);
        Document? doc = col.Query()
            .Where(x => x.Id == documentId)
            .FirstOrDefault();
        return doc;
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
    public async Task<Stream?> GetDocumentContent(Guid documentId)
    {
        var document = GetDocument(documentId);
        if (document is null)
        {
            logger.LogWarning("Document {DocumentId} not found", documentId);
            return null;
        }
        var rendered = await renderer.RenderAsync(document);
        if (rendered is null)
        {
            logger.LogWarning("Failed to render document {DocumentId}", documentId);
            return null;
        }

        var fs = database.GetStorage<Guid>();
        MemoryStream ms = new();
        var fileStream = fs.OpenRead(rendered.Id);
        fileStream.CopyTo(ms);
        fileStream.Dispose();
        ms.Seek(0, SeekOrigin.Begin);
        return ms;
    }
    
    /// <summary>
    /// Adiciona um novo documento ao banco de dados.
    /// </summary>
    /// <param name="document">O objeto com os metadados do documento</param>
    /// <param name="content">Uma stream com o conteudo do arquivo</param>
    public bool AddDocument(Document document)
    {
        if (document.Id == Guid.Empty)
        {
            logger.LogError("Document ID cannot be empty");
            return false;
        }
        ArgumentException.ThrowIfNullOrWhiteSpace(document.Title);
        if (document.Owner == Guid.Empty)
        {
            logger.LogError("Document owner cannot be empty");
            return false;
        }
        document.CurrentVersion = Document.CalculateVersion(document.SourceCode, document.DocumentLanguage);

        var col = database.GetCollection<Document>();
        col.EnsureIndex(x => x.Id);
        col.EnsureIndex(x => x.Owner);
        try
        {
            col.Insert(document);
        }
        catch (LiteException)
        {
            logger.LogWarning("Document with ID {DocumentId} already exists. Trying to update it instead", document.Id);
            col.Update(document.Id, document);
        }
        return true;
    }
    
    /// <summary>
    /// Remove um documento permanentemente do banco de dados.
    /// </summary>
    /// <param name="documentId">O id do documento a ser removido</param>
    public void RemoveDocument(Guid documentId)
    {
        var docCol = database.GetCollection<Document>();
        var renderCol = database.GetCollection<RenderedDocument>();
        var fs = database.GetStorage<Guid>();
        
        // limpa documento
        var doc = docCol.Query()
            .Where(x => x.Id == documentId)
            .FirstOrDefault();
        docCol.Delete(documentId);

        // limpa renderizacoes
        var renders = renderCol.Find(x => x.DocumentId == documentId);
        foreach(var render in renders)
        {
            fs.Delete(render.Id);
        }
        renderCol.DeleteMany(x => x.DocumentId == documentId);

        // limpa links
        linkService.DeleteLinks(documentId);
    }


    public void UpdateName(Guid documentId, string newName) {
        var col = database.GetCollection<Document>();
        col.EnsureIndex(x => x.Id);
        Document? doc = col.Query()
            .Where(x => x.Id == documentId)
            .FirstOrDefault();
        if (doc is null) {
            logger.LogWarning("Tentei atualizar nome de documento {DocumentId}, mas ele nao existe", documentId);
            return;
        }
        doc.Title = newName;
        col.Update(doc);
    }

    public void Update(Document document)
    {
        var col = database.GetCollection<Document>();
        col.EnsureIndex(x => x.Id);
        col.Update(document.Id, document);
    }
}