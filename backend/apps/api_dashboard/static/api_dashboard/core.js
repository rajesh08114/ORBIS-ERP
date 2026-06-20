(function () {
  const STORAGE = {
    access: "api_dashboard_access_token",
    refresh: "api_dashboard_refresh_token",
    profile: "api_dashboard_profile",
    theme: "api_dashboard_theme",
  };

  function getToken(key) {
    return localStorage.getItem(key) || "";
  }

  function setToken(key, value) {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  }

  function getTokens() {
    return {
      access: getToken(STORAGE.access),
      refresh: getToken(STORAGE.refresh),
    };
  }

  function setTokens({ access, refresh }) {
    setToken(STORAGE.access, access || "");
    setToken(STORAGE.refresh, refresh || "");
  }

  function apiUrl(path) {
    return path.startsWith("/api/") ? path : `/api/sanity-dashboard/api/${path.replace(/^\/+/, "")}`;
  }

  async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", headers.get("Content-Type") || "application/json");
    const tokens = getTokens();
    if (tokens.access) {
      headers.set("Authorization", `Bearer ${tokens.access}`);
    }
    const response = await fetch(path, {
      credentials: "same-origin",
      ...options,
      headers,
    });
    if (response.status === 401 && tokens.refresh && !options._retry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiFetch(path, { ...options, _retry: true });
      }
    }
    return response;
  }

  async function refreshAccessToken() {
    const tokens = getTokens();
    if (!tokens.refresh) {
      return false;
    }
    const response = await fetch("/api/auth/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    if (data.access) {
      setToken(STORAGE.access, data.access);
      return true;
    }
    return false;
  }

  function safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function maskSensitive(value) {
    if (Array.isArray(value)) {
      return value.map(maskSensitive);
    }
    if (value && typeof value === "object") {
      const output = {};
      for (const [key, entry] of Object.entries(value)) {
        if (/(password|secret|token|key|refresh)/i.test(key)) {
          output[key] = "***masked***";
          continue;
        }
        output[key] = maskSensitive(entry);
      }
      return output;
    }
    return value;
  }

  function decodeJwt(token) {
    if (!token || token.split(".").length < 2) {
      return null;
    }
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload.padEnd(payload.length + (4 - payload.length % 4) % 4, "="));
    return JSON.parse(json);
  }

  function formatJson(value) {
    const normalized = typeof value === "string" ? safeJsonParse(value) ?? value : value;
    return typeof normalized === "string"
      ? normalized
      : JSON.stringify(maskSensitive(normalized), null, 2);
  }

  function setTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE.theme, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE.theme) || "dark";
    setTheme(saved);
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
        setTheme(next);
      });
    }
  }

  function showMessage(targetId, message, kind = "info") {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.textContent = message;
    target.dataset.kind = kind;
  }

  function updateSidebarUser() {
    const output = document.getElementById("sidebar-user");
    const roleOutput = document.getElementById("sidebar-role");
    if (!output || !roleOutput) return;
    const token = getToken(STORAGE.access);
    const payload = decodeJwt(token);
    if (payload) {
      output.textContent = payload.username || payload.email || payload.sub || "Signed in";
      roleOutput.textContent = payload.role || "JWT attached to requests.";
    } else {
      output.textContent = "Not signed in";
      roleOutput.textContent = "Access tokens attach automatically.";
    }
  }

  window.ApiDashboard = {
    STORAGE,
    apiFetch,
    apiUrl,
    decodeJwt,
    formatJson,
    getTokens,
    initTheme,
    maskSensitive,
    refreshAccessToken,
    safeJsonParse,
    setTheme,
    setTokens,
    showMessage,
    updateSidebarUser,
  };

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    updateSidebarUser();
  });
})();
