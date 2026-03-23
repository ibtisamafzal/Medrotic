using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medrotic.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientHistoryFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "MedicalRecords",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Disease",
                table: "MedicalRecords",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DoctorName",
                table: "MedicalRecords",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HospitalName",
                table: "MedicalRecords",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReportFilePath",
                table: "MedicalRecords",
                type: "nvarchar(max)",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Disease",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "DoctorName",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "HospitalName",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "ReportFilePath",
                table: "MedicalRecords");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "89236778-2c90-4ef1-aa7e-a620d2e3e66d", new DateTime(2026, 3, 1, 19, 48, 23, 978, DateTimeKind.Utc).AddTicks(210), "AQAAAAIAAYagAAAAEOrwnnMwZOGCHgh8nP/Lm7l7JuOw3vCDad11icMaj2e6M7z9JTsS/cnam4rtmWwzLQ==", "51644dc5-30ec-4d8b-b2bf-480b88afd7f8" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "bb93f326-62cd-4d91-bc85-ca5d665921ac", new DateTime(2026, 3, 1, 19, 48, 24, 125, DateTimeKind.Utc).AddTicks(4250), "AQAAAAIAAYagAAAAEJVlewEvZgRgBHxRTYaqzF1WhIoOEDfZMq+pkXiKxyJ+5QzMuCvqGKOKjExCcKxCBA==", "7d896bfd-f14e-4c3b-a8f0-574e18d8f2c9" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "patient-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "2929605d-4543-4a39-be7c-bc0baeea556d", new DateTime(2026, 3, 1, 19, 48, 24, 285, DateTimeKind.Utc).AddTicks(7444), "AQAAAAIAAYagAAAAEKzi7zMY1ejcaf53O73fVKKpPUCZ5zwd+g5+nRj87UmnlbKIf2wV6skCgK+zW9RE9w==", "7de184ef-cb36-4302-bf01-fb118b95ac9b" });
        }
    }
}
