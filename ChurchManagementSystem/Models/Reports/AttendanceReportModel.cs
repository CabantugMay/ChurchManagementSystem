using Microsoft.AspNetCore.Mvc;

namespace ChurchManagementSystem.Models.Reports
{
    public class AttendanceReportModel
    {
        public int Member_ID { get; set; }

        public string Attendee { get; set; }

        public DateTime Week1Date { get; set; }
        public DateTime? Week2Date { get; set; }
        public DateTime? Week3Date { get; set; }
        public DateTime? Week4Date { get; set; }

        public int Week1 { get; set; }
        public int Week2 { get; set; }
        public int Week3 { get; set; }
        public int Week4 { get; set; }
    }
}
