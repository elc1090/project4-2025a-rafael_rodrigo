using System.Text.Json.Serialization;

namespace backend.Models;

public class LatexCompilationRequest {

    [JsonPropertyName("latex")]
    public string Latex { get; set; } = "";

    [JsonPropertyName("outputName")]
    public string? OutputName { get; set; } = null;

    [JsonPropertyName("snippet")]
    public bool Snippet { get; set; } = false;

    [JsonPropertyName("debug")]
    public bool Debug { get; set; } = false;
}
