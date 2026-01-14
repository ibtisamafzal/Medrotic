using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Medrotic.Api.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "636005f7-47da-43b7-a6ca-96a0c4b9c584", "AQAAAAIAAYagAAAAEHlW5D9ee+n9vd512DRVB5cFswZ8gYeY+RrSMmyTGTb8QhBX3txjqe2IgV8JRT9lJw==", "fd08b0c3-f812-48cf-979e-4a9aad5b4fb7" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "2c6866b2-8b4e-462f-9596-d33513677aa6", "AQAAAAIAAYagAAAAEJ1VlZ74h/qSHYWliiiIB0xlmOokFcR1BNQTp2qlSmYFL62NETkc6P+Uvw8/C17A1Q==", "0822a8ec-8fe1-4082-948c-7959059fbd0f" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "admin-id-1",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "37b706fd-8a61-4927-b162-68d07ec5f4d5", "AQAAAAIAAYagAAAAEFdMayvmWDJUv2HMWzd0pAcmJTdA7GSVNS+w4mYsHjyrRC/94aLwjH17kRyJhk6xTw==", "047353c6-b18c-409a-8872-45496188f5a9" });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "doctor-id-1",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "4921e784-6b13-413f-ad22-4a1ccf245b79", "AQAAAAIAAYagAAAAEHK+57dN01hFc2VRlcT2urGATxZBC6a5mER0f5Cl9MGLtDv+rB4qiGw5fgPXgeKCpw==", "e23c6270-cad8-4ce7-a1f8-07e467a9974f" });
        }
    }
}
