// Controllers/MarketingController.cs
using Microsoft.AspNetCore.Mvc;
using Terrava.API.DTOs;
using Terrava.API.Services;

namespace Terrava.API.Controllers;

[ApiController]
[Route("api/marketing")]
public class MarketingController : ControllerBase
{
    private readonly MarketingService _marketing;

    public MarketingController(MarketingService marketing)
    {
        _marketing = marketing;
    }

    // POST /api/marketing/generate
    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] MarketingRequestDto req)
    {
        try
        {
            var result = await _marketing.GenerateAsync(req);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}