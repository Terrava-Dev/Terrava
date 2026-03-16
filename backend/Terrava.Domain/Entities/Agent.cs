namespace Terrava.Domain.Entities;

//public class Agent
//{
//    public int Id { get; set; }

//    public string Name { get; set; } = string.Empty;

//    public string PhoneNumber { get; set; } = string.Empty;

//    public string? Email { get; set; }

//    public ICollection<Property>? Properties { get; set; }
//}

public class Agent
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property — required by TerravaDbContext relationship
    public List<Property> Properties { get; set; } = new();
}