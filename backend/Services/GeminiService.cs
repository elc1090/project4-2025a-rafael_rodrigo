using System.Net.Http.Headers;
using System.Net.Mime;
using System.Transactions;
using static System.Net.WebRequestMethods;

namespace backend.Services
{
    public class GeminiService
    {
        private readonly IConfiguration configuration;
        private readonly ILogger<GeminiService> logger;
        private readonly HttpClient httpClient;

        public GeminiService(ILogger<GeminiService> logger, IConfiguration configuration, HttpClient http)
        {
            this.configuration = configuration;
            this.logger = logger;
            this.httpClient = http;
        }

        public async Task<string> SummarizeAsync(string input)
        {
            List<string>? keys = configuration.GetSection("GeminiKeys").Get<List<string>>();
            if(keys is null || keys.Count == 0)
            {
                logger.LogError("Nao foi possivel fazer requisicao para Gemini. Nao foram encontradas chaves");
                return "Erro na requisicao para gemini API.";
            }

            for (int i = 0; i < keys.Count; i++) {
                string key = keys[i];
                string url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}";
                HttpRequestMessage request = new(HttpMethod.Post, url)
                {
                    Content = new StringContent(
                        content: $$"""
                        {
                            "contents": [
                                {
                                    "parts": [
                                        {
                                            "text": "Resuma o seguinte texto de forma breve e objetiva:\n{{input.Replace("\"", "\\\"").Replace("\n", "\\n")}}"
                                        }
                                    ]
                                }
                            ]
                        }
                        """,
                        mediaType: MediaTypeHeaderValue.Parse("application/json")
                    )
                };
                var response = await httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    continue;
                }
                var responseContent = await response.Content.ReadAsStringAsync();
                return responseContent;
            }

            // se chegou aqui eh porque todas as chaves falharam
            logger.LogError("Nao foi possivel fazer requisicao para Gemini. Todas as chaves falharam.");
            return "Erro na requisicao para gemini API.";
        }
    }
}
