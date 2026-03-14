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

    // ================================
    // 🔹 CREATE
    // POST: api/properties
    // ================================
    [HttpPost]
    public async Task<ActionResult<Property>> CreateProperty(Property property)
    {
        if (property == null)
            return BadRequest("Property data is required.");

        // Calculate PricePerAcre safely
        if (property.TotalAreaInAcres > 0)
        {
            property.PricePerAcre =
                property.TotalPrice / property.TotalAreaInAcres;
        }

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetPropertyById),
            new { id = property.Id },
            property);
    }

    // ================================
    // 🔹 READ ALL
    // GET: api/properties
    // ================================
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Property>>> GetAllProperties()
    {
        var properties = await _context.Properties
            .Include(p => p.Images)
            .Include(p => p.BoundaryPoints)
            .AsNoTracking()
            .ToListAsync();

        return Ok(properties);
    }

    // ================================
    // 🔹 READ BY ID
    // GET: api/properties/{id}
    // ================================
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Property>> GetPropertyById(int id)
    {
        var property = await _context.Properties
            .Include(p => p.Images)
            .Include(p => p.BoundaryPoints)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property == null)
            return NotFound($"Property with ID {id} not found.");

        return Ok(property);
    }

    // ================================
    // 🔹 UPDATE
    // PUT: api/properties/{id}
    // ================================
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProperty(int id, Property updatedProperty)
    {
        if (id != updatedProperty.Id)
            return BadRequest("ID mismatch.");

        var existingProperty = await _context.Properties
            .FirstOrDefaultAsync(p => p.Id == id);

        if (existingProperty == null)
            return NotFound($"Property with ID {id} not found.");


        existingProperty.Title = updatedProperty.Title;
        existingProperty.LocationName = updatedProperty.LocationName;
        existingProperty.TotalAreaInAcres = updatedProperty.TotalAreaInAcres;
        existingProperty.AgentId = updatedProperty.AgentId;

        // Recalculate PricePerAcre
        if (existingProperty.TotalAreaInAcres > 0)
        {
            existingProperty.PricePerAcre =
                existingProperty.TotalPrice /
                existingProperty.TotalAreaInAcres;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ================================
    // 🔹 DELETE
    // DELETE: api/properties/{id}
    // ================================
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProperty(int id)
    {
        var property = await _context.Properties.FindAsync(id);

        if (property == null)
            return NotFound($"Property with ID {id} not found.");

        _context.Properties.Remove(property);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}