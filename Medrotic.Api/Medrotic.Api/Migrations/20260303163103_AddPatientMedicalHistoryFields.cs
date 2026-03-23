using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medrotic.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientMedicalHistoryFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "64234abf-27be-43c5-a328-14cc155035d7", new DateTime(2026, 3, 3, 16, 31, 1, 32, DateTimeKind.Utc).AddTicks(3544), "AQAAAAIAAYagAAAAEG870tMAJwsLrm8CgBre5YvtJYQB/XGHBYpoFcMFTPpClhI6vRTDxZcu0+vEFy9ezA==", "fdf4535b-7d8d-4a6e-a3ea-5b74ea2f0dc9" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "9426c144-afee-45d1-9678-3ffb93a30ac5", new DateTime(2026, 3, 3, 16, 31, 1, 150, DateTimeKind.Utc).AddTicks(5249), "AQAAAAIAAYagAAAAEL4He0lqP5e8gsnUnsZYXdCSiKNlllkleeIq2NNhmfj+8p2AD1zeK9nGQJUt+hyBpw==", "d7bf6748-c5d3-46c8-a05c-92015fb06cd9" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "patient-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "5c0308c3-2ec2-4e61-b716-cea3aacf0940", new DateTime(2026, 3, 3, 16, 31, 1, 257, DateTimeKind.Utc).AddTicks(1557), "AQAAAAIAAYagAAAAEDiSqwJNZQ2xNAPy8aMeUFW70b7uJp0orHFZ+IN/xl66cGZ8dUPaA3DM2EezuIdeMA==", "0321a8dc-14d6-4275-bff1-25aa6cfbc130" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
    }
}
