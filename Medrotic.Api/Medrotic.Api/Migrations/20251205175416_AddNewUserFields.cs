using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medrotic.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNewUserFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "DateOfBirth", "Gender", "PasswordHash", "PhoneNumber", "SecurityStamp" },
                values: new object[] { "32ff114c-6732-48fc-adf7-44e7bc74c5fb", new DateTime(1980, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Male", "AQAAAAIAAYagAAAAEI14nWGchrOxibURbhhZOEA0KXNC9XlFUf2vyOsVjusPlNwTgZCIR5BDtzg3ZPA2FQ==", "03001234567", "ac4d7e69-dd0f-40b7-9ac4-ae886ac32f63" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "DateOfBirth", "Gender", "PasswordHash", "PhoneNumber", "SecurityStamp" },
                values: new object[] { "d45c882d-541d-4659-86f8-db0242853ac2", new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Male", "AQAAAAIAAYagAAAAEJf6Gk2qAgtDYWvc0IJjVqQteWL4svfbyvd3tdMnyFYoWQV2hYpf8hmm9SmkZQXzVw==", "03007654321", "211d46d3-2387-4993-8f69-c8fa69606cd4" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "AspNetUsers");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "PhoneNumber", "SecurityStamp" },
                values: new object[] { "a8acf0fc-b5da-4eee-a6e8-b8390adb7532", "AQAAAAIAAYagAAAAEKreJkwRnIEwdALY0FWd4wT8REYpf1KNVS2l9fNUk+M3d897AF5Himq4GKEGhD3zug==", null, "5ea60784-bcd4-4c86-b24b-50e429f3427e" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "PhoneNumber", "SecurityStamp" },
                values: new object[] { "870e9149-c91b-48ed-a105-9d8152c0a5f5", "AQAAAAIAAYagAAAAEPLt5Jrqn0tvjbnufvh2G8Nz5JBESdCi0v0qt75nUmPldl3R24PEfN9wBT/K2fMi0w==", null, "5466dc61-4644-4589-b1cf-e4d52e490fe7" });
        }
    }
}
