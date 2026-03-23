using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medrotic.Api.Migrations
{
    /// <inheritdoc />
    public partial class PatientPortalUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "a2ef9297-a755-4000-9d04-e92e21fc285c", new DateTime(2026, 3, 3, 16, 19, 11, 772, DateTimeKind.Utc).AddTicks(1400), "AQAAAAIAAYagAAAAEJviTfLaraSuZgevqakVmLl9Bpm6dVTi8uxC+mK1cVc9q16g/W8jKr35BuRPnbAhcQ==", "2743e6f9-14f1-47f2-bfed-eedb7601cf4d" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "145b00bb-5fa1-42ac-9d98-c3dc2b9007f5", new DateTime(2026, 3, 3, 16, 19, 11, 898, DateTimeKind.Utc).AddTicks(4372), "AQAAAAIAAYagAAAAEO3Q6KsovlUvOeKkEtNPuG1HxIrod7Tllmr/N655uNZH+tLQe3JMS1/WN+cS1ngIYA==", "4f5c5918-8886-4b97-979b-86021a5285a5" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "patient-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "36d764bc-b233-42f2-9354-2c1e74bda8b7", new DateTime(2026, 3, 3, 16, 19, 12, 33, DateTimeKind.Utc).AddTicks(2923), "AQAAAAIAAYagAAAAEDTr8uwE+3H8LQSFoIdde8iF79Q2xMYS+iCgyCbE7pMgQUCX2kmiVVDTRW63MgtlpQ==", "20cabf5f-8c3a-4977-bea5-b7082198a904" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "bb26d643-1a85-4761-95c2-98bf0a3e0a86", new DateTime(2026, 3, 3, 15, 51, 39, 665, DateTimeKind.Utc).AddTicks(2676), "AQAAAAIAAYagAAAAEHYCVupl9hw1xSaA+k1N7zlAUsRRXkdxOJgCsC2p7IdW9xhhrr3TJzPgQK8Z7KLmZA==", "a286b903-e3ce-42b5-bafa-517679f06a2d" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "58efbbfd-348a-4337-a1b1-7151d57a6584", new DateTime(2026, 3, 3, 15, 51, 39, 712, DateTimeKind.Utc).AddTicks(7859), "AQAAAAIAAYagAAAAEDE9aEgcdS4ArMMVJKiABcyYQUEN+AL79vgfVT79e5lpH6iDezdajO5VknWiKzty1g==", "91d3abd9-5a93-4aed-b9dd-daf9b7c4161f" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "patient-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "97b57609-45f8-4569-9b5b-1362c75fae2d", new DateTime(2026, 3, 3, 15, 51, 39, 759, DateTimeKind.Utc).AddTicks(9311), "AQAAAAIAAYagAAAAEBWypvDkKJggepMUShnW6AbtQk5OeUre1ULWueu7arBIiMUw2ua5FfhEFBbAslALgg==", "0244e69c-8a04-4e48-9a5b-87cdba8c9773" });
        }
    }
}
