using ChurchManagementSystem.Data;
using Microsoft.AspNetCore.Mvc;

namespace ChurchManagementSystem.Controllers
{
    public class MemberController : Controller
    {
        private readonly ChurchDbContext _context;

        public MemberController(ChurchDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            return View();
        }
    }


}

