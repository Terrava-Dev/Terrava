// DTOs/MarketingDtos.cs
namespace Terrava.API.DTOs;

public class MarketingRequestDto
{
    public int PropertyId { get; set; }
    public string Theme { get; set; } = "standard";
    public List<string> Platforms { get; set; } = new();
    public string Tone { get; set; } = "Professional";
    public string? CustomNote { get; set; }
    public string? AgentName { get; set; }
    public string? AgentPhone { get; set; }

    public string Language { get; set; } = "en";
}

public class MarketingResponseDto
{
    public string Content { get; set; } = "";
    public string Hashtags { get; set; } = "";
    //public string VisualSpec { get; set; } = "";
}