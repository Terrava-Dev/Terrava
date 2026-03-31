using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Terrava.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDtcpRera : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "DtcpApproved",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ReraApproved",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReraNumber",
                table: "Properties",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DtcpApproved",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ReraApproved",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ReraNumber",
                table: "Properties");
        }
    }
}
