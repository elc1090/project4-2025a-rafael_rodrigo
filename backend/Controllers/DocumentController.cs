using System.Reflection.Metadata;
using backend.Filters;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DocumentController : ControllerBase
{
    private readonly DocumentService docService;
    private readonly ILogger<DocumentController> logger;

    public DocumentController(DocumentService docService, ILogger<DocumentController> logger)
    {
        this.docService = docService;
        this.logger = logger;
    }

    [HttpGet("dashboard")]
    public IActionResult Dashboard(int limit = 10, int offset = 0)
    {
        var documents = docService.GetDocuments(true);
        var paginatedDocuments = documents
            .Skip(offset)
            .Take(limit)
            .ToList();
        
        return Ok(paginatedDocuments);
    }
    
    [HttpGet("user/{userId:guid}")]
    [Authenticated]
    public IActionResult GetUserDocuments(Guid userId, int limit = 10, int offset = 0)
    {
        Guid loggedUser = HttpContext.GetLoggedUser();
        var documents = docService.GetUserDocuments(userId);
        var paginatedDocuments = documents
            .Where(x =>
            {
                // se eh consulta de outro usuario, oculta os documentos privados
                if (loggedUser == userId) {
                    return true;
                }
                else {
                    return x.IsPublic;
                }
            })
            .Skip(offset)
            .Take(limit)
            .ToList();
        
        return Ok(paginatedDocuments);
    }

    [HttpGet("{documentId:guid}/pdf")]
    [Authenticated]
    public async Task<IActionResult> GetDocumentPdf(Guid documentId) {
        Guid loggedUser = HttpContext.GetLoggedUser();
        Models.Document? document = docService.GetDocument(documentId);
        if (document is null) {
            return NotFound("Documento nao encontrado");
        }

        // autorizacao
        if(loggedUser != document.Owner && !document.IsPublic)
        {
            logger.LogInformation("Usuario {UserId} tentou acessar documento {DocumentId} que nao eh publico e eh de outro user", loggedUser, documentId);
            return NotFound("Documento nao encontrado");
        }

        Stream? documentStream = await docService.GetDocumentContent(documentId);
        if (documentStream is null) {
            return NotFound("Documento nao encontrado");
        }
        // documentStream is disposed by File()
        return File(documentStream, "application/octet-stream", $"{document.Title}-{document.CurrentVersion[..4]}.pdf");
    }

    [HttpGet("{documentId:guid}/data")]
    [Authenticated]
    public IActionResult GetDocumentData(Guid documentId)
    {
        Guid loggedUser = HttpContext.GetLoggedUser();
        Models.Document? document = docService.GetDocument(documentId);
        if (document is null)
        {
            return NotFound("Documento nao encontrado");
        }
        // autorizacao
        if(document.Owner != loggedUser && !document.IsPublic)
        {
            logger.LogInformation("Usuario {UserId} tentou acessar documento {DocumentId} que nao eh publico e eh de outro user", loggedUser, documentId);
            return NotFound("Documento nao encontrado");
        }
        return Ok(document);
    }

    [Authenticated]
    [HttpPost("new")]
    public IActionResult NewDocument([FromBody] CreateDocumentForm createDocumentForm)
    {
        if(createDocumentForm.Language != DocumentLanguage.Latex && createDocumentForm.Language != DocumentLanguage.Markdown)
        {
            return BadRequest("A linguagem do documento deve ser Latex ou Markdown");
        }

        Guid userId = HttpContext.GetLoggedUser();
        

    }

    [Authenticated]
    [HttpPost("register")]
    public IActionResult RegisterDocument([FromBody] CreateDocumentForm documentRegistration)
    {
        if (documentRegistration.Language == DocumentLanguage.Pdf || documentRegistration.Language == DocumentLanguage.Unknown)
        {
            return BadRequest("A linguagem do documento nao pode ser PDF ou Unknown");
        }

        Guid userId = (Guid)HttpContext.Items["UserId"];
        if (userId == Guid.Empty)
        {
            return Unauthorized("Usuario nao encontrado");
        }

        Guid docId = docService.RegisterDocumentMetadata(userId, documentRegistration.Name, documentRegistration.Language);
        
        return Ok(new { documentId = docId });
    }
    
    [Authenticated]
    [HttpPost("upload/{documentId:guid}")]
    public async Task<IActionResult> UploadDocument(Guid documentId, IFormFile file)
    {
        if (file.Length == 0)
        {
            return BadRequest("Arquivo vazio");
        }

        Guid userId = (Guid)HttpContext.Items["UserId"];
        if (userId == Guid.Empty)
        {
            return Unauthorized("Usuario nao encontrado");
        }
        RawDocument? meta = docService.GetDocumentMetadata(documentId);
        if (meta is null)
        {
            return NotFound("Documento nao encontrado");
        }

        // verifica se o documento pertence ao usuario
        if (meta.Owner != userId) {
            return Unauthorized("Usuario nao autorizado a fazer upload deste documento");
        }

        Stream fileStream = file.OpenReadStream();
        // compilar o arquivo
        Stream? compiledStream = await docService.CompileDocument(documentId, fileStream);
        fileStream.Dispose();
        if (compiledStream is null)
        {
            return BadRequest("Erro ao compilar o documento");
        }
        
        CompiledDocument compiled = docService.UploadDocument(meta, compiledStream);
        docService.RemoveDocumentMetadata(documentId);

        return Ok(new { documentId = compiled.Id });
    }

    [Authenticated]
    [HttpGet("delete")]
    public IActionResult DeleteDocument(Guid documentId) {
        Guid userId = (Guid)HttpContext.Items["UserId"];
        if (userId == Guid.Empty) {
            return Unauthorized("Usuario nao encontrado");
        }

        var doc = docService.GetDocument(documentId);
        if (doc is null) {
            return NotFound("Documento nao encontrado");
        }

        // verifica se o documento pertence ao usuario
        if (doc.UserId != userId) {
            return Unauthorized("Usuario nao autorizado a deletar este documento");
        }

        docService.RemoveDocument(documentId);
        
        return Ok("Documento deletado com sucesso");
    }

    [Authenticated]
    [HttpGet("rename")]
    public IActionResult RenameDocument(Guid documentId, string newName) {
        Guid userId = (Guid)HttpContext.Items["UserId"];
        if (userId == Guid.Empty) {
            return Unauthorized("Usuario nao encontrado");
        }

        var doc = docService.GetDocument(documentId);
        if (doc is null) {
            return NotFound("Documento nao encontrado");
        }

        // verifica se o documento pertence ao usuario
        if (doc.UserId != userId) {
            return Unauthorized("Usuario nao autorizado a renomear este documento");
        }

        docService.UpdateName(documentId, newName);
        
        return Ok("Documento renomeado com sucesso");
    }
}