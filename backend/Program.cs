using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

ConfigureServices(builder.Services);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();

app.UseCors();

app.MapControllers();

app.Run();

static void ConfigureServices(IServiceCollection services)
{
    services.AddSingleton<UserService>();
    services.AddSingleton<DocumentService>();
    HttpClient http = new();
    http.DefaultRequestHeaders.UserAgent.Add(new System.Net.Http.Headers.ProductInfoHeaderValue("TexTogether", "1.0"));
    services.AddSingleton(http);
    services.AddSingleton<GithubService>();
    services.AddSingleton<LinkService>();
    services.AddSingleton<RendererService>();
    services.AddSingleton<GeminiService>();
}
