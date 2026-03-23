using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medrotic.Api.Migrations
{
    /// <inheritdoc />
    public partial class DoctorPortalComplete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DoctorId",
                table: "MedicalRecords",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Appointments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PatientId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DoctorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AppointmentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appointments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Appointments_AspNetUsers_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Appointments_AspNetUsers_PatientId",
                        column: x => x.PatientId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "6f19cbd8-ba75-4346-8675-f5121aa45ff9", new DateTime(2026, 3, 4, 16, 45, 11, 430, DateTimeKind.Utc).AddTicks(847), "AQAAAAIAAYagAAAAEF1Y97PdMSfIDLzbemRx2IbW/s7VKYZPjiHZ9BV6+QQbUyBKqH1WmtcfkMMBCc2Z4w==", "40af137f-bc98-49c7-a1d6-cd5210bdd669" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "14d59f99-df68-47e2-9d56-559b5651a8fb", new DateTime(2026, 3, 4, 16, 45, 11, 533, DateTimeKind.Utc).AddTicks(5045), "AQAAAAIAAYagAAAAEICAykSi3qGA53IuJjHvfcXe94Hxa4aLBGEQSuLf7fnS9P6UdvvdBMoRw5FnsRXnAw==", "b2733009-1af0-4ead-a4ac-543c0066b61e" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "patient-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "4462d498-cee4-4895-ac56-602a48259cf4", new DateTime(2026, 3, 4, 16, 45, 11, 647, DateTimeKind.Utc).AddTicks(4687), "AQAAAAIAAYagAAAAEPJbMjzhRtkF5ngTjlRD6U7g84nJtVThI5uWfjVYTyUrLVzTvpF59wpYlvcS3dnReQ==", "6ef5c9a5-0134-4607-a55c-a40fb7bf9daf" });

            migrationBuilder.CreateIndex(
                name: "IX_MedicalRecords_DoctorId",
                table: "MedicalRecords",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_DoctorId",
                table: "Appointments",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_Appointments_PatientId",
                table: "Appointments",
                column: "PatientId");

            migrationBuilder.AddForeignKey(
                name: "FK_MedicalRecords_AspNetUsers_DoctorId",
                table: "MedicalRecords",
                column: "DoctorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MedicalRecords_AspNetUsers_DoctorId",
                table: "MedicalRecords");

            migrationBuilder.DropTable(
                name: "Appointments");

            migrationBuilder.DropIndex(
                name: "IX_MedicalRecords_DoctorId",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "DoctorId",
                table: "MedicalRecords");

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
    }
}
