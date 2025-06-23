using backend.Filters;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase {

    private readonly UserService db;

    public UserController(UserService db)
    {
        this.db = db;
    }

    /// <summary>
    /// Loga um usuario ou cria se ele nao existe.
    /// </summary>
    /// <param name="username">O nome de usuario</param>
    /// <param name="password">A senha do usuario</param>
    /// <returns>Retorna para o usuario o token de autenticacao</returns>
    [HttpGet("login")]
    public IActionResult Login(string username, string password) {
        var user = db.GetUser(db.GetUserId(username) ?? Guid.Empty);
        if(user is null) {
            // criar usuario
            User u = new() {
                AuthToken = UserService.GenerateAuthToken(),
                Id = Guid.NewGuid(),
                Password = password,
                Name = username,
            };

            db.AddUser(u);

            return Ok(new LoginResult() {
                AuthToken = u.AuthToken,
                NewAccount = true,
                Name = u.Name
            });
        }

        // usuario existe, logar
        if (user.Password != password) {
            // usuario errou a senha
            return Unauthorized("Senha incorreta");
        }

        // gerar token se necessario
        string? token = db.GetUserToken(user.Id);
        if(token is null) {
            token = UserService.GenerateAuthToken();
            db.SetUserToken(user.Id, token);
        }

        // retornar token
        return Ok(new LoginResult() {
            AuthToken = token,
            NewAccount = false,
            Name = user.Name
        });                
    }

    /// <summary>
    /// Troca a senha de um usuario logado
    /// </summary>
    /// <returns></returns>
    [Authenticated]
    [HttpPost("changepassword")]
    public IActionResult ChangePassword([FromBody]string newpassword) {
        Guid userId = HttpContext.GetLoggedUser();

        db.SetUserPassword(userId, newpassword);
        return Ok("Senha alterada com sucesso");
    }

    /// <summary>
    /// Retorna o Id unico de um usuario
    /// </summary>
    /// <param name="username">O nome do usuario</param>
    /// <returns></returns>
    [HttpGet("id")]
    public IActionResult GetUserId(string username) {

        var id = db.GetUserId(username);

        if(id is null) {
            return NotFound();
        }

        return Ok(new {
            id
        });
    }

    /// <summary>
    /// Retorna informacoes sobre o usuario que esta atualmente logado
    /// </summary>
    /// <returns>Informacoes do usuario</returns>
    [Authenticated]
    [HttpGet("me")]
    public IActionResult GetCurrentUser() {
        Guid userId = HttpContext.GetLoggedUser();

        var user = db.GetUser(userId);
        if(user == null) {
            return NotFound();
        }

        return Ok(user);
    }

    /// <summary>
    /// Retorna informacoes sobre um usuario especifico dado o seu Id.
    /// </summary>
    /// <param name="userId"></param>
    /// <returns></returns>
    [HttpGet("{userId:guid}")]
    public IActionResult GetUser(Guid userId) {
        var user = db.GetUser(userId);
        if (user is null) {
            return NotFound("Usuario nao encontrado");
        }
        return Ok(new {
            user.Id,
            user.UserType,
            AvatarUrl = user.GithubAvatarUrl,
            user.Name,
        });
    }
}