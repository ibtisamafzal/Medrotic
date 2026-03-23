using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medrotic.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HospitalId",
                table: "AspNetUsers",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PatientId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedByRole = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedById = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CurrentState = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documents_AspNetUsers_PatientId",
                        column: x => x.PatientId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Hospitals",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Province = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hospitals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MedicalRecords",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PatientId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RecordDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Diagnosis = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Treatment = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedByRole = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicalRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MedicalRecords_AspNetUsers_PatientId",
                        column: x => x.PatientId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AIResults",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DocumentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ExtractedText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConfidenceScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Findings = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsApproved = table.Column<bool>(type: "bit", nullable: false),
                    ApprovedByDoctorId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AIResults_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    MedicalRecordId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Channel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_MedicalRecords_MedicalRecordId",
                        column: x => x.MedicalRecordId,
                        principalTable: "MedicalRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "DateOfBirth", "FullName", "HospitalId", "PasswordHash", "SecurityStamp" },
                values: new object[] { "edc62faf-9083-45d0-96a8-5877e31b948b", new DateTime(1985, 5, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "System Administrator", "hospital-id-1", "AQAAAAIAAYagAAAAEKT8F/tWe+PbPB6kMWlkktv9ZuaMOMvwM/0TjW0IPixvLYSsc8+KMMj+Rjn6jU6Nhw==", "75535317-a4ca-4f91-8107-5bee05f69cdc" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "DateOfBirth", "ExperienceYears", "FullName", "HospitalId", "PasswordHash", "SecurityStamp", "Specialty" },
                values: new object[] { "69e00740-9b0b-428f-b149-296f7a2ed5f0", new DateTime(1992, 3, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), 8, "Dr. Ahmed Khan", "hospital-id-1", "AQAAAAIAAYagAAAAEPpxz15VGPRAvqlvexBLsUKXucgavr4B6EkDYpFlKlhwDJl0S90j310sXsHcWUl0Vg==", "3e55f796-5f9a-4afd-9931-2d7dd53b3b84", "Cardiology" });

            migrationBuilder.InsertData(
                table: "Hospitals",
                columns: new[] { "Id", "Address", "City", "ContactNumber", "Email", "Name", "Province" },
                values: new object[] { "hospital-id-1", "COMSATS Road, off GT Road", "Sahiwal", "040-4305000", "info@medrotic.com", "COMSATS Sahiwal Hospital", "Punjab" });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_HospitalId",
                table: "AspNetUsers",
                column: "HospitalId");

            migrationBuilder.CreateIndex(
                name: "IX_AIResults_DocumentId",
                table: "AIResults",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_PatientId",
                table: "Documents",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_MedicalRecords_PatientId",
                table: "MedicalRecords",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_MedicalRecordId",
                table: "Notifications",
                column: "MedicalRecordId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Hospitals_HospitalId",
                table: "AspNetUsers",
                column: "HospitalId",
                principalTable: "Hospitals",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Hospitals_HospitalId",
                table: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "AIResults");

            migrationBuilder.DropTable(
                name: "Hospitals");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Documents");

            migrationBuilder.DropTable(
                name: "MedicalRecords");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_HospitalId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "HospitalId",
                table: "AspNetUsers");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "DateOfBirth", "FullName", "PasswordHash", "SecurityStamp" },
                values: new object[] { "37b706fd-8a61-4927-b162-68d07ec5f4d5", new DateTime(1980, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Default Admin", "AQAAAAIAAYagAAAAEFdMayvmWDJUv2HMWzd0pAcmJTdA7GSVNS+w4mYsHjyrRC/94aLwjH17kRyJhk6xTw==", "047353c6-b18c-409a-8872-45496188f5a9" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "DateOfBirth", "ExperienceYears", "FullName", "PasswordHash", "SecurityStamp", "Specialty" },
                values: new object[] { "4921e784-6b13-413f-ad22-4a1ccf245b79", new DateTime(1990, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 5, "Default Doctor", "AQAAAAIAAYagAAAAEHK+57dN01hFc2VRlcT2urGATxZBC6a5mER0f5Cl9MGLtDv+rB4qiGw5fgPXgeKCpw==", "e23c6270-cad8-4ce7-a1f8-07e467a9974f", "General" });
        }
    }
}
