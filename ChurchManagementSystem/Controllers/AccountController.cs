using ChurchManagementSystem.Data;
using Dapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ChurchManagementSystem.Controllers
{
    public class AccountController : Controller
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly SignInManager<IdentityUser> _signInManager;

        public string resultMessage;
        private readonly DapperContext _context;

        public AccountController(
            UserManager<IdentityUser> userManager,
            RoleManager<IdentityRole> roleManager,
            SignInManager<IdentityUser> signInManager, DapperContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _signInManager = signInManager;
            _context = context;
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

        [HttpGet]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Login(
        string username,
        string password)
        {
            string resultMessage = Validation(username, password, "", true);
            if (resultMessage == "")
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

                await _signInManager.SignInAsync(user, false);

                // Login successful
                return RedirectToAction("Attendance", "Home");
            }
            return View();
        }

        // POST: /Account/Register
        // POST: /Account/Register
        [HttpPost]
        public async Task<IActionResult> Register(
            string username,
            string password,
            string confirmPassword)
        {
            string resultMessage = Validation(
                username,
                password,
                confirmPassword,
                false);

            if (resultMessage == "")
            {
                // Check if username exists in dbo.Members
                using (var connection = _context.CreateConnection())
                {
                    string sql = @"
                SELECT COUNT(1)
                FROM dbo.Members
                WHERE Username = @Username";

                    int memberExists = await connection.ExecuteScalarAsync<int>(
                        sql,
                        new
                        {
                            Username = username
                        });

                    if (memberExists == 0)
                    {
                        ModelState.AddModelError(
                            "InvalidUsername",
                            "Username is not registered as a member.");

                        return View();
                    }
                }

                // Member exists → create Identity account
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

            return View();
        }



        public async Task<IActionResult> ForgotPassword(
        string username,
        string password, string password2)
        {
            string resultMessage = Validation(username, password, "", true);
            if (resultMessage == "")
            {
                var user = await _userManager.FindByNameAsync(username);

                if (user == null)
                {
                    ModelState.AddModelError(
                            "InvalidCredentials",
                            "Invalid username or password.");
                    return View();
                }

                var result = await _userManager.ChangePasswordAsync (
                    user,
                    password, password2);

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
            return View();
        }

        public string Validation(string username, string password, string password2, bool isLogin)
        {
            string errorMessage = "";

            if (username == null || username == "")
            {
                errorMessage = "Username is required.";
                ModelState.AddModelError("InvalidUsername", errorMessage);
            }

            if (password == null || password == "")
            {
                errorMessage = "Password is required.";
                ModelState.AddModelError("InvalidPassword", errorMessage);
            }

            if (!isLogin)
            {
                if (password2 == null || password2 == "")
                {
                    errorMessage = "Confirm password is required.";
                    ModelState.AddModelError("InvalidPassword2", errorMessage);

                }

                if (password != password2 && (password2 != null && password2 != ""))
                {
                    errorMessage = "Password do not match.";
                    ModelState.AddModelError("InvalidPassword2", errorMessage);
                }


            }

            return errorMessage;
        }
    }
}