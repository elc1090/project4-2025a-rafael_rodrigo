using backend.Filters;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AIController : ControllerBase
{
    private readonly GeminiService gemini;

    public AIController(GeminiService gemini)
    {
        this.gemini = gemini;
    }

    [Authenticated]
    [HttpGet("summarize")]
    public async Task<IActionResult> Summarize(Guid documentId)
    {
        if (documentId == Guid.Empty)
        {
            return BadRequest("Document ID cannot be empty.");
        }
        try
        {
            //string summary = await gemini.SummarizeDocumentAsync(documentId);
            string summary = "";
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }

    }
}
