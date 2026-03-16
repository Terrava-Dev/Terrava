using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Terrava.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Properties",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Properties");
        }
    }
}
