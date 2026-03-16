using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Terrava.API.DTOs;
using Terrava.Domain.Entities;
using Terrava.Infrastructure.Data;

namespace Terrava.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly TerravaDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(TerravaDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    // POST: api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (await _context.Agents.AnyAsync(a => a.Username == req.Username.Trim().ToLower()))
            return BadRequest(new { message = "Username already taken." });

        var agent = new Agent
        {
            Username = req.Username.Trim().ToLower(),
            PasswordHash = HashPassword(req.Password),
            FullName = req.FullName.Trim(),
            Phone = req.Phone.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Agents.Add(agent);
        await _context.SaveChangesAsync();

        return Ok(new AuthResponse
        {
            AgentId = agent.Id,
            Username = agent.Username,
            FullName = agent.FullName,
            Token = GenerateToken(agent)
        });
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var agent = await _context.Agents
            .FirstOrDefaultAsync(a => a.Username == req.Username.Trim().ToLower());

        if (agent == null || !VerifyPassword(req.Password, agent.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password." });

        return Ok(new AuthResponse
        {
            AgentId = agent.Id,
            Username = agent.Username,
            FullName = agent.FullName,
            Token = GenerateToken(agent)
        });
    }

    // ── Helpers ──────────────────────────────────────
    private static string HashPassword(string password)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password + "terrava_salt_2024"));
        return Convert.ToBase64String(bytes);
    }

    private static bool VerifyPassword(string password, string hash)
        => HashPassword(password) == hash;

    private string GenerateToken(Agent agent)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddDays(30);

        var claims = new[]
        {
            new Claim("agentId",  agent.Id.ToString()),
            new Claim("username", agent.Username),
            new Claim("fullName", agent.FullName),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}