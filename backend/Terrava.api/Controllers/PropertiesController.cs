using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Terrava.Domain.Entities;
using Terrava.Infrastructure.Data;

namespace Terrava.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly TerravaDbContext _context;

    public PropertiesController(TerravaDbContext context)
    {
        _context = context;
    }

    private static object ProjectProperty(Property p) => new
    {
        p.Id,
        p.Title,
        p.LocationName,
        p.TotalAreaInSqFt,
        p.PricePerAcre,
        p.PricePerSqFt,
        TotalPrice = p.TotalAreaInSqFt * p.PricePerSqFt,
        p.Amenities,
        p.PropertyType,
        p.Status,
        p.Notes,
        p.AgentId,
        // ── Legal Approvals ──────────────────────────
        p.DtcpApproved,
        p.ReraApproved,
        p.ReraNumber,
        Images = p.Images?
            .Select(i => new { i.Id, i.ImageUrl, i.PropertyId }).ToList(),
        BoundaryPoints = p.BoundaryPoints?
            .Select(b => new { b.Id, b.Latitude, b.Longitude, b.PropertyId }).ToList(),
    };

    [HttpPost]
    public async Task<IActionResult> CreateProperty([FromBody] Property property)
    {
        if (property == null) return BadRequest("Property data is required.");
        _context.Properties.Add(property);
        await _context.SaveChangesAsync();
        var created = await _context.Properties
            .Include(p => p.Images).Include(p => p.BoundaryPoints)
            .FirstAsync(p => p.Id == property.Id);
        return CreatedAtAction(nameof(GetPropertyById), new { id = created.Id }, ProjectProperty(created));
    }

    [HttpGet]
    public async Task<IActionResult> GetAllProperties([FromQuery] int? agentId)
    {
        var query = _context.Properties
            .Include(p => p.Images).Include(p => p.BoundaryPoints).AsNoTracking();
        if (agentId.HasValue) query = query.Where(p => p.AgentId == agentId.Value);
        var list = await query.ToListAsync();
        return Ok(list.Select(ProjectProperty));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPropertyById(int id)
    {
        var property = await _context.Properties
            .Include(p => p.Images).Include(p => p.BoundaryPoints)
            .AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (property == null) return NotFound($"Property with ID {id} not found.");
        return Ok(ProjectProperty(property));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProperty(int id, [FromBody] Property updatedProperty)
    {
        if (id != updatedProperty.Id) return BadRequest("ID mismatch.");
        var existing = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id);
        if (existing == null) return NotFound($"Property with ID {id} not found.");

        existing.Title = updatedProperty.Title;
        existing.LocationName = updatedProperty.LocationName;
        existing.TotalAreaInSqFt = updatedProperty.TotalAreaInSqFt;
        existing.PricePerAcre = updatedProperty.PricePerAcre;
        existing.PricePerSqFt = updatedProperty.PricePerSqFt;
        existing.Amenities = updatedProperty.Amenities;
        existing.PropertyType = updatedProperty.PropertyType;
        existing.Status = updatedProperty.Status;
        existing.Notes = updatedProperty.Notes;
        existing.AgentId = updatedProperty.AgentId;
        // ── Legal Approvals ──────────────────────────
        existing.DtcpApproved = updatedProperty.DtcpApproved;
        existing.ReraApproved = updatedProperty.ReraApproved;
        existing.ReraNumber = updatedProperty.ReraNumber;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PATCH: api/properties/{id}/status
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateRequest req)
    {
        var existing = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id);
        if (existing == null) return NotFound();
        existing.Status = req.Status;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProperty(int id)
    {
        var property = await _context.Properties.FindAsync(id);
        if (property == null) return NotFound($"Property with ID {id} not found.");
        _context.Properties.Remove(property);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public class StatusUpdateRequest
{
    public string? Status { get; set; }
}