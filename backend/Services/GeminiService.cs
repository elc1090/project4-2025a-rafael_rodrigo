﻿using System.Net.Http.Headers;
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
                using JsonDocument doc = JsonDocument.Parse(json);
                var candidates = doc.RootElement.GetProperty("candidates");
                var contentJ = candidates[0].GetProperty("content");
                var parts = contentJ.GetProperty("parts");
                var part = parts[0];
                string summary = part.GetProperty("text").GetString() ?? "null";
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