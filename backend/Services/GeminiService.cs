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
            
            using StringContent content = new(
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
                using HttpRequestMessage request = new(HttpMethod.Post, url)
                {
                    Content = content
                };
                using var response = await httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    logger.LogError("StatusCode: {Code}; Reason: {Reason}; Content: {Content}", response.StatusCode, response.ReasonPhrase, await response.Content.ReadAsStringAsync());
                    continue;
                }
                else
                {
                    logger.LogInformation("Requisicao para Gemini feita com sucesso. Chave {i} utilizada", i);
                }
                logger.LogInformation("Lendo content");
                string json = await response.Content.ReadAsStringAsync();
                logger.LogInformation("Content json: " + json);
                logger.LogInformation("Deserializando");
                GeminiResponse? geminiResponse = JsonSerializer.Deserialize<GeminiResponse>(json);
                logger.LogInformation("deserializado" + (geminiResponse is null ? "null" : "notnull"));
                if(geminiResponse is null)
                {
                    logger.LogError("GeminiResponse is null. Nao foi possivel deserializar a resposta do Gemini.");
                    return "Erro na requisicao para gemini API.";
                }
                if (geminiResponse.Candidates is null || geminiResponse.Candidates.Count == 0)
                {
                    logger.LogError("GeminiResponse.Candidates is null or empty. Nao foi possivel obter resposta do Gemini.");
                    return "Erro na requisicao para gemini API.";
                }
                if (geminiResponse.Candidates[0].Content is null)
                {
                    logger.LogError("GeminiResponse.Candidates[0].Content Nao foi possivel obter resposta do Gemini.");
                    return "Erro na requisicao para gemini API.";
                }
                if (geminiResponse.Candidates[0].Content.Parts is null || geminiResponse.Candidates[0].Content.Parts.Count == 0)
                {
                    logger.LogError("GeminiResponse.Candidates[0].Content.Parts is null or empty. Nao foi possivel obter resposta do Gemini.");
                    return "Erro na requisicao para gemini API.";
                }
                string summary = geminiResponse.Candidates[0].Content.Parts[0].Text;
                logger.LogInformation("Resposta do Gemini: {Response}", summary);
                return summary;
            }

            // se chegou aqui eh porque todas as chaves falharam
            logger.LogError("Nao foi possivel fazer requisicao para Gemini. Todas as chaves falharam.");
            return "Erro na requisicao para gemini API.";
        }
    }
}

public class GeminiResponse
{
    public List<Candidate> Candidates { get; set; }
}

public class Candidate
{
    public Content Content { get; set; }
}

public class Content
{
    public List<Part> Parts { get; set; }
}

public class Part
{
    public string Text { get; set; }
}