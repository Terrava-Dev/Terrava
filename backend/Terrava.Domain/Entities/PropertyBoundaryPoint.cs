namespace Terrava.Domain.Entities;

public class PropertyBoundaryPoint
{
    public int Id { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public int PropertyId { get; set; }

    public Property? Property { get; set; }
}