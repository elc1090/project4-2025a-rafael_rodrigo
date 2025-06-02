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

    /// <summary>
    /// Flushes the database, storing all data cached into memory
    /// to the disk.
    /// </summary>
    [HttpGet("db/flush")]
    public IActionResult FlushDatabase() {
        userService.Flush();
        return Ok("Database flushed");
    }

    /// <summary>
    /// Disposes the database and unlocks the file. Note that the
    /// application will crash on any request after this call
    /// </summary>
    [HttpGet("db/unlock")]
    public IActionResult UnlockDatabase()
    {
        userService.Dispose();
        return Ok("Database unlocked and disposed");
    }

    /// <summary>
    /// Locks the database file, enabling write operations.
    /// </summary>
    [HttpGet("db/lock")]
    public IActionResult LockDatabase()
    {
        userService.Enable();
        return Ok("Database locked");
    }

}
