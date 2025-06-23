using backend.Filters;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Any;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AIController : ControllerBase
{
    private readonly GeminiService gemini;
    private readonly DocumentService documentService;
    private readonly ILogger<AIController> logger;

    public AIController(GeminiService gemini, DocumentService documentService, ILogger<AIController> logger)
    {
        this.gemini = gemini;
        this.documentService = documentService;
        this.logger = logger;
    }

    [Authenticated]
    [HttpGet("summarize")]
    public async Task<IActionResult> Summarize(Guid documentId)
    {
        if (documentId == Guid.Empty)
        {
            return BadRequest("Document ID cannot be empty.");
        }
        var doc = documentService.GetDocument(documentId);
        Guid loggedUser = HttpContext.GetLoggedUser();
        if (doc is null)
        {
            return NotFound("Document not found.");
        }
        // authorization
        if (loggedUser != doc.Owner && !doc.IsPublic)
        {
            return NotFound("Document not found.");
        }

        try
        {
            logger.LogInformation("Vou fazer request para gemini");
            string summary = await gemini.SummarizeAsync(doc.SourceCode);
            logger.LogInformation("Request feito. resposta: " + summary);
            if(summary== "Erro na requisicao para gemini API.")
            {
                return StatusCode(500, "Erro ao fazer requisicao para Gemini API. Verifique os logs.");
            }
            logger.LogInformation("Retornando ok para gemini");
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }

    }
}
