namespace ChurchManagementSystem.Models
{
    public class MemberRole
    {
        public string? Member_ID { get; set; }
        public string? Role_ID { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public string? CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? UpdatedBy { get; set; }
    }
}
