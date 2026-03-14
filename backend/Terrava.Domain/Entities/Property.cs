
using System.ComponentModel.DataAnnotations.Schema;

namespace Terrava.Domain.Entities;

public class Property
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? LocationName { get; set; }

    public decimal TotalAreaInAcres { get; set; }

    //public decimal TotalPrice { get; set; }   // ✅ Add this

    public decimal PricePerAcre { get; set; }

    public int AgentId { get; set; }

    public Agent? Agent { get; set; }

    public ICollection<PropertyImage>? Images { get; set; }

    public ICollection<PropertyBoundaryPoint>? BoundaryPoints { get; set; }

    [NotMapped]
    public decimal TotalPrice => TotalAreaInAcres * PricePerAcre;
}