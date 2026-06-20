(function () {
  async function handleSignin(event) {
    const form = event.target;
    const messageId = "auth-message";
    event.preventDefault();
    const identifier = document.getElementById("login-identifier").value.trim();
    const password = document.getElementById("login-password").value;
    try {
      const response = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: identifier, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.detail || "Unable to sign in");
      }
      window.ApiDashboard.setTokens({ access: data.access, refresh: data.refresh });
      window.ApiDashboard.updateSidebarUser();
      window.location.href = "/sanity-dashboard/";
    } catch (error) {
      window.ApiDashboard.showMessage(messageId, error.message, "error");
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    const messageId = "auth-message";
    const payload = {
      username: document.getElementById("signup-username").value.trim(),
      email: document.getElementById("signup-email").value.trim(),
      password: document.getElementById("signup-password").value,
      password_confirm: document.getElementById("signup-confirm").value,
    };
    try {
      const response = await fetch("/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.detail || "Unable to register");
      }
      window.ApiDashboard.setTokens({ access: data.access, refresh: data.refresh });
      window.ApiDashboard.updateSidebarUser();
      window.location.href = "/sanity-dashboard/";
    } catch (error) {
      window.ApiDashboard.showMessage(messageId, error.message, "error");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const signinForm = document.getElementById("signin-form");
    const signupForm = document.getElementById("signup-form");
    if (signinForm) {
      signinForm.addEventListener("submit", handleSignin);
    }
    if (signupForm) {
      signupForm.addEventListener("submit", handleSignup);
    }
  });
})();
