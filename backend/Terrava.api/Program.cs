using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Terrava.API.Services;
using Terrava.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// ── Allow large image uploads (multiple files) ────────────────────────────
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 100_000_000; // 100 MB
});
builder.WebHost.ConfigureKestrel(k =>
{
    k.Limits.MaxRequestBodySize = 100_000_000;
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHttpClient("claude");
builder.Services.AddScoped<MarketingService>();

builder.Services.AddDbContext<TerravaDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// ── CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration["AllowedOrigins"]!
            .Split(",", StringSplitOptions.RemoveEmptyEntries);
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ── JWT Authentication ────────────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// ─────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Swagger (all environments) ────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI();

// ── CORS must be FIRST ────────────────────────────────────────────────────
app.UseCors("AllowFrontend");

// ── HTTPS redirect (production only) ─────────────────────────────────────
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// ── Uploads folder ────────────────────────────────────────────────────────
var uploadsPath = Path.Combine(
    builder.Environment.WebRootPath ??
    Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
    "uploads");
Directory.CreateDirectory(uploadsPath);

// ── Middleware pipeline ───────────────────────────────────────────────────
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();