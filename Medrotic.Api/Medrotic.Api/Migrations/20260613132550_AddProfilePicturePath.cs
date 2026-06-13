using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medrotic.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProfilePicturePath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfilePicturePath",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "ProfilePicturePath", "SecurityStamp" },
                values: new object[] { "fa962694-3f59-4409-a9e4-4c5cbaa4c90d", new DateTime(2026, 6, 13, 13, 25, 49, 822, DateTimeKind.Utc).AddTicks(4252), "AQAAAAIAAYagAAAAEOpmpMLQSL2KqIiFwQ89JAr181V6P8XenGfjH0jsKCSBZ5wUoDMw9HLccVEijxSTuw==", null, "58973790-722b-456b-abe8-23daf0ca2d25" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "ProfilePicturePath", "SecurityStamp" },
                values: new object[] { "759fd3e1-830b-4b8c-bde0-6ffcaa3f3446", new DateTime(2026, 6, 13, 13, 25, 49, 892, DateTimeKind.Utc).AddTicks(5622), "AQAAAAIAAYagAAAAECoqlzh2CFArxp6maV8hhokBRwldbK6vw66DFTsDML3NUgXB5+K1XMSDiyRJtZrNkQ==", null, "12b1e558-b397-4b5a-a8fa-e2a65b0f32e6" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "patient-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "ProfilePicturePath", "SecurityStamp" },
                values: new object[] { "b0bc0017-1ece-4a09-bd1b-a79c706b5b95", new DateTime(2026, 6, 13, 13, 25, 49, 963, DateTimeKind.Utc).AddTicks(5323), "AQAAAAIAAYagAAAAEFq8rvPXN/T65Jo4OVk8O03CiCUvLLeKVKgk6mgOeSAw0neQoB/bpdRiG6wLTf+RfQ==", null, "77a807c6-8e58-456b-8b8e-a945585334d1" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProfilePicturePath",
                table: "AspNetUsers");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "8c2997be-df23-44dc-b0c5-c4f8c8d9ac38", new DateTime(2026, 3, 28, 12, 58, 53, 953, DateTimeKind.Utc).AddTicks(5109), "AQAAAAIAAYagAAAAEO0vrZj3eJR6Gf7l4qJ6TDKxBV/cp/ToOlndQe7kvjwqpHp4Fd7Nqr7x0hfcgQ967A==", "e2b9b454-0659-4604-9a7f-f2697acf1881" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "1d283fc1-cfbc-47dc-b5d3-a6c5aa5bd181", new DateTime(2026, 3, 28, 12, 58, 54, 48, DateTimeKind.Utc).AddTicks(3821), "AQAAAAIAAYagAAAAEOsEKftZ++dT/E+lO8JY38nNG+GHG66/e8bpTZEPDAAqNiugau221yd9rgI3765kpw==", "bf973d4b-e21a-4a5c-8676-bae03390dbe8" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "patient-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "9265f5cd-724f-4a7e-8985-5ddda2ecffeb", new DateTime(2026, 3, 28, 12, 58, 54, 135, DateTimeKind.Utc).AddTicks(5619), "AQAAAAIAAYagAAAAEGwJDJFQVg7JaLdyGmYKF7ELTaE7PKy3mI774Tr1DX71fS49hFU2CQCRuYxoFzjMbw==", "fe7cbd03-f873-4975-9b20-ade8dcae8add" });
        }
    }
}
