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

    public DocumentController(DocumentService docService)
    {
        this.docService = docService;
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
    
    [HttpGet("user/{userId}")]
    public IActionResult GetUserDocuments(Guid userId, int limit = 10, int offset = 0)
    {
        var documents = docService.GetUserDocuments(userId);
        var paginatedDocuments = documents
            .Skip(offset)
            .Take(limit)
            .ToList();
        
        return Ok(paginatedDocuments);
    }

    [Authenticated]
    [HttpPost("register")]
    public IActionResult RegisterDocument([FromBody] RegisterDocumentForm documentRegistration)
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
    public IActionResult UploadDocument(Guid documentId, IFormFile file)
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
        RawDocument? meta = docService.GetDocumentMetadata(userId);
        if (meta is null)
        {
            return NotFound("Documento nao encontrado");
        }

        Stream fileStream = file.OpenReadStream();
        // compilar o arquivo
        Stream? compiledStream = docService.CompileDocument(documentId, fileStream);
        fileStream.Close();
        if (compiledStream is null)
        {
            return BadRequest("Erro ao compilar o documento");
        }
        
        CompiledDocument compiled = docService.UploadDocument(meta, fileStream);
        docService.RemoveDocumentMetadata(documentId);
        
        return Ok(new { documentId = compiled.Id });
    }
}