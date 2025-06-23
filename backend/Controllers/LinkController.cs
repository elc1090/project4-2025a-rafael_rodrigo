using backend.Filters;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/share")]
[ApiController]
public class LinkController : ControllerBase
{
    private ILogger<LinkController> logger;
    private LinkService linkService;
    private RendererService renderer;
    private DocumentService documentService;

    public LinkController(ILogger<LinkController> logger, LinkService linkService, RendererService renderer, DocumentService documentService)
    {
        this.logger = logger;
        this.linkService = linkService;
        this.renderer = renderer;
        this.documentService = documentService;
    }

    [HttpGet("{shortname}")]
    public IActionResult GetLink(string shortname)
    {
        if (string.IsNullOrEmpty(shortname))
        {
            logger.LogWarning("Received empty or null shortname.");
            return BadRequest("Shortname cannot be empty.");
        }
        (Guid documentId, string version) = linkService.Resolve(shortname);
        if (documentId == Guid.Empty)
        {
            logger.LogInformation("Link not found for shortname: {Shortname}", shortname);
            return NotFound("Link not found.");
        }
        string url = $"http://web-t3.rodrigoappelt.com:8080/api/document/{documentId}/pdf";
        logger.LogInformation("Redirecting to URL: {Url} for shortname: {Shortname}", url, shortname);
        return Redirect(url);
    }

    [HttpPost("create")]
    [Authenticated]
    public async Task<IActionResult> CreateLink(Guid documentId, bool useLatest)
    {
        if (documentId == Guid.Empty)
        {
            logger.LogWarning("Received empty or null documentId.");
            return BadRequest("Document ID cannot be empty.");
        }

        var doc = documentService.GetDocument(documentId);
        if (doc is null)
        {
            logger.LogWarning("Document not found for ID: {DocumentId}", documentId);
            return NotFound("Document not found.");
        }

        if (!useLatest)
        {
            // garante que exista um rendered document
            await renderer.RenderAsync(doc);
        }

        var link = linkService.CreateLink(documentId, useLatest);
        if (link is null)
        {
            logger.LogError("Failed to create link for document ID: {DocumentId}", documentId);
            return StatusCode(500, "Failed to create link.");
        }
        logger.LogInformation("Created link with shortname: {ShortLink} for document ID: {DocumentId}", link, documentId);
        string pdfUrl = $"http://web-t3.rodrigoappelt.com:8080/api/document/{documentId}/pdf";
        string shortUrl = $"http://web-t3.rodrigoappelt.com:8080/api/share/{link}";
        return Ok(new { 
            shortname = link,
            pdfUrl,
            shortUrl
        });
    }
}
