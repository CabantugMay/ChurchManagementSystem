
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ChurchManagementSystem.Data
{
    public class ChurchDbContext : IdentityDbContext
    {
        public ChurchDbContext(DbContextOptions<ChurchDbContext> options)   
            : base(options)
        {
        }

       

    }

    
}