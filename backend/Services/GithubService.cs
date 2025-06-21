using backend.Models;
using System.Net.Http.Headers;

namespace backend.Services;

/// <summary>
/// Servico para interagir com a API do GitHub e permitir
/// o login por OAuth.
/// </summary>
public class GithubService
{
    private HttpClient httpClient;
    private ILogger<GithubService> logger;

    public GithubService(HttpClient httpClient, ILogger<GithubService> logger)
    {
        this.httpClient = httpClient;
        this.logger = logger;
    }

    private List<string> openLoginStates = new();

    public void PushLoginState(string state)
    {
        if (string.IsNullOrEmpty(state))
        {
            logger.LogWarning("Attempted to push an empty or null state.");
            return;
        }
        openLoginStates.Add(state);
        logger.LogInformation("Pushed new login state: {State}", state);
    }

    public bool PopLoginState(string state)
    {
        if (string.IsNullOrEmpty(state))
        {
            logger.LogWarning("Attempted to pop an empty or null state.");
            return false;
        }
        bool removed = openLoginStates.Remove(state);
        if (removed)
        {
            logger.LogInformation("Successfully popped login state: {State}", state);
        }
        else
        {
            logger.LogWarning("Failed to pop login state: {State} - not found", state);
        }
        return removed;
    }

    public async Task<string?> GetAvatarUrlAsync(User user)
    {
        if(user.UserType != UserType.GitHub)
        {
            logger.LogWarning("Tried to get avatar URL for non-GitHub user: {UserId}", user.Id);
            return null;
        }

        string url = $"https://api.github.com/users/{user.GithubLogin}";
        httpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", user.GithubAccessToken);
        HttpResponseMessage response = await httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogError("Failed to get GitHub user info: {StatusCode}", response.StatusCode);
            return null;
        }

        var userInfo = await response.Content.ReadFromJsonAsync<GithubUserInfo>();
        if (userInfo == null)
        {
            logger.LogError("Failed to deserialize GitHub user info.");
            return null;
        }
        logger.LogInformation("Successfully retrieved GitHub avatar URL for user: {UserId}", user.Id);
        return userInfo.AvatarUrl;
    }

    public async Task<(string login, string name)> GetNamesAsync(string authToken)
    {
        if(string.IsNullOrEmpty(authToken))
        {
            logger.LogWarning("Auth token is null or empty.");
            return (string.Empty, string.Empty);
        }

        string url = "https://api.github.com/user";
        httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", authToken);
        HttpResponseMessage response = await httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogError("Failed to get GitHub user info: {StatusCode}", response.StatusCode);
            return (string.Empty, string.Empty);
        }

        var userInfo = await response.Content.ReadFromJsonAsync<GithubUserInfo>();
        if (userInfo == null)
        {
            logger.LogError("Failed to deserialize GitHub user info.");
            return (string.Empty, string.Empty);
        }

        logger.LogInformation("Successfully retrieved GitHub user info: {Login}, {Name}", userInfo.Login, userInfo.Name);
        return (userInfo.Login, userInfo.Name);
    }

    private class GithubUserInfo
    {
        public string AvatarUrl { get; set; }
        public string Login { get; set; }
        public string Name { get; set; }
        public string ReposUrl { get; set; }
    }
}