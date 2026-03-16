using System.ComponentModel.DataAnnotations.Schema;

namespace Terrava.Domain.Entities;

public class Property
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? LocationName { get; set; }
    public decimal TotalAreaInSqFt { get; set; }
    public decimal PricePerAcre { get; set; }
    public decimal PricePerSqFt { get; set; }
    public string? Amenities { get; set; }
    public string? PropertyType { get; set; }

    // e.g. "available" | "sold" | "enquired" | "hold" | "negotiating" | "rented"
    public string? Status { get; set; }
    public string? Notes { get; set; }

    public int AgentId { get; set; }
    public Agent? Agent { get; set; }
    public ICollection<PropertyImage>? Images { get; set; }
    public ICollection<PropertyBoundaryPoint>? BoundaryPoints { get; set; }

    [NotMapped]
    public decimal TotalPrice => TotalAreaInSqFt * PricePerSqFt;
}