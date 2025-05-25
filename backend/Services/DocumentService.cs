using backend.Models;
using LiteDB;
using System.Net;

namespace backend.Services;

/// <summary>
/// Servico que gerencia os documentos.
/// </summary>
public class DocumentService
{
    private readonly LiteDatabase database;
    private readonly HttpClient httpClient;
    
    public DocumentService(UserService userService, HttpClient httpClient)
    {
        database = userService.Database;
        this.httpClient = httpClient;
    }

    /// <summary>
    /// Retorna todos os documentos do banco de dados.
    /// </summary>
    /// <param name="ordered">Se os documentos devem ser ordenados em ordem descrescente de data</param>
    /// <returns>Um enumerador com todos os documentos existentes</returns>
    public IEnumerable<CompiledDocument> GetDocuments(bool ordered)
    {
        var col = database.GetCollection<CompiledDocument>();
        col.EnsureIndex(x => x.Created);
        if (ordered)
        {
            return col.Query()
                .OrderByDescending(x => x.Created)
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
    public List<CompiledDocument> GetUserDocuments(Guid userId)
    {
        var col = database.GetCollection<CompiledDocument>();
        col.EnsureIndex(x => x.UserId);
        return col.Query()
            .Where(x => x.UserId == userId)
            .ToList();
    }

    public CompiledDocument? GetDocument(Guid documentId) {
        var col = database.GetCollection<CompiledDocument>();
        col.EnsureIndex(x => x.Id);
        CompiledDocument? doc = col.Query()
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
    public Stream? GetDocumentContent(Guid documentId)
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
    private void AddDocument(CompiledDocument document, Stream content)
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
        try {
            col.Insert(document);
        } catch (LiteException) {
            // deu algo errado na parte do servidor, esse arquivo ja existe
            // talvez falhou da ultima vez. deletamos a anterior pq sim e substitui por essa
            col.Delete(document.Id);
            col.Insert(document);
        }
        
        var fs = database.GetStorage<Guid>();
        var fileinfo = fs.Upload(document.Id, document.Name, content);
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

    
    /// <summary>
    /// Cria um novo objeto de intencao de criacao de documento.
    /// </summary>
    /// <param name="owner">O id do dono do documento</param>
    /// <param name="name">O titulo do documento</param>
    /// <returns>O id unico do documento</returns>
    public Guid RegisterDocumentMetadata(Guid owner, string name, DocumentLanguage language)
    {
        var col = database.GetCollection<RawDocument>();
        col.EnsureIndex(x => x.Id);
        RawDocument doc = new()
        {
            Id = Guid.NewGuid(),
            Owner = owner,
            Name = name,
            Language = language
        }; 
        Console.WriteLine($"Document {doc.Id} registered");
        col.Insert(doc);
        return doc.Id;
    }

    /// <summary>
    /// Retorna os metadados de um documento que nao foi terminado ainda.
    /// </summary>
    /// <param name="documentId">O id do documento</param>
    /// <returns>Retorna o objeto com os metadados ou null se ele nao existe</returns>
    public RawDocument? GetDocumentMetadata(Guid documentId)
    {
        var col = database.GetCollection<RawDocument>();
        col.EnsureIndex(x => x.Id);
        RawDocument? doc = col.Query()
            .Where(x => x.Id == documentId)
            .FirstOrDefault();
        return doc;
    }
    
    /// <summary>
    /// Remove os metadados de um arquivo nao terminado.
    /// </summary>
    /// <param name="documentId">O id do documento cujos metadados serao deletados</param>
    public void RemoveDocumentMetadata(Guid documentId)
    {
        var col = database.GetCollection<RawDocument>();
        col.Delete(documentId);
    }
    
    public CompiledDocument UploadDocument(RawDocument document, Stream content)
    {
        CompiledDocument doc = new()
        {
            Id = document.Id,
            Name = document.Name,
            UserId = document.Owner,
            Created = DateTime.UtcNow,
        };
        AddDocument(doc, content);
        return doc;
    }

    /// <summary>
    /// Compila um documento.
    /// </summary>
    /// <param name="documentId">O id do documento a ser compilado</param>
    /// <param name="input">O conteudo do arquivo de entrada</param>
    /// <returns>Uma stream com o resultado ou null se o arquivo nao existe</returns>
    public async Task<Stream?> CompileDocument(Guid documentId, Stream input)
    {
        RawDocument? metadata = GetDocumentMetadata(documentId);
        if (metadata is null)
        {
            return null;
        }

        string compilerBaseUrl = "http://latex-processor/compile";
        HttpMethod method = HttpMethod.Post;
        DocumentLanguage lang = metadata.Language;

        if(lang == DocumentLanguage.Markdown) {
            string url = compilerBaseUrl + "/markdown";

            var headers = new Dictionary<string, string>
            {
                { "output-type", "pdf" },
            };
            var fileContent = new StreamContent(input);
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/x-md");
            var request = new HttpRequestMessage(method, url) {
                Content = fileContent
            };
            foreach (var header in headers) {
                request.Headers.Add(header.Key, header.Value);
            }

            var response = await httpClient.SendAsync(request);
            if (response.StatusCode != HttpStatusCode.OK) {
                Console.WriteLine($"Erro ao compilar o documento: {response.StatusCode}. " +
                    $"Message: " + await response.Content.ReadAsStringAsync());
                return null;
            }

            var responseStream = await response.Content.ReadAsStreamAsync();
            return responseStream;


        } else if(lang == DocumentLanguage.Latex) {
            string url = compilerBaseUrl + "/latex";

            var headers = new Dictionary<string, string>
            {
                { "snippet", "false" },
                { "debug", "false" },
            };
            var fileContent = new StreamContent(input);

            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/x-tex");
            var request = new HttpRequestMessage(method, url) {
                Content = fileContent
            };
            foreach (var header in headers) {
                request.Headers.Add(header.Key, header.Value);
            }
            var response = await httpClient.SendAsync(request);

            if (response.StatusCode != HttpStatusCode.OK) {
                Console.WriteLine($"Erro ao compilar o documento: {response.StatusCode}. " +
                    $"Message: " + await response.Content.ReadAsStringAsync());
                return null;
            }
            var responseStream = await response.Content.ReadAsStreamAsync();
            return responseStream;
        } else {
            return null;
        }
    }
}