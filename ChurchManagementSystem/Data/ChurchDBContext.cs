using Microsoft.EntityFrameworkCore;


namespace ChurchManagementSystem.Data
{
    public class ChurchDbContext : DbContext
    {
        public ChurchDbContext(DbContextOptions<ChurchDbContext> options)
            : base(options)
        {
        }

        public DbSet<Member> Members { get; set; }
    }

    public class Member
    {
        public int Id { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }
    }
}