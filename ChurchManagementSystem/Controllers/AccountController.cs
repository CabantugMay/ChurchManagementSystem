using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ChurchManagementSystem.Controllers
{
    public class AccountController : Controller
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public AccountController(
            UserManager<IdentityUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        // GET: /Account/Login
        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }

        // GET: /Account/Register
        [HttpGet]
        public IActionResult Register()
        {
            return View();
        }

        // POST: /Account/Register
        [HttpPost]
        public async Task<IActionResult> Register(
            string username,
            string password,
            string confirmPassword)
        {
            if (password != confirmPassword)
            {
                ModelState.AddModelError(
                    "confirmPassword",
                    "Passwords do not match.");

                return View();
            }

            var user = new IdentityUser
            {
                UserName = username
            };

            var result = await _userManager.CreateAsync(
                user,
                password);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(
                        "password",
                        error.Description);
                }

                return View();
            }

            await _userManager.AddToRoleAsync(
                user,
                "Administrator");

            // Registration successful → Login page
            return RedirectToAction("Login");
        }

        [HttpPost]
        public async Task<IActionResult> Login(
        string username,
        string password)
            {
                var user = await _userManager.FindByNameAsync(username);

                if (user == null)
                {
                ModelState.AddModelError(
                        "InvalidCredentials",
                        "Invalid username or password.");
                return View();
                }

                var passwordValid = await _userManager.CheckPasswordAsync(
                    user,
                    password);

                if (!passwordValid)
                {
                    ModelState.AddModelError(
                        "InvalidCredentials",
                        "Invalid username or password.");
                    return View();
                }

                // Login successful
                return RedirectToAction("Summary", "Home");
        }
    }
}