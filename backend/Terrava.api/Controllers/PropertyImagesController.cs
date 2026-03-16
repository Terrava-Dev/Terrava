using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Terrava.Domain.Entities;
using Terrava.Infrastructure.Data;

namespace Terrava.API.Controllers;

[ApiController]
[Route("api/property-images")]
public class PropertyImagesController : ControllerBase
{
    private readonly TerravaDbContext _context;
    private readonly string _uploadsPath;

    public PropertyImagesController(
        TerravaDbContext context,
        IWebHostEnvironment env)
    {
        _context = context;
        _uploadsPath = Path.Combine(
            env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
            "uploads");
        Directory.CreateDirectory(_uploadsPath);
    }

    // POST: api/property-images/upload/{propertyId}
    [HttpPost("upload/{propertyId:int}")]
    [RequestSizeLimit(100_000_000)]
    public async Task<IActionResult> Upload(
        int propertyId,
        [FromForm] IFormFileCollection files)   // ← IFormFileCollection instead of List<IFormFile>
    {
        // Debug: log what we received
        var debugInfo = new
        {
            PropertyId = propertyId,
            FilesCount = files?.Count ?? 0,
            FileNames = files?.Select(f => f.FileName).ToList(),
            FileSizes = files?.Select(f => f.Length).ToList(),
            FormKeys = Request.Form.Files.Select(f => f.Name).ToList(),
        };

        if (files == null || files.Count == 0)
            return BadRequest(new { message = "No files received.", debug = debugInfo });

        var property = await _context.Properties.FindAsync(propertyId);
        if (property == null)
            return NotFound(new { message = $"Property {propertyId} not found." });

        var savedImages = new List<PropertyImage>();
        var errors = new List<string>();

        foreach (var file in files)
        {
            if (file.Length == 0)
            {
                errors.Add($"{file.FileName}: empty file");
                continue;
            }

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext is not (".jpg" or ".jpeg" or ".png" or ".webp" or ".gif"))
            {
                errors.Add($"{file.FileName}: unsupported extension {ext}");
                continue;
            }

            try
            {
                var fileName = $"{propertyId}_{Guid.NewGuid()}{ext}";
                var filePath = Path.Combine(_uploadsPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
                {
                    await file.CopyToAsync(stream);
                }

                var image = new PropertyImage
                {
                    PropertyId = propertyId,
                    ImageUrl = $"/uploads/{fileName}"
                };
                _context.PropertyImages.Add(image);
                savedImages.Add(image);
            }
            catch (Exception ex)
            {
                errors.Add($"{file.FileName}: {ex.Message}");
            }
        }

        if (savedImages.Count == 0)
            return BadRequest(new { message = "No images saved.", errors, debug = debugInfo });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            saved = savedImages.Select(i => new { i.Id, i.PropertyId, i.ImageUrl }),
            errors,
            debug = debugInfo
        });
    }

    // GET: api/property-images/{propertyId}
    [HttpGet("{propertyId:int}")]
    public async Task<IActionResult> GetImages(int propertyId)
    {
        var images = await _context.PropertyImages
            .Where(i => i.PropertyId == propertyId)
            .AsNoTracking()
            .ToListAsync();
        return Ok(images);
    }

    // DELETE: api/property-images/{imageId}
    [HttpDelete("{imageId:int}")]
    public async Task<IActionResult> DeleteImage(int imageId)
    {
        var image = await _context.PropertyImages.FindAsync(imageId);
        if (image == null) return NotFound();

        var filePath = Path.Combine(_uploadsPath, Path.GetFileName(image.ImageUrl));
        if (System.IO.File.Exists(filePath))
            System.IO.File.Delete(filePath);

        _context.PropertyImages.Remove(image);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}