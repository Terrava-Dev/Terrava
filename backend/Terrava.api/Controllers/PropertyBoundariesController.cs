using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Terrava.Domain.Entities;
using Terrava.Infrastructure.Data;

namespace Terrava.API.Controllers;

[ApiController]
[Route("api/property-boundaries")]
public class PropertyBoundariesController : ControllerBase
{
    private readonly TerravaDbContext _context;

    public PropertyBoundariesController(TerravaDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> SaveBoundaries([FromBody] List<BoundaryPointRequest> points)
    {
        if (points == null || points.Count == 0)
            return BadRequest(new { message = "No boundary points provided." });

        var propertyId = points[0].PropertyId;

        var existing = await _context.PropertyBoundaryPoints
            .Where(b => b.PropertyId == propertyId)
            .ToListAsync();

        if (existing.Any())
            _context.PropertyBoundaryPoints.RemoveRange(existing);

        var newPoints = points.Select((p, index) => new PropertyBoundaryPoint
        {
            PropertyId = p.PropertyId,
            Latitude = (decimal)p.Latitude,
            Longitude = (decimal)p.Longitude,
        }).ToList();

        _context.PropertyBoundaryPoints.AddRange(newPoints);
        await _context.SaveChangesAsync();

        return Ok(newPoints);
    }

    [HttpGet("{propertyId:int}")]
    public async Task<IActionResult> GetBoundaries(int propertyId)
    {
        var points = await _context.PropertyBoundaryPoints
            .Where(b => b.PropertyId == propertyId)
            .AsNoTracking()
            .ToListAsync();
        return Ok(points);
    }

    [HttpDelete("{propertyId:int}")]
    public async Task<IActionResult> DeleteBoundaries(int propertyId)
    {
        var points = await _context.PropertyBoundaryPoints
            .Where(b => b.PropertyId == propertyId)
            .ToListAsync();
        if (points.Any())
        {
            _context.PropertyBoundaryPoints.RemoveRange(points);
            await _context.SaveChangesAsync();
        }
        return NoContent();
    }
}

public class BoundaryPointRequest
{
    public int PropertyId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int OrderIndex { get; set; }
}