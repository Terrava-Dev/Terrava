// Services/MarketingService.cs
// Uses Claude API (Anthropic) to generate marketing content
// Install: no extra package needed — uses HttpClient

using System.Text;
using System.Text.Json;
using Terrava.API.DTOs;
using Terrava.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Terrava.API.Services;

public class MarketingService
{
    private readonly TerravaDbContext _db;
    private readonly IConfiguration _config;
    private readonly HttpClient _http;

    public MarketingService(TerravaDbContext db, IConfiguration config, IHttpClientFactory httpFactory)
    {
        _db = db;
        _config = config;
        _http = httpFactory.CreateClient("claude");
    }

    public async Task<MarketingResponseDto> GenerateAsync(MarketingRequestDto req)
    {
        // ── 1. Fetch property from DB ──────────────────────────────────────
        var property = await _db.Properties
            .FirstOrDefaultAsync(p => p.Id == req.PropertyId)
            ?? throw new Exception("Property not found");

        // ── 2. Build prompt ────────────────────────────────────────────────
        var platformList = string.Join(", ", req.Platforms);
        var themeContext = GetThemeContext(req.Theme);
        var toneGuide = GetToneGuide(req.Tone);


        var prompt = $@"
You are a real estate marketing expert in India. Generate marketing content for a property.

PROPERTY DETAILS:
- Title: {property.Title}
- Location: {property.LocationName}
- Type: {property.PropertyType}
- Area: {property.TotalAreaInSqFt:N0} sq ft
- Price per sq ft: ₹{property.PricePerSqFt:N0}
- Total price: ₹{property.TotalPrice:N0}
- Amenities: {property.Amenities}
- Notes: {property.Notes ?? "None"}

AGENT: {req.AgentName ?? "Agent"} | Contact: {req.AgentPhone ?? ""}

LANGUAGE: {req.Language}

LANGUAGE RULES:
- If language = en → Write fully in English
- If language = ta → Write in Tamil script
- If language = kn → Write in Kannada
- If language = te → Write in Telugu
- NEVER switch or mix languages

PLATFORMS: {platformList}
THEME/SEASON: {themeContext}
TONE: {toneGuide}
{(string.IsNullOrWhiteSpace(req.CustomNote) ? "" : $"SPECIAL INSTRUCTIONS: {req.CustomNote}")}

Generate a response in STRICT JSON format only.

IMPORTANT:
- Output MUST start with {{ and end with }}
- Do NOT add any explanation text

FORMAT:
{{
  ""content"": ""Marketing post text optimized for {platformList}. Include emojis, highlights, price, and CTA."",
  ""hashtags"": ""15-20 relevant hashtags starting with #"",
}}

ANTI-AI RULES:
- Do NOT sound like AI-generated content
- Make it feel like a real human typed it on phone

RULES:
- Keep content under 600 words
- Make it feel human-written
- Highlight price clearly
- Add seasonal touch if relevant
";

        // ── 3. Call OpenAI API ─────────────────────────────────────────────
        var apiKey = _config["Groq:ApiKey"]
            ?? throw new Exception("OpenAI API key not configured. Add OpenAi__ApiKey to your environment variables.");

        var requestBody = new
        {
            model = "llama-3.3-70b-versatile",
            messages = new[]
            {
        new { role = "user", content = prompt }
    },
            temperature = 0.7
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            )
        };

        request.Headers.Add("Authorization", $"Bearer {apiKey}");

        var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception($"OpenAI API error: {body}");


        // ── 4. Parse response ──────────────────────────────────────────────
        var json = JsonSerializer.Deserialize<JsonElement>(body);

        // Extract assistant text
        var text = json
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "";

        // Clean JSON if wrapped in markdown
        text = text.Trim();
        if (text.StartsWith("```")) text = text.Split('\n', 2)[1];
        if (text.EndsWith("```")) text = text[..text.LastIndexOf("```")];
        text = text.Trim();

        // Parse structured JSON from model output
        var parsed = JsonSerializer.Deserialize<JsonElement>(text);

        return new MarketingResponseDto
        {
            Content = parsed.GetProperty("content").GetString() ?? "",
            Hashtags = parsed.GetProperty("hashtags").GetString() ?? "",
       
        };
    }

    // ── Theme context helper ───────────────────────────────────────────────
    private static string GetThemeContext(string theme) => theme switch
    {
        "diwali" => "Diwali festival season — include festive greetings, light/prosperity metaphors, mention special Diwali pricing if relevant",
        "christmas" => "Christmas holiday season — include festive greetings, gift/new beginning metaphors",
        "pongal" => "Pongal harvest festival — include Tamil festive greetings (Pongal Vazthukal), new beginnings theme",
        "newyear" => "New Year — new beginnings, fresh start, resolution to buy a home theme",
        "summer" => "Summer season — highlight cooling amenities like pool, lake view, air conditioning",
        "monsoon" => "Monsoon season — cozy home, shelter, enjoy rains from your balcony theme",
        "custom" => "Custom theme as specified in special instructions",
        _ => "Standard — professional real estate marketing, no seasonal theme needed",
    };

    // ── Tone guide helper ──────────────────────────────────────────────────
    private static string GetToneGuide(string tone) => tone switch
    {
        "Friendly" => "Warm, conversational, use 'you', feel like a friend recommending a home",
        "Urgent" => "Create urgency — limited availability, prices rising, act now messaging",
        "Luxury" => "Premium, sophisticated language — understated elegance, exclusive, curated",
        "Tamil" => "Write entirely in Tamil script — warm and local tone for Tamil-speaking buyers",
        _ => "Professional — clear, factual, trustworthy real estate agent voice",
    };
}