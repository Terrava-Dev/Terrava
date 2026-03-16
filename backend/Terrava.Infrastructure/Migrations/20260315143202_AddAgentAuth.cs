using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Terrava.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "Agents");

            migrationBuilder.RenameColumn(
                name: "PhoneNumber",
                table: "Agents",
                newName: "Username");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Agents",
                newName: "Phone");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Agents",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "FullName",
                table: "Agents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "Agents",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "FullName",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Agents");

            migrationBuilder.RenameColumn(
                name: "Username",
                table: "Agents",
                newName: "PhoneNumber");

            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "Agents",
                newName: "Name");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Agents",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
