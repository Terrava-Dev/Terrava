using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Terrava.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPricePerSqFt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PricePerSqFt",
                table: "Properties",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PricePerSqFt",
                table: "Properties");
        }
    }
}
