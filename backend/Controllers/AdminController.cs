using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AdminController : ControllerBase {

    private readonly UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    [HttpGet("flush")]
    public IActionResult FlushDatabase() {
        userService.Flush();
        return Ok("Database flushed");
    }
}
