using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/share")]
[ApiController]
public class LinkController : ControllerBase
{
    private ILogger<LinkController> logger;
    private LinkService linkService;

    public LinkController(ILogger<LinkController> logger, LinkService linkService)
    {
        this.logger = logger;
        this.linkService = linkService;
    }

    [HttpGet("{shortname}")]
    public IActionResult GetLink(string shortname)
    {
        if (string.IsNullOrEmpty(shortname))
        {
            logger.LogWarning("Received empty or null shortname.");
            return BadRequest("Shortname cannot be empty.");
        }
        var documentId = linkService.Resolve(shortname);
        if (documentId == Guid.Empty)
        {
            logger.LogInformation("Link not found for shortname: {Shortname}", shortname);
            return NotFound("Link not found.");
        }
        string url = $"http://web-t3.rodrigoappelt.com:8080/api/document/{documentId}";
        logger.LogInformation("Redirecting to URL: {Url} for shortname: {Shortname}", url, shortname);
        return Redirect(url);
    }
}
