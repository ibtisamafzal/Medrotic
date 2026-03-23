using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medrotic.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLastActivityAndSeeds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivity",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

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

            migrationBuilder.InsertData(
                table: "AspNetUsers",
                columns: new[] { "Id", "AccessFailedCount", "CNIC", "City", "ConcurrencyStamp", "DateOfBirth", "Email", "EmailConfirmed", "ExperienceYears", "FullName", "Gender", "HospitalId", "LastActivity", "LockoutEnabled", "LockoutEnd", "NormalizedEmail", "NormalizedUserName", "PasswordHash", "PhoneNumber", "PhoneNumberConfirmed", "Province", "Role", "SecurityStamp", "Specialty", "TwoFactorEnabled", "UserName" },
                values: new object[] { "patient-id-1", 0, "35202-9876543-2", "Sahiwal", "2929605d-4543-4a39-be7c-bc0baeea556d", new DateTime(2000, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "patient@medrotic.com", false, null, "Test Patient", "Female", null, new DateTime(2026, 3, 1, 19, 48, 24, 285, DateTimeKind.Utc).AddTicks(7444), false, null, "PATIENT@MEDROTIC.COM", "PATIENT@MEDROTIC.COM", "AQAAAAIAAYagAAAAEKzi7zMY1ejcaf53O73fVKKpPUCZ5zwd+g5+nRj87UmnlbKIf2wV6skCgK+zW9RE9w==", "03009876543", false, "Punjab", "Patient", "7de184ef-cb36-4302-bf01-fb118b95ac9b", null, false, "patient@medrotic.com" });

            migrationBuilder.InsertData(
                table: "AspNetUserRoles",
                columns: new[] { "RoleId", "UserId" },
                values: new object[] { "patient-role-id", "patient-id-1" });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_Email",
                table: "AspNetUsers",
                column: "Email",
                unique: true,
                filter: "[Email] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_Email",
                table: "AspNetUsers");

            migrationBuilder.DeleteData(
                table: "AspNetUserRoles",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { "patient-role-id", "patient-id-1" });

            migrationBuilder.DeleteData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "patient-id-1");

            migrationBuilder.DropColumn(
                name: "LastActivity",
                table: "AspNetUsers");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "edc62faf-9083-45d0-96a8-5877e31b948b", "AQAAAAIAAYagAAAAEKT8F/tWe+PbPB6kMWlkktv9ZuaMOMvwM/0TjW0IPixvLYSsc8+KMMj+Rjn6jU6Nhw==", "75535317-a4ca-4f91-8107-5bee05f69cdc" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "69e00740-9b0b-428f-b149-296f7a2ed5f0", "AQAAAAIAAYagAAAAEPpxz15VGPRAvqlvexBLsUKXucgavr4B6EkDYpFlKlhwDJl0S90j310sXsHcWUl0Vg==", "3e55f796-5f9a-4afd-9931-2d7dd53b3b84" });
        }
    }
}
