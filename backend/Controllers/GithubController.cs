using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class GithubController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public GithubController(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    private List<string> openStates = [];

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
        openStates.Add(state);
        return Redirect(githubRedirect);
    }

    [HttpGet("login/callback")]
    public async Task<IActionResult> LoginCallback(string code, string state)
    {
        if (!openStates.Remove(state))
        {
            return BadRequest("Invalid state parameter.");
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
        return Redirect("http://web-t3.rodrigoappelt.com:8080/");
    }
}
