using Church.Models;
using ChurchManagementSystem.Data;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace Church.Controllers
{
    public class HomeController : Controller
    {
        [Route("Home/Summary")]
        public IActionResult Summary()
        {
            return View();
        }

        [Route("Home/Attendance")]
        public IActionResult Attendance()
        {
            return View();
        }

        [Route("Home/Ministry")]
        public IActionResult Ministry()
        {
            return View();
        }

        [Route("Home/Tithes")]
        public IActionResult Tithes()
        {
            return View();
        }

        [Route("Home/Offering")]
        public IActionResult Offering()
        {
            return View();
        }

        [Route("Home/Rental")]
        public IActionResult Rental()
        {
            return View();
        }

        [Route("Home/Privacy")]
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
    }
}
