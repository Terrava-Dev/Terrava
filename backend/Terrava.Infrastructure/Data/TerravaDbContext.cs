using Microsoft.EntityFrameworkCore;
using Terrava.Domain.Entities;

namespace Terrava.Infrastructure.Data;

public class TerravaDbContext : DbContext
{
    public TerravaDbContext(DbContextOptions<TerravaDbContext> options)
        : base(options)
    {
    }

    public DbSet<Property> Properties { get; set; }
    public DbSet<Agent> Agents { get; set; }
    public DbSet<PropertyImage> PropertyImages { get; set; }
    public DbSet<PropertyBoundaryPoint> PropertyBoundaryPoints { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Property>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Title)
                  .IsRequired()
                  .HasMaxLength(200);

            entity.Property(p => p.LocationName)
                  .HasMaxLength(200);

            entity.Property(p => p.TotalAreaInAcres)
                  .HasColumnType("decimal(18,2)");

            entity.Property(p => p.PricePerAcre)
                  .HasColumnType("decimal(18,2)");

            entity.HasOne(p => p.Agent)
                  .WithMany(a => a.Properties)
                  .HasForeignKey(p => p.AgentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}