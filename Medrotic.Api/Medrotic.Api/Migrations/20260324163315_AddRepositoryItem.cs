using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medrotic.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRepositoryItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_AspNetUsers_DoctorId",
                table: "Appointments");

            migrationBuilder.AlterColumn<string>(
                name: "CNIC",
                table: "AspNetUsers",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateTable(
                name: "RepositoryItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Size = table.Column<long>(type: "bigint", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UploadedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RepositoryItems", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "ad62deae-cab2-4444-ad99-91f35e3654c1", new DateTime(2026, 3, 24, 16, 33, 14, 765, DateTimeKind.Utc).AddTicks(7096), "AQAAAAIAAYagAAAAEJX5QNsuhk/lYswGHMYGVEZYKrdD1FvfxVg1ZQAlLc3nTr5i3ttmjeTv/wrMAvyUmQ==", "32b91f4b-4e27-4ddc-a86a-e6d6ac28be20" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "4556dc1a-6890-4846-a6b3-09c881202fa4", new DateTime(2026, 3, 24, 16, 33, 14, 855, DateTimeKind.Utc).AddTicks(8270), "AQAAAAIAAYagAAAAEBRRTTbDQIp/U5AhPayfUUpodUGqDlxSlEGb4igX91IRx4naQ3yLPrTHFiC0g9yJPw==", "d7021498-f874-453e-866d-d4f7bdc4235b" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "patient-id-1",
                columns: new[] { "ConcurrencyStamp", "LastActivity", "PasswordHash", "SecurityStamp" },
                values: new object[] { "774c4e19-6d2e-4190-b5f8-079efc936387", new DateTime(2026, 3, 24, 16, 33, 14, 948, DateTimeKind.Utc).AddTicks(4608), "AQAAAAIAAYagAAAAEOVEORPXDeHUBc+Dj3gqUOZUiIoaqDbepx69uoPEx2yNrR5kA/sXmdwduPCyK7Kflg==", "4d547b28-7b86-4d00-a4b5-30b68523da17" });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_CNIC",
                table: "AspNetUsers",
                column: "CNIC",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_AspNetUsers_DoctorId",
                table: "Appointments",
                column: "DoctorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appointments_AspNetUsers_DoctorId",
                table: "Appointments");

            migrationBuilder.DropTable(
                name: "RepositoryItems");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_CNIC",
                table: "AspNetUsers");

            migrationBuilder.AlterColumn<string>(
                name: "CNIC",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

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

            migrationBuilder.AddForeignKey(
                name: "FK_Appointments_AspNetUsers_DoctorId",
                table: "Appointments",
                column: "DoctorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
