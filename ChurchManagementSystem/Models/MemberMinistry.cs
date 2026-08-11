using System.ComponentModel.DataAnnotations;

namespace ChurchManagementSystem.Models
{
    public class MemberMinistry
    {
        [Key]
        public int ID { get; set; }
        public string? Member_ID { get; set; }
        public string? Ministry_ID { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public string? CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? UpdatedBy { get; set; }
    }
}
