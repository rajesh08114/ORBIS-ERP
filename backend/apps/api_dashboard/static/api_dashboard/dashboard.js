(function () {
  let currentRunId = null;
  let currentResults = [];
  let activeProfile = null;
  let endpointRegistry = [];
  let selectedEndpointKey = null;
  let backendBlueprint = null;

  function endpointKey(endpoint) {
    return `${endpoint.method} ${endpoint.path}`;
  }

  function healthClass(status) {
    switch (status) {
      case "healthy":
        return "health-healthy";
      case "warning":
        return "health-warning";
      case "failed":
        return "health-failed";
      default:
        return "health-untested";
    }
  }

  function methodClass(method) {
    return `method-${method.toLowerCase()}`;
  }

  function renderStats(summary) {
    document.getElementById("stat-total-endpoints").textContent = summary.total_endpoints ?? 0;
    document.getElementById("stat-healthy").textContent = summary.healthy_endpoints ?? 0;
    document.getElementById("stat-failed").textContent = summary.failed_endpoints ?? 0;
    document.getElementById("stat-skipped").textContent = summary.skipped_endpoints ?? 0;
    document.getElementById("stat-auth").textContent = summary.auth_protected_endpoints ?? 0;
    document.getElementById("stat-success-rate").textContent = `${Number(summary.success_rate || 0).toFixed(1)}%`;
    document.getElementById("stat-average-response").textContent = `${Number(summary.average_response_time_ms || 0).toFixed(1)} ms`;
    document.getElementById("stat-last-run").textContent = summary.last_test_run || "Never";
    document.getElementById("stat-observability").textContent = `Requests: ${summary.total_tests || 0}, Failed: ${summary.failed_endpoints || 0}, Slowest: ${summary.slowest_endpoint ? summary.slowest_endpoint.path : "n/a"}`;
  }

  function renderBlueprint(blueprint) {
    backendBlueprint = blueprint || null;
    const dbTarget = document.getElementById("database-schema");
    const workflowTarget = document.getElementById("workflow-map");
    const architectureTarget = document.getElementById("architecture-map");
    const routesTarget = document.getElementById("route-catalog");
    if (!dbTarget || !workflowTarget || !architectureTarget || !routesTarget || !blueprint) {
      return;
    }

    const apps = blueprint.database?.apps || [];
    dbTarget.innerHTML = apps.map((app) => `
      <details class="rounded-2xl border border-white/10 bg-slate-950/50 p-4" ${app.app_label === "common" ? "open" : ""}>
        <summary class="cursor-pointer list-none text-sm font-semibold text-white">${app.app_label} <span class="text-slate-400">(${app.model_count})</span></summary>
        <div class="mt-3 space-y-3 text-xs text-slate-300">
          ${(app.models || []).map((model) => `
            <div class="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <strong class="text-slate-100">${model.model}</strong>
                <span class="text-slate-500">${model.db_table}</span>
              </div>
              <div class="mt-2 grid gap-3 lg:grid-cols-2">
                <div>
                  <p class="text-[11px] uppercase tracking-[0.2em] text-cyan-200">Fields</p>
                  <p class="mt-1 text-slate-400">${(model.fields || []).map((field) => field.name).join(", ") || "None"}</p>
                </div>
                <div>
                  <p class="text-[11px] uppercase tracking-[0.2em] text-emerald-200">Relations</p>
                  <p class="mt-1 text-slate-400">${(model.relations || []).map((field) => `${field.name} → ${field.related_model || "self"}`).join(", ") || "None"}</p>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </details>
    `).join("");

    const workflowSteps = blueprint.workflow?.steps || [];
    workflowTarget.innerHTML = workflowSteps.map((step, index) => `
      <div class="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 font-bold text-cyan-200">${index + 1}</div>
        <div>
          <p class="font-semibold text-white">${step.name}</p>
          <p class="mt-1 text-sm text-slate-400">${step.details}</p>
        </div>
      </div>
    `).join("");

    const layers = blueprint.architecture?.layers || [];
    architectureTarget.innerHTML = layers.map((layer) => `
      <div class="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
        <p class="text-xs uppercase tracking-[0.2em] text-cyan-200">${layer.name}</p>
        <p class="mt-2 text-sm text-slate-300">${(layer.items || []).join(" · ")}</p>
      </div>
    `).join("");

    const routes = blueprint.architecture?.routes || [];
    routesTarget.innerHTML = routes.map((route) => `
      <div class="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-b-0">
        <span class="text-white">${route.route}</span>
        <span class="text-xs text-slate-400">${route.name || "unnamed"}</span>
      </div>
    `).join("");
  }

  function renderModules(endpoints) {
    const select = document.getElementById("module-filter");
    const modules = [...new Set(endpoints.map((item) => item.module || "api"))].sort();
    select.innerHTML = '<option value="">All modules</option>' + modules.map((module) => `<option value="${module}">${module}</option>`).join("");
  }

  function statusForEndpoint(endpoint, latestResult) {
    if (!latestResult) {
      return "untested";
    }
    if (latestResult.status === "pass") {
      return latestResult.test_type === "auth" ? "warning" : "healthy";
    }
    if (latestResult.status === "warn") {
      return "warning";
    }
    return "failed";
  }

  function renderTable(endpoints, results = []) {
    const search = document.getElementById("endpoint-search").value.toLowerCase();
    const moduleFilter = document.getElementById("module-filter").value;
    const statusFilter = document.getElementById("status-filter").value;
    const tbody = document.getElementById("endpoint-table");
    const latestByEndpoint = new Map();
    for (const result of results) {
      latestByEndpoint.set(`${result.method} ${result.path}`, result);
    }
    const filtered = endpoints.filter((endpoint) => {
      const haystack = `${endpoint.method} ${endpoint.path} ${endpoint.module} ${endpoint.summary}`.toLowerCase();
      const latest = latestByEndpoint.get(endpointKey(endpoint));
      const status = statusForEndpoint(endpoint, latest);
      if (search && !haystack.includes(search)) return false;
      if (moduleFilter && endpoint.module !== moduleFilter) return false;
      if (statusFilter && status !== statusFilter) return false;
      return true;
    });

    tbody.innerHTML = filtered.map((endpoint) => {
      const latest = latestByEndpoint.get(endpointKey(endpoint));
      const status = statusForEndpoint(endpoint, latest);
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      return `
        <tr class="cursor-pointer hover:bg-white/5" data-endpoint-key="${endpointKey(endpoint)}">
          <td class="px-4 py-4"><span class="method-badge ${methodClass(endpoint.method)}">${endpoint.method}</span></td>
          <td class="px-4 py-4">
            <div class="font-medium text-white">${endpoint.path}</div>
            <div class="mt-1 text-xs text-slate-400">${endpoint.summary || endpoint.operation_id || "No summary"}</div>
          </td>
          <td class="px-4 py-4 text-slate-300">${endpoint.module || "api"}</td>
          <td class="px-4 py-4">${endpoint.auth_required ? "Protected" : "Public"}</td>
          <td class="px-4 py-4"><span class="health-pill ${healthClass(status)}">${statusLabel}</span></td>
          <td class="px-4 py-4 text-slate-300">${latest ? `${Number(latest.response_time_ms || 0).toFixed(1)} ms` : "-"}</td>
          <td class="px-4 py-4 text-slate-400">${latest ? new Date(latest.created_at || Date.now()).toLocaleString() : "Untested"}</td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll("tr").forEach((row) => {
      row.addEventListener("click", async () => {
        const key = row.dataset.endpointKey;
        selectedEndpointKey = key;
        const selected = results.find((item) => `${item.method} ${item.path}` === key);
        if (selected) {
          await inspectResult(selected);
        }
      });
    });
  }

  async function inspectResult(result) {
    document.getElementById("request-inspector").textContent = window.ApiDashboard.formatJson({
      headers: result.request_headers,
      body: result.request_body,
    });
    document.getElementById("response-inspector").textContent = window.ApiDashboard.formatJson({
      headers: result.response_headers,
      body: result.response_body,
      http_status: result.http_status,
    });
    document.getElementById("error-inspector").textContent = window.ApiDashboard.formatJson({
      error_message: result.error_message,
      stack_trace: result.stack_trace,
      validation_errors: result.validation_errors,
    });
  }

  async function loadSummary() {
    const response = await window.ApiDashboard.apiFetch("/sanity-dashboard/api/summary/");
    const data = await response.json();
    activeProfile = data.profile;
    window.ApiDashboard.setTokens(window.ApiDashboard.getTokens());
    renderStats(data.metrics);
    if (data.discovery_error) {
      document.getElementById("discovery-output").textContent = data.discovery_error;
    }
    document.getElementById("base-url").value = activeProfile.base_url || window.location.origin;
    document.getElementById("schema-url").value = activeProfile.schema_url || `${window.location.origin}/api/schema/?format=json`;
    renderSummaryProfile(data.profile);
    return data;
  }

  async function loadBlueprint() {
    const response = await window.ApiDashboard.apiFetch("/sanity-dashboard/api/blueprint/");
    const data = await response.json();
    if (!response.ok) {
      document.getElementById("blueprint-output").textContent = data.detail || data.error || "Blueprint load failed";
      return null;
    }
    renderBlueprint(data);
    document.getElementById("blueprint-output").textContent = window.ApiDashboard.formatJson({
      database_apps: data.database?.apps?.length || 0,
      workflow_steps: data.workflow?.steps?.length || 0,
      architecture_layers: data.architecture?.layers?.length || 0,
      routes: data.architecture?.routes?.length || 0,
    });
    return data;
  }

  function renderSummaryProfile(profile) {
    const sidebarUser = document.getElementById("sidebar-user");
    if (sidebarUser && profile) {
      sidebarUser.textContent = profile.name ? `${profile.name} profile` : "API profile";
    }
  }

  async function discoverEndpoints() {
    const payload = {
      base_url: document.getElementById("base-url").value,
      schema_url: document.getElementById("schema-url").value,
      backend_type: document.getElementById("backend-type").value,
      profile_id: activeProfile ? activeProfile.id : null,
      auth_header_prefix: "Bearer",
    };
    const response = await window.ApiDashboard.apiFetch("/sanity-dashboard/api/discover/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      document.getElementById("discovery-output").textContent = data.detail || data.error || "Discovery failed";
      return;
    }
    endpointRegistry = data.endpoints || [];
    renderModules(endpointRegistry);
    renderTable(endpointRegistry, currentResults);
    document.getElementById("discovery-output").textContent = window.ApiDashboard.formatJson(data.registry || data);
  }

  async function runTests(scope, extra = {}) {
    if (!activeProfile) {
      await loadSummary();
    }
    const payload = {
      profile_id: activeProfile ? activeProfile.id : null,
      base_url: document.getElementById("base-url").value,
      schema_url: document.getElementById("schema-url").value,
      backend_type: document.getElementById("backend-type").value,
      access_token: window.ApiDashboard.getTokens().access,
      refresh_token: window.ApiDashboard.getTokens().refresh,
      scope,
      endpoint: selectedEndpointKey,
      ...extra,
    };
    document.getElementById("runner-output").textContent = "Running...";
    const response = await window.ApiDashboard.apiFetch("/sanity-dashboard/api/run/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      document.getElementById("runner-output").textContent = data.detail || data.error || "Run failed";
      return;
    }
    currentRunId = data.run_id;
    document.getElementById("run-progress-label").textContent = `${data.progress || 0}%`;
    document.getElementById("run-progress-bar").style.width = `${data.progress || 0}%`;
    document.getElementById("runner-output").textContent = window.ApiDashboard.formatJson(data);
    await loadRunDetail(currentRunId);
    await loadSummary();
  }

  async function loadRunDetail(runId) {
    const response = await window.ApiDashboard.apiFetch(`/sanity-dashboard/api/run/${runId}/`);
    const data = await response.json();
    currentResults = data.results || [];
    renderTable(endpointRegistry, currentResults);
    if (currentResults.length) {
      await inspectResult(currentResults[0]);
    }
  }

  async function exportRun(format) {
    if (!currentRunId) return;
    const response = await window.ApiDashboard.apiFetch(`/sanity-dashboard/api/run/${currentRunId}/export/?format=${format}`);
    if (format === "json") {
      const data = await response.json();
      document.getElementById("runner-output").textContent = window.ApiDashboard.formatJson(data);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `api-sanity-run-${currentRunId}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function inspectTokenViewer() {
    const response = await window.ApiDashboard.apiFetch("/sanity-dashboard/api/token-viewer/", {
      method: "POST",
      body: JSON.stringify({
        access_token: document.getElementById("access-token").value || window.ApiDashboard.getTokens().access,
        refresh_token: document.getElementById("refresh-token").value || window.ApiDashboard.getTokens().refresh,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      document.getElementById("token-output").textContent = data.detail || data.error || "Token inspection failed";
      return;
    }
    document.getElementById("token-output").textContent = window.ApiDashboard.formatJson(data);
  }

  async function copyResponse() {
    const text = document.getElementById("response-inspector").textContent;
    await navigator.clipboard.writeText(text || "");
  }

  function bindEvents() {
    document.getElementById("refresh-summary").addEventListener("click", loadSummary);
    document.getElementById("discover-endpoints").addEventListener("click", discoverEndpoints);
    document.getElementById("run-all").addEventListener("click", () => runTests("all"));
    document.getElementById("run-module").addEventListener("click", () => runTests("module", { module: document.getElementById("module-filter").value || endpointRegistry[0]?.module }));
    document.getElementById("run-single").addEventListener("click", () => runTests("single", { endpoint: selectedEndpointKey || (endpointRegistry[0] ? `${endpointRegistry[0].method} ${endpointRegistry[0].path}` : null) }));
    document.getElementById("retest-failed").addEventListener("click", () => runTests("failed", { failed_from_run_id: currentRunId }));
    document.getElementById("cancel-run").addEventListener("click", async () => {
      if (!currentRunId) return;
      await window.ApiDashboard.apiFetch(`/sanity-dashboard/api/run/${currentRunId}/cancel/`, { method: "POST" });
    });
    document.getElementById("inspect-token").addEventListener("click", inspectTokenViewer);
    document.getElementById("copy-response").addEventListener("click", copyResponse);
    document.getElementById("endpoint-search").addEventListener("input", () => renderTable(endpointRegistry, currentResults));
    document.getElementById("module-filter").addEventListener("change", () => renderTable(endpointRegistry, currentResults));
    document.getElementById("status-filter").addEventListener("change", () => renderTable(endpointRegistry, currentResults));
    document.querySelectorAll("[data-section]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-section]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        const target = document.getElementById(button.dataset.section);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    bindEvents();
    try {
      await loadSummary();
      document.getElementById("runner-output").textContent = "Ready.";
    } catch (error) {
      document.getElementById("runner-output").textContent = error.message;
    }
    try {
      await loadBlueprint();
    } catch (error) {
      document.getElementById("blueprint-output").textContent = error.message;
    }
    try {
      await discoverEndpoints();
    } catch (error) {
      document.getElementById("discovery-output").textContent = error.message;
    }
  });
})();
