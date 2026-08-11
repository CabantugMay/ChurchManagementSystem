function togglePassword() {
    const password = document.getElementById("loginPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const checkbox = document.getElementById("showPassword");

    if (checkbox.checked) {
        password.type = "text";
        confirmPassword.type = "text";
    } else {
        password.type = "password";
        confirmPassword.type = "password";
    }
}