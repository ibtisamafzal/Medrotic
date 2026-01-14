using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Medrotic.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAddressFieldsAndRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Province",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "admin-role-id", null, "Admin", "ADMIN" },
                    { "doctor-role-id", null, "Doctor", "DOCTOR" },
                    { "patient-role-id", null, "Patient", "PATIENT" }
                });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "City", "ConcurrencyStamp", "PasswordHash", "Province", "SecurityStamp" },
                values: new object[] { "Sahiwal", "a8acf0fc-b5da-4eee-a6e8-b8390adb7532", "AQAAAAIAAYagAAAAEKreJkwRnIEwdALY0FWd4wT8REYpf1KNVS2l9fNUk+M3d897AF5Himq4GKEGhD3zug==", "Punjab", "5ea60784-bcd4-4c86-b24b-50e429f3427e" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "City", "ConcurrencyStamp", "PasswordHash", "Province", "SecurityStamp" },
                values: new object[] { "Sahiwal", "870e9149-c91b-48ed-a105-9d8152c0a5f5", "AQAAAAIAAYagAAAAEPLt5Jrqn0tvjbnufvh2G8Nz5JBESdCi0v0qt75nUmPldl3R24PEfN9wBT/K2fMi0w==", "Punjab", "5466dc61-4644-4589-b1cf-e4d52e490fe7" });

            migrationBuilder.InsertData(
                table: "AspNetUserRoles",
                columns: new[] { "RoleId", "UserId" },
                values: new object[,]
                {
                    { "admin-role-id", "admin-id-1" },
                    { "doctor-role-id", "doctor-id-1" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "patient-role-id");

            migrationBuilder.DeleteData(
                table: "AspNetUserRoles",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { "admin-role-id", "admin-id-1" });

            migrationBuilder.DeleteData(
                table: "AspNetUserRoles",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { "doctor-role-id", "doctor-id-1" });

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "admin-role-id");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "doctor-role-id");

            migrationBuilder.DropColumn(
                name: "City",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Province",
                table: "AspNetUsers");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "29bc8e08-ad2a-4e7c-aefe-01574a4a5e3a", "AQAAAAIAAYagAAAAEMUOzE4gCT//xyFsQNsAXX2myL2SPkH6H836i/nIN55uDvyVqldQPEfU7JTIyO8m3g==", "1862756f-1ce0-47d1-8c06-7d47da49ae43" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "104cd3e6-a0d2-4055-9efb-96bab65f78d2", "AQAAAAIAAYagAAAAEJdZPMlZ7Dgvv6k3C1SEYnUOBVmBGsksY7Hj87kviZJLSBeM/b2MAao/68JqO7+CCA==", "7de05251-32a5-4393-8f5b-0358ff156441" });
        }
    }
}
