using backend.Models;
using System.Net.Http.Headers;
using static System.Net.Mime.MediaTypeNames;

namespace backend.Services;

/// <summary>
/// Servico especializado em renderizar um documento. Cria <see cref="RenderedDocument"/> 
/// a partir de <see cref="Document"/>
/// </summary>
public class RendererService
{
    private readonly ILogger<RendererService> logger;
    private readonly HttpClient httpClient;
    private readonly UserService userService;

    public RendererService(ILogger<RendererService> logger, HttpClient httpClient, UserService userService)
    {
        this.logger = logger;
        this.httpClient = httpClient;
        this.userService = userService;
    }

    public async Task<RenderedDocument?> RenderAsync(Document document)
    {
        if(document.DocumentLanguage != DocumentLanguage.Latex && document.DocumentLanguage != DocumentLanguage.Markdown)
        {
            logger.LogError("Tentativa de renderizar documento com linguagem desconhecida: {Language}", document.DocumentLanguage);
            return null;
        }

        var docCol = userService.Database.GetCollection<Document>();
        if (string.IsNullOrEmpty(document.CurrentVersion))
        {
            document.CurrentVersion = Document.CalculateVersion(document.SourceCode, document.DocumentLanguage);
            docCol.Update(document.Id, document);
        }

        // verifica se o documento ja existe
        var renderCol = userService.Database.GetCollection<RenderedDocument>();
        var render = renderCol.FindOne(x => x.DocumentId == document.Id && x.DocumentVersion == document.CurrentVersion);
        if(render is not null)
        {
            logger.LogInformation("Documento {DocumentId} ja renderizado na versao {Version}, retornando cache.", document.Id, document.CurrentVersion);
            // ja tem um cached
            return render;
        }
        // n tem cached, renderiza o documento

        string url = $"http://latex-processor/compile/{(document.DocumentLanguage == DocumentLanguage.Latex ? "latex" : "markdown")}";
        HttpRequestMessage request = new(HttpMethod.Post, url);
        // passar source code p/ stream
        using MemoryStream ms = new();
        using TextWriter writer = new StreamWriter(ms);
        writer.Write(document.SourceCode);
        writer.Flush();
        ms.Seek(0, SeekOrigin.Begin);

        HttpContent content = new StreamContent(ms);

        if (document.DocumentLanguage == DocumentLanguage.Latex)
        {
            request.Headers.Add("snippet", "false");
            request.Headers.Add("debug", "false");
            content.Headers.ContentType = new MediaTypeHeaderValue("application/x-tex");
        }
        else
        {
            request.Headers.Add("output-type", "pdf");
            content.Headers.ContentType = new MediaTypeHeaderValue("application/x-md");
        }
        request.Content = content;

        var response = await httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogError("Erro ao renderizar documento: {StatusCode} - {ReasonPhrase}", response.StatusCode, response.ReasonPhrase);
            return null;
        }

        Stream compiledStream = await response.Content.ReadAsStreamAsync();

        // cria obj no banco
        RenderedDocument renderedDocument = new()
        {
            Id = Guid.NewGuid(),
            DocumentId = document.Id,
            DocumentVersion = document.CurrentVersion,
        };
        renderCol.Insert(renderedDocument);
        // adiciona o stream no storage
        var fs = userService.Database.GetStorage<Guid>();
        fs.Upload(renderedDocument.Id, document.Title, compiledStream);
        compiledStream.Close();

        return renderedDocument;
    }
}
