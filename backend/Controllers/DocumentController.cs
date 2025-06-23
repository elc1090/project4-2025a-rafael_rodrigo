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
    private readonly UserService userService;

    public DocumentController(DocumentService docService, ILogger<DocumentController> logger, UserService userService)
    {
        this.docService = docService;
        this.logger = logger;
        this.userService = userService;
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
    //[Authenticated] autenticacao opcional
    public async Task<IActionResult> GetDocumentPdf(Guid documentId) {
        //Guid loggedUser = HttpContext.GetLoggedUser();
        Models.Document? document = docService.GetDocument(documentId);
        if (document is null) {
            return NotFound("Documento nao encontrado");
        }

        // autorizacao
        if (document.IsPublic || (HttpContext.IsAuthorized() && userService.GetUserByToken(HttpContext.GetBearerToken()) == document.Owner))
        {
            Stream? documentStream = await docService.GetDocumentContent(documentId);
            if (documentStream is null) {
                return NotFound("Documento nao encontrado");
            }
            // documentStream is disposed by File()
            return File(documentStream, "application/octet-stream", $"{document.Title}-{document.CurrentVersion[..4]}.pdf");
        }
        logger.LogInformation("Alguem tentou acessar documento {DocumentId} que nao eh publico", documentId);
        return NotFound("Documento nao encontrado");

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

        Models.Document document = new()
        {
            Id = Guid.NewGuid(),
            Owner = userId,
            Title = createDocumentForm.Name,
            CurrentVersion = Models.Document.CalculateVersion(createDocumentForm.SourceCode, createDocumentForm.Language),
            IsPublic = createDocumentForm.IsPublic,
            DocumentLanguage = createDocumentForm.Language,
            LastModificationTime = DateTime.UtcNow,
            SourceCode = createDocumentForm.SourceCode
        };
        logger.LogInformation("Usuario {UserId} criou um novo documento {DocumentId} ({DocumentTitle})", userId, document.Id, document.Title);
        bool success = docService.AddDocument(document);
        return success ? Ok() : StatusCode(500);
    }

    [Authenticated]
    [HttpGet("delete")]
    public IActionResult DeleteDocument(Guid documentId) {
        Guid userId = HttpContext.GetLoggedUser();

        var doc = docService.GetDocument(documentId);
        if (doc is null) {
            return NotFound("Documento nao encontrado");
        }

        // verifica se o documento pertence ao usuario
        if (doc.Owner != userId) {
            return Unauthorized("Usuario nao autorizado a deletar este documento");
        }

        docService.RemoveDocument(documentId);
        
        return Ok("Documento deletado com sucesso");
    }

    [Authenticated]
    [HttpGet("rename")]
    public IActionResult RenameDocument(Guid documentId, string newName) {
        Guid userId = HttpContext.GetLoggedUser();
        if (userId == Guid.Empty) {
            return Unauthorized("Usuario nao encontrado");
        }

        var doc = docService.GetDocument(documentId);
        if (doc is null) {
            return NotFound("Documento nao encontrado");
        }

        // verifica se o documento pertence ao usuario
        if (doc.Owner != userId) {
            return Unauthorized("Usuario nao autorizado a renomear este documento");
        }

        docService.UpdateName(documentId, newName);
        
        return Ok("Documento renomeado com sucesso");
    }

    [Authenticated]
    [HttpPut("update")]
    public IActionResult UpdateDocument(Guid documentId, [FromBody] string newSourceCode)
    {
        Guid userId = HttpContext.GetLoggedUser();
        var document = docService.GetDocument(documentId);
        if (document is null)
        {
            return NotFound("Documento nao encontrado");
        }

        // verifica se o documento pertence ao usuario
        if (document.Owner != userId)
        {
            return Unauthorized("Usuario nao autorizado a atualizar este documento");
        }

        // atualiza o codigo fonte e a versao
        document.SourceCode = newSourceCode;
        document.CurrentVersion = Models.Document.CalculateVersion(newSourceCode, document.DocumentLanguage);
        document.LastModificationTime = DateTime.UtcNow;
        docService.Update(document);
        return Ok();
    }
}