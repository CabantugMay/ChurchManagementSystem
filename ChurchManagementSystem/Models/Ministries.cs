using System.ComponentModel.DataAnnotations;

namespace ChurchManagementSystem.Models
{
    public class Ministries
    {
        [Key]
        public int ID { get; set; }

        public string? Ministry { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public string? CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? UpdatedBy { get; set; }
    }
}
