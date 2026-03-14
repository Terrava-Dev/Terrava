namespace Terrava.Domain.Entities;

public class Agent
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string? Email { get; set; }

    public ICollection<Property>? Properties { get; set; }
}