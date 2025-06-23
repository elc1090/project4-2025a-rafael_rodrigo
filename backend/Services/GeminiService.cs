using System.Net.Http.Headers;
using System.Net.Mime;
using System.Text.Json;
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

            string sanitized = input.Trim().Replace("\n","\\n").Replace("\r","\\r").Replace("\"", "\\\"").Replace("\\","\\\\");

            StringContent content = new(
                        content: $$"""
                        {
                            "contents": [
                                {
                                    "parts": [
                                        {
                                            "text": "Resuma o seguinte texto de forma breve e objetiva:\n{{sanitized}}"
                                        }
                                    ]
                                }
                            ]
                        }
                        """,
                        mediaType: MediaTypeHeaderValue.Parse("application/json")
                    );

            logger.LogInformation("Tentando fazer request pra ai com {i} chaves", keys.Count);
            for (int i = 0; i < keys.Count; i++) {
                string key = keys[i];
                string url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}";
                HttpRequestMessage request = new(HttpMethod.Post, url)
                {
                    Content = content
                };
                var response = await httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    logger.LogError("StatusCode: {Code}; Reason: {Reason}; Content: {Content}", response.StatusCode, response.ReasonPhrase, await response.Content.ReadAsStringAsync());
                    continue;
                }
                else
                {
                    logger.LogInformation("Requisicao para Gemini feita com sucesso. Chave {i} utilizada", i);
                }
                using JsonDocument jsonDoc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                logger.LogInformation("Resposta da Gemini: {Response}", jsonDoc.RootElement.ToString());
                string summary = jsonDoc.RootElement.GetProperty("candidates")![0].GetProperty("parts")![0].GetProperty("text")!.GetString()!;
                return summary;
            }

            // se chegou aqui eh porque todas as chaves falharam
            logger.LogError("Nao foi possivel fazer requisicao para Gemini. Todas as chaves falharam.");
            return "Erro na requisicao para gemini API.";
        }
    }
}
