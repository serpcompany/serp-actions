#!/usr/bin/env node

import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  generatedData,
  hasGitHubToken,
  normalizeAppName,
  readRepoList,
  stableJson,
  titleFromSlug,
  validateConfig,
  validateGeneratedData,
} from "./sync-source-repo-data-json.mjs";

const DEFAULT_CONFIG_PATH = "data/source-repo-data-json-config.json";
const DEFAULT_REPO_LIST_PATH = "data/source-repo-downloaders.txt";
const DEFAULT_SCHEMA_PATH = "data/source-repo-data-json-config.schema.json";
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 5173;
const EDITABLE_FIELDS = ["app_name", "serply_link", "github_source_repo"];
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const SYNC_SCRIPT_PATH = path.join(SCRIPT_DIR, "sync-source-repo-data-json.mjs");

function parseArgs(argv) {
  const args = {
    configPath: process.env.CONFIG_PATH || DEFAULT_CONFIG_PATH,
    repoListPath: process.env.REPO_LIST_PATH || DEFAULT_REPO_LIST_PATH,
    schemaPath: process.env.SCHEMA_PATH || DEFAULT_SCHEMA_PATH,
    host: process.env.HOST || DEFAULT_HOST,
    port: Number(process.env.PORT || DEFAULT_PORT),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config") {
      args.configPath = argv[++index] ?? "";
    } else if (arg === "--repo-list") {
      args.repoListPath = argv[++index] ?? "";
    } else if (arg === "--schema") {
      args.schemaPath = argv[++index] ?? "";
    } else if (arg === "--host") {
      args.host = argv[++index] ?? "";
    } else if (arg === "--port") {
      args.port = Number(argv[++index] ?? "");
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.configPath) throw new Error("--config cannot be empty");
  if (!args.repoListPath) throw new Error("--repo-list cannot be empty");
  if (!args.schemaPath) throw new Error("--schema cannot be empty");
  if (!args.host) throw new Error("--host cannot be empty");
  if (!Number.isInteger(args.port) || args.port < 0 || args.port > 65535) {
    throw new Error("--port must be an integer from 0 to 65535");
  }

  return args;
}

async function readJsonFile(filePath, description) {
  const raw = await readFile(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${description} is malformed JSON: ${error.message}`);
  }
}

async function loadState(args) {
  const [targets, config, schema] = await Promise.all([
    readRepoList(args.repoListPath),
    readJsonFile(args.configPath, args.configPath),
    readJsonFile(args.schemaPath, args.schemaPath),
  ]);
  validateConfig(config, args.configPath);
  validateSyncInputs(targets, config);

  const configWithoutOverrides = {
    ...config,
    overrides: {},
  };

  return {
    targets: targets.map((target) => {
      const appName = normalizeAppName(titleFromSlug(target.repo), config);
      return {
        fullName: target.fullName,
        owner: target.owner,
        repo: target.repo,
        url: target.url,
        generatedData: generatedData(target, appName, configWithoutOverrides),
        currentData: generatedData(target, appName, config),
      };
    }),
    config,
    schema,
    paths: {
      config: args.configPath,
      repoList: args.repoListPath,
      schema: args.schemaPath,
    },
    editableFields: EDITABLE_FIELDS,
  };
}

function validateSyncInputs(targets, config) {
  for (const target of targets) {
    const appName = normalizeAppName(titleFromSlug(target.repo), config);
    validateGeneratedData(generatedData(target, appName, config), target, "validated generated data.json");
  }
}

function normalizeOverrides(input, targets, config) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Request body must include an overrides object");
  }

  const targetsByFullName = new Map(targets.map((target) => [target.fullName, target]));
  const configWithoutOverrides = {
    ...config,
    overrides: {},
  };
  const overrides = {};
  for (const [fullName, fields] of Object.entries(input)) {
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
      throw new Error(`overrides.${fullName} must be an object`);
    }

    const cleaned = {};
    for (const field of EDITABLE_FIELDS) {
      const rawValue = fields[field];
      if (rawValue === undefined || rawValue === null) continue;
      if (typeof rawValue !== "string") {
        throw new Error(`overrides.${fullName}.${field} must be a string`);
      }
      const value = rawValue.trim();
      if (!value) continue;

      const target = targetsByFullName.get(fullName);
      if (target) {
        const appName = normalizeAppName(titleFromSlug(target.repo), config);
        const defaults = generatedData(target, appName, configWithoutOverrides);
        if (value === defaults[field]) continue;
      }

      cleaned[field] = value;
    }

    const unsupported = Object.keys(fields).filter((field) => !EDITABLE_FIELDS.includes(field));
    if (unsupported.length > 0) {
      throw new Error(`overrides.${fullName} has unsupported key: ${unsupported[0]}`);
    }

    if (Object.keys(cleaned).length > 0) {
      overrides[fullName] = cleaned;
    }
  }

  return overrides;
}

async function saveOverrides(args, requestBody) {
  const targets = await readRepoList(args.repoListPath);
  const existingConfig = await readJsonFile(args.configPath, args.configPath);
  validateConfig(existingConfig, args.configPath);

  const nextConfig = {
    ...existingConfig,
    overrides: normalizeOverrides(requestBody.overrides, targets, existingConfig),
  };

  validateConfig(nextConfig, args.configPath);
  validateSyncInputs(targets, nextConfig);
  await writeFile(args.configPath, stableJson(nextConfig), "utf8");

  const nextState = await loadState(args);
  return {
    ok: true,
    message: `Saved local config and validated ${targets.length} repo entries. Remote data.json files are unchanged until the sync job runs with write access.`,
    suggestedCommand: "node scripts/sync-source-repo-data-json.mjs --validate",
    state: nextState,
  };
}

async function syncRepo(args, requestBody) {
  if (!hasGitHubToken()) {
    throw new Error(
      "A GitHub token is required to sync remote data.json files. Create /Users/devin/dev/repos/serp-actions/.env.local with SERPCOMPANY_SOURCE_REPO_DATA_JSON_TOKEN=your_token, or run gh auth login, then restart this editor server.",
    );
  }

  const fullName = String(requestBody.repo ?? "").trim();
  const targets = await readRepoList(args.repoListPath);
  if (!targets.some((target) => target.fullName === fullName)) {
    throw new Error(`Repo is not listed in ${args.repoListPath}: ${fullName}`);
  }

  await saveOverrides(args, requestBody);

  const { stdout, stderr } = await execFilePromise(process.execPath, [
    SYNC_SCRIPT_PATH,
    "--write",
    "--repo",
    fullName,
    "--config",
    args.configPath,
    "--repo-list",
    args.repoListPath,
  ]);

  return {
    ok: true,
    message: `Synced remote data.json for ${fullName}.`,
    output: [stdout.trim(), stderr.trim()].filter(Boolean).join("\n"),
    state: await loadState(args),
  };
}

function execFilePromise(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd: PROJECT_ROOT, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        error.message = [error.message, stdout, stderr].filter(Boolean).join("\n");
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function readRequestJson(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > 1_000_000) {
      throw new Error("Request body is too large");
    }
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString("utf8");
  if (!body.trim()) return {};
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`Request body is malformed JSON: ${error.message}`);
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendHtml(response) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(INDEX_HTML);
}

async function routeRequest(args, request, response) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  try {
    if (request.method === "GET" && url.pathname === "/") {
      sendHtml(response);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/state") {
      sendJson(response, 200, await loadState(args));
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/save") {
      const body = await readRequestJson(request);
      sendJson(response, 200, await saveOverrides(args, body));
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/sync") {
      const body = await readRequestJson(request);
      sendJson(response, 200, await syncRepo(args, body));
      return;
    }

    sendJson(response, 404, { ok: false, error: "Not found" });
  } catch (error) {
    sendJson(response, 400, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      suggestedCommand: "node scripts/sync-source-repo-data-json.mjs --validate",
    });
  }
}

async function startServer(args) {
  const server = createServer((request, response) => {
    routeRequest(args, request, response).catch((error) => {
      sendJson(response, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  });

  await listen(server, args);

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : args.port;
  console.log(`Source repo data.json config editor: http://${args.host}:${port}`);
  console.log("Press Ctrl+C to stop.");
}

async function listen(server, args) {
  try {
    await listenOnce(server, args.port, args.host);
  } catch (error) {
    if (error?.code !== "EADDRINUSE" || args.port === 0) {
      throw error;
    }
    console.warn(`Port ${args.port} is in use; using an available port instead.`);
    await listenOnce(server, 0, args.host);
  }
}

function listenOnce(server, port, host) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
}

const INDEX_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Source Repo data.json Config Editor</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --ink: #1e2329;
      --muted: #67717f;
      --line: #d8dee6;
      --focus: #0f766e;
      --focus-soft: #e0f2f1;
      --danger: #b42318;
      --danger-soft: #fde8e7;
      --ok: #146c43;
      --ok-soft: #e5f4ec;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    header {
      border-bottom: 1px solid var(--line);
      background: var(--panel);
      padding: 16px 24px;
    }
    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0;
    }
    main {
      display: grid;
      grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
      min-height: calc(100vh - 65px);
    }
    aside {
      border-right: 1px solid var(--line);
      background: var(--panel);
      padding: 16px;
      overflow: auto;
    }
    section {
      padding: 20px 24px 32px;
      overflow: auto;
    }
    label {
      display: block;
      margin: 0 0 6px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    input, select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      color: var(--ink);
      font: inherit;
      padding: 9px 10px;
    }
    input:focus, select:focus, button:focus {
      border-color: var(--focus);
      box-shadow: 0 0 0 3px var(--focus-soft);
      outline: none;
    }
    .search {
      margin-bottom: 12px;
    }
    .repo-list {
      display: grid;
      gap: 4px;
    }
    .repo-button {
      width: 100%;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      color: var(--ink);
      cursor: pointer;
      padding: 8px 10px;
      text-align: left;
    }
    .repo-button:hover {
      background: #f1f4f7;
    }
    .repo-button.active {
      border-color: var(--focus);
      background: var(--focus-soft);
    }
    .repo-button.changed::after {
      content: " edited";
      color: var(--focus);
      font-size: 12px;
      font-weight: 700;
    }
    .editor {
      max-width: 920px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
    }
    .repo-title {
      min-width: 0;
    }
    .repo-title h2 {
      margin: 0 0 2px;
      font-size: 18px;
      letter-spacing: 0;
    }
    .repo-title a {
      color: var(--muted);
      overflow-wrap: anywhere;
      text-decoration: none;
    }
    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    button.primary {
      border: 1px solid var(--focus);
      border-radius: 6px;
      background: var(--focus);
      color: #fff;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
      min-height: 38px;
      padding: 8px 13px;
    }
    button.secondary {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      color: var(--ink);
      cursor: pointer;
      font: inherit;
      min-height: 38px;
      padding: 8px 13px;
    }
    .field-grid {
      display: grid;
      gap: 14px;
    }
    .field {
      border-top: 1px solid var(--line);
      padding-top: 14px;
    }
    .hint {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 13px;
    }
    .status {
      border-radius: 6px;
      margin-top: 18px;
      padding: 12px 14px;
      white-space: pre-wrap;
    }
    .status.ok {
      background: var(--ok-soft);
      color: var(--ok);
    }
    .status.error {
      background: var(--danger-soft);
      color: var(--danger);
    }
    .empty {
      color: var(--muted);
      margin-top: 40px;
    }
    code {
      background: #eef1f4;
      border-radius: 4px;
      padding: 2px 4px;
    }
    @media (max-width: 760px) {
      main {
        grid-template-columns: 1fr;
      }
      aside {
        border-right: 0;
        border-bottom: 1px solid var(--line);
        max-height: 42vh;
      }
      .toolbar {
        align-items: stretch;
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Source Repo data.json Config Editor</h1>
  </header>
  <main>
    <aside>
      <label for="search">Repos</label>
      <input id="search" class="search" type="search" placeholder="Search owner/repo">
      <div id="repoList" class="repo-list"></div>
    </aside>
    <section>
      <div id="editor" class="editor">
        <p class="empty">Loading config...</p>
      </div>
    </section>
  </main>
  <script>
    const editableFields = ["app_name", "serply_link", "github_source_repo"];
    let state = null;
    let overrides = {};
    let selectedRepo = "";
    let filterText = "";

    const repoList = document.querySelector("#repoList");
    const search = document.querySelector("#search");
    const editor = document.querySelector("#editor");

    function fieldDescription(field) {
      return state?.schema?.properties?.overrides?.additionalProperties?.properties?.[field]?.description || "";
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]);
    }

    function currentOverride(fullName) {
      return overrides[fullName] || {};
    }

    function currentFieldValue(target, field) {
      const override = currentOverride(target.fullName);
      if (Object.prototype.hasOwnProperty.call(override, field)) {
        return override[field];
      }
      return target.currentData?.[field] || "";
    }

    function generatedFieldValue(target, field) {
      return target.generatedData?.[field] || "";
    }

    function hasOverride(fullName) {
      return Object.values(currentOverride(fullName)).some((value) => String(value || "").trim());
    }

    function renderRepoList() {
      const normalized = filterText.trim().toLowerCase();
      const targets = state.targets.filter((target) => target.fullName.toLowerCase().includes(normalized));
      repoList.innerHTML = targets.map((target) => {
        const classes = [
          "repo-button",
          target.fullName === selectedRepo ? "active" : "",
          hasOverride(target.fullName) ? "changed" : "",
        ].filter(Boolean).join(" ");
        return '<button class="' + classes + '" type="button" data-repo="' + escapeHtml(target.fullName) + '">' +
          escapeHtml(target.fullName) +
          '</button>';
      }).join("");
    }

    function renderEditor() {
      const target = state.targets.find((item) => item.fullName === selectedRepo);
      if (!target) {
        editor.innerHTML = '<p class="empty">Select a repo to edit overrides.</p>';
        return;
      }

      const fields = editableFields.map((field) => {
        const value = currentFieldValue(target, field);
        const generatedValue = generatedFieldValue(target, field);
        const isOverride = Object.prototype.hasOwnProperty.call(currentOverride(target.fullName), field);
        const description = fieldDescription(field);
        return [
          '<div class="field">',
          '<label for="field-' + escapeHtml(field) + '">' + escapeHtml(field) + '</label>',
          '<input id="field-' + escapeHtml(field) + '" data-field="' + escapeHtml(field) +
            '" data-generated="' + escapeHtml(generatedValue) + '" value="' + escapeHtml(value) + '">',
          '<p class="hint">' +
            (description ? escapeHtml(description) + ' ' : '') +
            (isOverride ? 'This field is saved as an override.' : 'Showing current generated data; unchanged values are not saved as overrides.') +
            '</p>',
          '</div>',
        ].join("");
      }).join("");

      editor.innerHTML = [
        '<div class="toolbar">',
        '<div class="repo-title">',
        '<h2>' + escapeHtml(target.fullName) + '</h2>',
        '<a href="' + escapeHtml(target.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(target.url) + '</a>',
        '</div>',
        '<div class="actions">',
        '<button id="clearRepo" class="secondary" type="button">Clear Repo Overrides</button>',
        '<button id="save" class="primary" type="button">Save Config</button>',
        '<button id="syncRepo" class="primary" type="button">Sync Remote data.json</button>',
        '</div>',
        '</div>',
        '<div class="field-grid">' + fields + '</div>',
        '<div id="status"></div>',
      ].join("");
    }

    function setStatus(kind, message) {
      const status = document.querySelector("#status");
      if (!status) return;
      status.className = "status " + kind;
      status.textContent = message;
    }

    function updateField(field, value) {
      const target = state.targets.find((item) => item.fullName === selectedRepo);
      const generatedValue = target ? generatedFieldValue(target, field) : "";
      const trimmedValue = String(value || "").trim();
      const next = { ...currentOverride(selectedRepo) };

      if (!trimmedValue || trimmedValue === generatedValue) {
        delete next[field];
      } else {
        next[field] = value;
      }

      for (const key of editableFields) {
        if (!String(next[key] || "").trim()) delete next[key];
      }
      if (Object.keys(next).length === 0) {
        delete overrides[selectedRepo];
      } else {
        overrides[selectedRepo] = next;
      }
      renderRepoList();
    }

    async function save() {
      setStatus("ok", "Saving...");
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus("error", (payload.error || "Save failed") + "\n\nSuggested check:\n" + (payload.suggestedCommand || "node scripts/sync-source-repo-data-json.mjs --validate"));
        return;
      }
      state = payload.state;
      overrides = structuredClone(state.config.overrides || {});
      renderRepoList();
      renderEditor();
      setStatus("ok", payload.message + "\n\nSuggested check:\n" + payload.suggestedCommand);
      return payload;
    }

    async function syncRemoteRepo() {
      setStatus("ok", "Saving config, then syncing remote data.json...");
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: selectedRepo, overrides }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus("error", payload.error || "Remote sync failed");
        return;
      }
      state = payload.state;
      overrides = structuredClone(state.config.overrides || {});
      renderRepoList();
      renderEditor();
      setStatus("ok", payload.message + (payload.output ? "\n\n" + payload.output : ""));
    }

    repoList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-repo]");
      if (!button) return;
      selectedRepo = button.dataset.repo;
      renderRepoList();
      renderEditor();
    });

    search.addEventListener("input", () => {
      filterText = search.value;
      renderRepoList();
    });

    editor.addEventListener("input", (event) => {
      const input = event.target.closest("[data-field]");
      if (!input) return;
      updateField(input.dataset.field, input.value);
    });

    editor.addEventListener("click", (event) => {
      if (event.target.id === "clearRepo") {
        delete overrides[selectedRepo];
        renderRepoList();
        renderEditor();
      }
      if (event.target.id === "save") {
        save().catch((error) => setStatus("error", error.message));
      }
      if (event.target.id === "syncRepo") {
        syncRemoteRepo().catch((error) => setStatus("error", error.message));
      }
    });

    fetch("/api/state")
      .then((response) => response.json())
      .then((payload) => {
        if (payload.ok === false) throw new Error(payload.error);
        state = payload;
        overrides = structuredClone(state.config.overrides || {});
        selectedRepo = state.targets[0]?.fullName || "";
        renderRepoList();
        renderEditor();
      })
      .catch((error) => {
        editor.innerHTML = '<div class="status error">' + escapeHtml(error.message) + '</div>';
      });
  </script>
</body>
</html>`;

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = parseArgs(process.argv.slice(2));
  await startServer(args);
}
