using Church.Models;
using ChurchManagementSystem.Data;
using ChurchManagementSystem.Models;
using Dapper;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Diagnostics;

namespace Church.Controllers
{
    public class HomeController : Controller
    {
        private readonly DapperContext _context;

        public HomeController(DapperContext context)
        {
            _context = context;
        }

        [Authorize]
        public IActionResult Settings()
        {
            return View();
        }

        //[Route("Home/Reports")]
        [Authorize]

        public IActionResult Reports()
        {
            return View();
        }

        //[Route("Home/Attendance")]
        [Authorize]
        public IActionResult Attendance()
        {
            return View();
        }

        //[Route("Home/Ministry")]
        [Authorize]
        public IActionResult Ministry()
        {
            return View();
        }

        //[Route("Home/Tithes")]
        [Authorize]
        public IActionResult Financials()
        {
            return View();
        }

        //[Route("Home/Offering")]
        [Authorize]
        public IActionResult Offering()
        {
            return View();
        }

        //[Route("Home/Rental")]
        [Authorize]
        public IActionResult Rental()
        {
            return View();
        }

        //[Route("Home/Privacy")]
        [Authorize]
        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(
            Duration = 0,
            Location = ResponseCacheLocation.None,
            NoStore = true)]
        public IActionResult Error()
        {
            return View(
                new ErrorViewModel
                {
                    RequestId = Activity.Current?.Id
                        ?? HttpContext.TraceIdentifier
                });
        }

        [HttpPost]
        public async Task<IActionResult> AddMembers(DataModel member)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@ID", member.ID);
            parameters.Add("@Username", member.Username);
            parameters.Add("@FirstName", member.FirstName);
            parameters.Add("@MiddleName", member.MiddleName);
            parameters.Add("@LastName", member.LastName);
            parameters.Add("@Gender", member.Gender);
            parameters.Add("@Addr", member.Address);
            parameters.Add("@BirthDate", member.BirthDate);
            parameters.Add("@PhoneNumber", member.PhoneNumber);
            parameters.Add("@Email", member.Email);
            parameters.Add("@CreatedBy", User.Identity?.Name);
            parameters.Add("@UpdatedBy", User.Identity?.Name);
            parameters.Add("@isVisitor", member.IsVisitor);
            parameters.Add("@Query", 1);

            await connection.ExecuteAsync(
                "dbo.nsp_Settings",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            TempData["SuccessMessage"] = "Member saved successfully.";
            return RedirectToAction("Settings");
        }

        // GET MEMBERS AS RAW JSON
        [HttpGet]
        public async Task<IActionResult> GetMembers()
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();

            parameters.Add("@Query", 2);

            var members = await connection.QueryAsync(
                "dbo.nsp_Settings",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return Json(members);
        }

        //Attendance
        [HttpGet]
        public async Task<IActionResult> GetAttendance(string reportMonth)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();

            parameters.Add("@Date", reportMonth);
            parameters.Add("@Query", 1);

            var members = await connection.QueryAsync(
                "dbo.nsp_Attendance",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return Json(members);
        }

        //public class AttendanceModel
        //{
        //    public int Member_ID { get; set; }

        //    public DateTime Attendance_Date { get; set; }
        //    public int IsVisitor { get; set; }
        //    public string Name { get; set; }
        //}
        [HttpPost]
        public async Task<IActionResult> ManageAttendance(
        List<DataModel> Attendance)
        {
            var table = new DataTable();
            table.Columns.Add("Date", typeof(DateTime));
            table.Columns.Add("Member_ID", typeof(int));
            table.Columns.Add("Username", typeof(string));
            table.Columns.Add("IsVisitor", typeof(int));
            table.Columns.Add("CreatedBy", typeof(string));
            table.Columns.Add("UpdatedBy", typeof(string));

            foreach (var item in Attendance)
            {
                table.Rows.Add(
                    item.Date,
                    item.ID,
                    item.Username ?? "",
                    item.IsVisitor,
                    User.Identity?.Name,
                    User.Identity?.Name
                );
            }

            using var connection = _context.CreateConnection();


            var parameters = new DynamicParameters();

            parameters.Add(
                "@Attendance",
                table.AsTableValuedParameter("dbo.udt_Attendance")
            );

            parameters.Add("@Query", 2);

            await connection.ExecuteAsync(
                "dbo.nsp_Attendance",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            TempData["SuccessMessage"] = "Attendance saved successfully.";
            return RedirectToAction("Attendance");
        }



        public async Task<IActionResult> GetReport(string reportMonth)
        {
            using var connection = _context.CreateConnection();

            var date = DateTime.TryParse(reportMonth, out var parsedDate)
                ? parsedDate
                : DateTime.Today;

            var parameters = new DynamicParameters();

            parameters.Add("@Year", date.Year);
            parameters.Add("@Month", date.Month);
            parameters.Add("@Query", 1);

            var data = await connection.QueryMultipleAsync(
                "dbo.nsp_Reports",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var attendanceReport = data.Read();
            var ministryReport = data.Read();
            var tithesReport = data.Read();
            var tithesReportAllocation = data.Read();

            var result = new object[] { attendanceReport , ministryReport, tithesReport, tithesReportAllocation };
            return Json(result);
        }

        // GET MEMBERS AS RAW JSON
        [HttpGet]
        public async Task<IActionResult> GetMinistry(string reportMonth)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();

            parameters.Add("@Ministry_Date", reportMonth);
            parameters.Add("@Query", 1);

            var results = await connection.QueryMultipleAsync(
                "dbo.nsp_Ministry",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var ministrylist = results.Read();
            var memberlist = results.Read();

            var result = new object[] { ministrylist, memberlist };

            return Json(result);
        }

        public class MinistryAssignment
        {
            public int? MemberId { get; set; }
            public int MinistryId { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> AssignMinistry(
    string mDate,
    List<MinistryAssignment> Ministries)
        {
            using var connection = _context.CreateConnection();

            var table = new DataTable();

            table.Columns.Add("Member_ID", typeof(int));
            table.Columns.Add("Ministry_ID", typeof(int));
            table.Columns.Add("Ministry_Date", typeof(DateTime));

            foreach (var assignment in Ministries)
            {
                if (assignment.MemberId != null)
                {
                    table.Rows.Add(
                        assignment.MemberId ?? (object)DBNull.Value,
                        assignment.MinistryId,
                        DateTime.Parse(mDate)
                    );
                }
            }

            var parameters = new DynamicParameters();

            parameters.Add("@CreateBy", User.Identity?.Name);
            parameters.Add("@Query", 2);
            parameters.Add(
                "MemberMinistry",
                table.AsTableValuedParameter("dbo.udt_MemberMinistry")
            );

            await connection.ExecuteAsync(
                "dbo.nsp_Ministry",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return RedirectToAction("Ministry");
        }


        // GET MEMBERS AS RAW JSON
        [HttpGet]
        public async Task<IActionResult> GetTithes(string reportMonth)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();

            parameters.Add("@Ministry_Date", reportMonth);
            parameters.Add("@Query", 1);

            var results = await connection.QueryMultipleAsync(
                "dbo.nsp_Tithes",
                parameters,
                commandType: CommandType.StoredProcedure
            );


            var tithelist = results.Read();
            var offeringAmount = results.Read();
            var rent = results.Read();

            var result = new object[] { tithelist, offeringAmount, rent };

            return Json(result);
        }


        [HttpPost]
        public async Task<IActionResult> SetTithes(
            string mDate, string members, decimal amount )
        {
            using var connection = _context.CreateConnection();

            var table = new DataTable();

            table.Columns.Add("Ministry_Date", typeof(DateTime));
            table.Columns.Add("Member_ID", typeof(int));
            table.Columns.Add("Amount", typeof(decimal));

            var parameters = new DynamicParameters();

            parameters.Add("@Ministry_Date", mDate);
            parameters.Add("@Member_ID", members);
            parameters.Add("@amount", amount);
            parameters.Add("@CreateBy", User.Identity?.Name);
            parameters.Add("Query", 2);

            await connection.ExecuteAsync(
                "dbo.nsp_Tithes",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return RedirectToAction("Financials");
        }

        public class DeleteTithesRequest
        {
            public int Id { get; set; }
            public DateTime Date { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteTithes(
    [FromBody] DeleteTithesRequest model)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@Query", 3);
            parameters.Add("@Member_ID", model.Id);
            parameters.Add("@Ministry_Date", model.Date);

            await connection.ExecuteAsync(
                "dbo.nsp_Tithes",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return RedirectToAction("Financials");
        }

        public class UpdateTithesRequest
        {
            public int Id { get; set; }
            public DateTime Date { get; set; }
            public decimal Amount { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateTithes(
    [FromBody] UpdateTithesRequest model)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();

            parameters.Add("@Query", 4);
            parameters.Add("@Member_ID", model.Id);
            parameters.Add("@Ministry_Date", model.Date);
            parameters.Add("@Amount", model.Amount);

            await connection.ExecuteAsync(
                "dbo.nsp_Tithes",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return RedirectToAction("Financials");
        }

        [HttpPost]
        public async Task<IActionResult> SetOfferings(DateTime mDate, decimal Amount)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();

            parameters.Add("@Query", 5);
            parameters.Add("@Ministry_Date", mDate);
            parameters.Add("@Amount", Amount);

            await connection.ExecuteAsync(
                "dbo.nsp_Tithes",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return RedirectToAction("Financials");
        }

        [HttpPost]
        public async Task<IActionResult> SetRent(
            string mDate, string members, decimal amount)
        {
            using var connection = _context.CreateConnection();

            var table = new DataTable();

            table.Columns.Add("Ministry_Date", typeof(DateTime));
            table.Columns.Add("Member_ID", typeof(int));
            table.Columns.Add("Amount", typeof(decimal));

            var parameters = new DynamicParameters();

            parameters.Add("@Ministry_Date", mDate);
            parameters.Add("@Member_ID", members);
            parameters.Add("@amount", amount);
            parameters.Add("@CreateBy", User.Identity?.Name);
            parameters.Add("Query", 7);

            await connection.ExecuteAsync(
                "dbo.nsp_Tithes",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return RedirectToAction("Financials");
        }

        // GET MEMBERS AS RAW JSON
        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();

            parameters.Add("@Query", 3);

            var settings = await connection.QueryMultipleAsync(
                "dbo.nsp_Settings",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var members = settings.Read();
            var ministry = settings.Read();
            var ministryassign = settings.Read();


            var result = new object[]
            {
            members,
            ministry,
            ministryassign
            };



            return Json(result);
        }

        [HttpPost]
        public async Task<IActionResult> AddMinistry(string nMinistry)
        {

            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@CreatedBy", User.Identity?.Name);
            parameters.Add("@Ministry", nMinistry);
            parameters.Add("@Query", 4);

            var result = await connection.ExecuteAsync("dbo.nsp_Settings", parameters, commandType: CommandType.StoredProcedure);

            return RedirectToAction("Settings");
        }

        [HttpPost]
        public async Task<IActionResult> AddMinistryRole(
        string nMinistryRole,
        int Ministry_ID)
            {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();

            parameters.Add("@CreatedBy", User.Identity?.Name);
            parameters.Add("@Ministry_ID", Ministry_ID);
            parameters.Add("@Role", nMinistryRole);
            parameters.Add("@Query", 5);

            var result = await connection.ExecuteAsync("dbo.nsp_Settings", parameters, commandType: CommandType.StoredProcedure);

            return RedirectToAction("Settings");

        }

        [HttpPost]
        public async Task<IActionResult> AddMinistryAssign(int roleId, int member_ID)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@Role_ID", roleId);
            parameters.Add("@Member_ID", member_ID);
            parameters.Add("@CreatedBy", User.Identity?.Name);

            parameters.Add("Query", 6);
            await connection.ExecuteAsync(
                "dbo.nsp_Settings",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            //return RedirectToAction(
            //    actionName: "Settings",
            //    controllerName: "Home",
            //    fragment: "ministry-section"
            //);
            return Json(new { success = true });
        }

        [HttpPost]
        public async Task<IActionResult> DeleteMinistryAssign(int memberId, int roleId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("@Member_ID", memberId);
            parameters.Add("@Role_ID", roleId);
            parameters.Add("Query", 7);

            await connection.ExecuteAsync(
                "dbo.nsp_Settings",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return Json(new { success = true });
        }

    }
}
