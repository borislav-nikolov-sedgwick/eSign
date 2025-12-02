using ESign.Api.Data;
using ESign.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Configure CORS for development
builder.Services.AddCors(options =>
{
    options.AddPolicy("Development", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register services
builder.Services.AddSingleton<MockDataStore>();
builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddScoped<IVerificationService, VerificationService>();
builder.Services.AddScoped<IPdfService, PdfService>();

var app = builder.Build();

// Seed demo data
using (var scope = app.Services.CreateScope())
{
    var dataStore = scope.ServiceProvider.GetRequiredService<MockDataStore>();
    SeedData.Initialize(dataStore);
}

app.UseCors("Development");
app.UseAuthorization();
app.MapControllers();

Console.WriteLine("eSign API running at http://localhost:5000");
app.Run();
