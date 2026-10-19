using Microsoft.AspNetCore.Mvc;

namespace ChurchManagementSystem.Models.Reports
{
    public class AttendanceReportViewModel
    {
        public int Year { get; set; }

        public int Month { get; set; }

        public string MonthName { get; set; }

        public List<AttendanceReportModel> Attendees { get; set; }
            = new List<AttendanceReportModel>();
    }
}
