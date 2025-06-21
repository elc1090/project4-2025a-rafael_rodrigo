using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class GithubController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly GithubService _githubService;
    private readonly UserService _userService;
    private readonly ILogger<GithubController> _logger;

    public GithubController(HttpClient httpClient, IConfiguration configuration, GithubService githubService, UserService userService, ILogger<GithubController> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _githubService = githubService;
        _userService = userService;
        _logger = logger;
    }

    [HttpGet("login")]
    public IActionResult Login()
    {
        /*
         * GET https://github.com/login/oauth/authorize
         * client_id: The client ID you received from GitHub when you registered.
         * state: An unguessable random string. It is used to protect against cross-site request forgery attacks.
         * source: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
         */

        string state = Guid.NewGuid().ToString("N");
        string githubRedirect = $"https://github.com/login/oauth/authorize?client_id={_configuration["GitHub:clientId"]!}&" +
                                $"state={state}";
        _githubService.PushLoginState(state);
        Console.WriteLine("GithubLogin called and opened state: " + state);
        return Redirect(githubRedirect);
    }

    [HttpGet("login/callback")]
    public async Task<IActionResult> LoginCallback(string code, string state)
    {
        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
        {
            return BadRequest("Code and state parameters are required.");
        }
        if (!_githubService.PopLoginState(state))
        {
            return BadRequest("Invalid or expired state parameter.");
        }

        string accessTokenUrl = $"https://github.com/login/oauth/access_token?" +
                                $"client_id={_configuration["GitHub:clientId"]!}&" +
                                $"client_secret={_configuration["GitHub:clientSecret"]!}&" +
                                $"code={code}";
        // create httpcontent
        var content = new StringContent(string.Empty);
        content.Headers.Add("Accept", "application/json");
        HttpResponseMessage response = await _httpClient.PostAsync(accessTokenUrl, content);
        /*
         * response is like:
         * {
         *     "access_token":"gho_16C7e42F292c6912E7710c838347Ae178B4a",
         *     "scope":"repo,gist",
         *     "token_type":"bearer"
         *  }
         */
        using JsonDocument jsonDoc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        string accessToken = jsonDoc.RootElement.GetProperty("access_token").GetString() ?? "null";
        if (accessToken == "null")
        {
            return BadRequest("Failed to retrieve access token from GitHub.");
        }
        var (login, name) = await _githubService.GetNamesAsync(accessToken);

        var col = _userService.Database.GetCollection<User>();
        User? user = col.FindOne(x => x.UserType == UserType.GitHub && x.GithubLogin == login);

        string authToken;
        if(user is null)
        {
            // usuario nao existe, criar um
            User u = new()
            {
                Id = Guid.NewGuid(),
                AuthToken = UserService.GenerateAuthToken(),
                UserType = UserType.GitHub,
                GithubAccessToken = accessToken,
                GithubLogin = login,
                Name = name,
                GithubName = name,
                Password = "githubUser"
            };
            u.GithubAvatarUrl = await _githubService.GetAvatarUrlAsync(u) ?? string.Empty;
            _logger.LogInformation("Creating new GitHub user: {Login}", login);
            col.Insert(u);
            authToken = u.AuthToken;
        }
        else
        {
            // retornar usuario existente
            authToken = user.AuthToken;
            _logger.LogInformation("Returning existing GitHub user: {Login}", login);
        }
        return Redirect($"http://web-t3.rodrigoappelt.com:8080/?token={authToken}");
    }
}
