using System.ComponentModel.DataAnnotations;

namespace ChurchManagementSystem.Models
{
    public class Attendance
    {
        [Key]

        public string? Member_ID { get; set; }
    }
}
