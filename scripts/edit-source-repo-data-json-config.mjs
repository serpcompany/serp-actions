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
      align-items: center;
      border-bottom: 1px solid var(--line);
      background: var(--panel);
      display: flex;
      gap: 12px;
      justify-content: space-between;
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
    main.sidebar-collapsed {
      grid-template-columns: 0 minmax(0, 1fr);
    }
    aside {
      border-right: 1px solid var(--line);
      background: var(--panel);
      padding: 16px;
      overflow: auto;
    }
    main.sidebar-collapsed aside {
      border-right: 0;
      overflow: hidden;
      padding: 0;
    }
    main.sidebar-collapsed .sidebar-controls,
    main.sidebar-collapsed .repo-list {
      display: none;
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
    .sidebar-controls {
      display: grid;
      gap: 12px;
      margin-bottom: 12px;
    }
    .segmented {
      border: 1px solid var(--line);
      border-radius: 6px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      overflow: hidden;
    }
    .segmented button {
      border: 0;
      border-radius: 0;
      background: #fff;
      color: var(--ink);
      cursor: pointer;
      font: inherit;
      min-height: 34px;
      padding: 7px 10px;
    }
    .segmented button + button {
      border-left: 1px solid var(--line);
    }
    .segmented button.active {
      background: var(--focus);
      color: #fff;
      font-weight: 700;
    }
    .quick-filter {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .quick-filter button {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      color: var(--ink);
      cursor: pointer;
      font: inherit;
      min-height: 32px;
      padding: 5px 9px;
    }
    .quick-filter button.active {
      border-color: var(--focus);
      background: var(--focus-soft);
      color: var(--focus);
      font-weight: 700;
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
    .repo-button.dirty::after {
      content: " dirty";
      color: var(--danger);
      font-size: 12px;
      font-weight: 700;
    }
    .editor {
      max-width: 920px;
    }
    .table-view {
      max-width: none;
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
    .table-toolbar {
      align-items: flex-start;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .summary {
      color: var(--muted);
      margin: 3px 0 0;
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
    button.danger {
      border: 1px solid var(--danger);
      border-radius: 6px;
      background: #fff;
      color: var(--danger);
      cursor: pointer;
      font: inherit;
      min-height: 38px;
      padding: 8px 13px;
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
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
    .table-status {
      margin: 0 0 12px;
    }
    .status.ok {
      background: var(--ok-soft);
      color: var(--ok);
    }
    .status.error {
      background: var(--danger-soft);
      color: var(--danger);
    }
    .activity {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      margin: 0 0 12px;
      padding: 10px 12px;
    }
    .activity h3 {
      color: var(--muted);
      font-size: 12px;
      letter-spacing: 0;
      margin: 0 0 8px;
      text-transform: uppercase;
    }
    .activity-list {
      display: grid;
      gap: 5px;
      margin: 0;
      padding: 0;
    }
    .activity-item {
      align-items: baseline;
      display: grid;
      gap: 8px;
      grid-template-columns: 74px minmax(0, 1fr);
      list-style: none;
    }
    .activity-time {
      color: var(--muted);
      font-variant-numeric: tabular-nums;
      font-size: 12px;
    }
    .activity-text {
      overflow-wrap: anywhere;
    }
    .table-wrap {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      overflow: auto;
      max-height: calc(100vh - 190px);
      width: 100%;
    }
    table {
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
      min-width: 920px;
      width: 100%;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 6px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f4f7;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      position: sticky;
      text-transform: uppercase;
      top: 0;
      z-index: 1;
    }
    td.select-cell, th.select-cell {
      text-align: center;
      width: 38px;
    }
    th.repo-cell, td.repo-cell {
      background: inherit;
      left: 38px;
      position: sticky;
      z-index: 1;
    }
    th.repo-cell {
      background: #f1f4f7;
      z-index: 2;
    }
    th.select-cell, td.select-cell {
      background: inherit;
      left: 0;
      position: sticky;
      z-index: 1;
    }
    th.select-cell {
      background: #f1f4f7;
      z-index: 2;
    }
    td.action-cell, th.action-cell {
      text-align: right;
      width: 76px;
    }
    td.repo-cell {
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    .select-col {
      width: 38px;
    }
    .repo-col {
      width: clamp(190px, 24vw, 270px);
    }
    .data-col {
      width: clamp(180px, 21vw, 260px);
    }
    .status-col {
      width: 128px;
    }
    .action-col {
      width: 76px;
    }
    .data-cell input {
      min-width: 0;
      padding: 7px 8px;
    }
    .data-cell.saved-override input {
      border-color: var(--focus);
      background: var(--focus-soft);
    }
    .data-cell.dirty input {
      border-color: var(--danger);
      background: #fff8f7;
    }
    .row-selected {
      background: #f8fbff;
    }
    .status-pills {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
    }
    .pill {
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 7px;
    }
    .pill.override {
      background: var(--focus-soft);
      color: var(--focus);
    }
    .pill.dirty {
      background: var(--danger-soft);
      color: var(--danger);
    }
    .pill.selected {
      background: #eef1f4;
      color: var(--muted);
    }
    .pill.saved,
    .pill.synced {
      background: var(--ok-soft);
      color: var(--ok);
    }
    .pill.skipped {
      background: #eef1f4;
      color: var(--muted);
    }
    .pill.failed {
      background: var(--danger-soft);
      color: var(--danger);
    }
    .csv-input {
      display: none;
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
      main.sidebar-collapsed {
        grid-template-columns: 1fr;
      }
      aside {
        border-right: 0;
        border-bottom: 1px solid var(--line);
        max-height: 42vh;
      }
      main.sidebar-collapsed aside {
        border-bottom: 0;
        max-height: 0;
      }
      .toolbar {
        align-items: stretch;
        flex-direction: column;
      }
      .table-toolbar {
        align-items: stretch;
        flex-direction: column;
      }
      .table-wrap {
        max-height: calc(100vh - 260px);
      }
      table {
        min-width: 780px;
      }
      .repo-col {
        width: 190px;
      }
      .data-col {
        width: 170px;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Source Repo data.json Config Editor</h1>
    <button id="toggleSidebar" class="secondary" type="button" aria-expanded="true">Hide Sidebar</button>
  </header>
  <main id="appShell">
    <aside>
      <div class="sidebar-controls">
        <div>
          <label>View</label>
          <div class="segmented" role="group" aria-label="View mode">
            <button id="singleView" class="active" type="button">Single Repo</button>
            <button id="tableView" type="button">All Repos Table</button>
          </div>
        </div>
        <div>
          <label for="search">Repos</label>
          <input id="search" class="search" type="search" placeholder="Search owner/repo">
        </div>
        <div>
          <label>Filter</label>
          <div class="quick-filter" role="group" aria-label="Quick filter">
            <button class="active" type="button" data-filter="all">All</button>
            <button type="button" data-filter="overrides">Has Overrides</button>
            <button type="button" data-filter="dirty">Dirty</button>
          </div>
        </div>
      </div>
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
    const csvFields = ["repo", ...editableFields];
    let state = null;
    let overrides = {};
    let savedOverrides = {};
    let selectedRepo = "";
    let selectedRepos = new Set();
    let filterText = "";
    let quickFilter = "all";
    let viewMode = "single";
    let sidebarCollapsed = false;
    let activityLog = [];
    let repoActivity = {};

    const appShell = document.querySelector("#appShell");
    const repoList = document.querySelector("#repoList");
    const search = document.querySelector("#search");
    const editor = document.querySelector("#editor");
    const toggleSidebar = document.querySelector("#toggleSidebar");
    const singleView = document.querySelector("#singleView");
    const tableView = document.querySelector("#tableView");
    const quickFilterButtons = document.querySelectorAll("[data-filter]");

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

    function savedOverride(fullName) {
      return savedOverrides[fullName] || {};
    }

    function currentFieldValue(target, field) {
      const override = currentOverride(target.fullName);
      if (Object.prototype.hasOwnProperty.call(override, field)) {
        return override[field];
      }
      return generatedFieldValue(target, field);
    }

    function generatedFieldValue(target, field) {
      return target.generatedData?.[field] || "";
    }

    function hasOverride(fullName) {
      return Object.values(savedOverride(fullName)).some((value) => String(value || "").trim());
    }

    function normalizeOverrideFields(fields) {
      const cleaned = {};
      for (const field of editableFields) {
        const value = String(fields?.[field] || "").trim();
        if (value) cleaned[field] = value;
      }
      return cleaned;
    }

    function sameOverride(left, right) {
      return editableFields.every((field) => String(left?.[field] || "") === String(right?.[field] || ""));
    }

    function isDirty(fullName) {
      return !sameOverride(normalizeOverrideFields(currentOverride(fullName)), normalizeOverrideFields(savedOverride(fullName)));
    }

    function fieldIsDirty(target, field) {
      return String(currentOverride(target.fullName)?.[field] || "") !== String(savedOverride(target.fullName)?.[field] || "");
    }

    function filteredTargets() {
      const normalized = filterText.trim().toLowerCase();
      return state.targets.filter((target) => {
        const matchesSearch = target.fullName.toLowerCase().includes(normalized);
        if (!matchesSearch) return false;
        if (quickFilter === "overrides") return hasOverride(target.fullName);
        if (quickFilter === "dirty") return isDirty(target.fullName);
        return true;
      });
    }

    function renderRepoList() {
      const targets = filteredTargets();
      repoList.innerHTML = targets.map((target) => {
        const classes = [
          "repo-button",
          target.fullName === selectedRepo ? "active" : "",
          hasOverride(target.fullName) ? "changed" : "",
          isDirty(target.fullName) ? "dirty" : "",
        ].filter(Boolean).join(" ");
        return '<button class="' + classes + '" type="button" data-repo="' + escapeHtml(target.fullName) + '">' +
          escapeHtml(target.fullName) +
          '</button>';
      }).join("");
    }

    function render() {
      appShell.classList.toggle("sidebar-collapsed", sidebarCollapsed);
      toggleSidebar.textContent = sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar";
      toggleSidebar.setAttribute("aria-expanded", String(!sidebarCollapsed));
      singleView.classList.toggle("active", viewMode === "single");
      tableView.classList.toggle("active", viewMode === "table");
      renderRepoList();
      if (viewMode === "table") {
        renderTable();
      } else {
        renderEditor();
      }
    }

    function renderEditor() {
      editor.className = "editor";
      const target = state.targets.find((item) => item.fullName === selectedRepo);
      if (!target) {
        editor.innerHTML = '<p class="empty">Select a repo to edit overrides.</p>';
        return;
      }

      const fields = editableFields.map((field) => {
        const value = currentFieldValue(target, field);
        const generatedValue = generatedFieldValue(target, field);
        const isOverride = Object.prototype.hasOwnProperty.call(savedOverride(target.fullName), field);
        const dirty = fieldIsDirty(target, field);
        const description = fieldDescription(field);
        return [
          '<div class="field' + (dirty ? ' dirty' : '') + '">',
          '<label for="field-' + escapeHtml(field) + '">' + escapeHtml(field) + '</label>',
          '<input id="field-' + escapeHtml(field) + '" data-field="' + escapeHtml(field) +
            '" data-generated="' + escapeHtml(generatedValue) + '" value="' + escapeHtml(value) + '">',
          '<p class="hint">' +
            (description ? escapeHtml(description) + ' ' : '') +
            (dirty ? 'Changed locally and not saved yet.' : isOverride ? 'This field is saved as an override.' : 'Showing current generated data; unchanged values are not saved as overrides.') +
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
        '<button id="save" class="primary" type="button">Save All</button>',
        '<button id="syncRepo" class="primary" type="button" title="Sync remote data.json">Sync</button>',
        '</div>',
        '</div>',
        '<div class="field-grid">' + fields + '</div>',
        '<div id="status"></div>',
        activityHtml(),
      ].join("");
    }

    function renderTable() {
      editor.className = "editor table-view";
      const targets = filteredTargets();
      const selectedCount = selectedRepos.size;
      const dirtyCount = state.targets.filter((target) => isDirty(target.fullName)).length;
      const overrideCount = state.targets.filter((target) => hasOverride(target.fullName)).length;
      const allVisibleSelected = targets.length > 0 && targets.every((target) => selectedRepos.has(target.fullName));
      const rows = targets.map((target) => {
        const rowSelected = selectedRepos.has(target.fullName);
        const cells = editableFields.map((field) => {
          const classes = [
            "data-cell",
            Object.prototype.hasOwnProperty.call(savedOverride(target.fullName), field) ? "saved-override" : "",
            fieldIsDirty(target, field) ? "dirty" : "",
          ].filter(Boolean).join(" ");
          return '<td class="' + classes + '">' +
            '<input data-table-field="' + escapeHtml(field) + '" data-repo="' + escapeHtml(target.fullName) + '" value="' + escapeHtml(currentFieldValue(target, field)) + '" title="Generated default: ' + escapeHtml(generatedFieldValue(target, field)) + '">' +
            '</td>';
        }).join("");
        return [
          '<tr class="' + (rowSelected ? 'row-selected' : '') + '">',
          '<td class="select-cell"><input type="checkbox" data-select-repo="' + escapeHtml(target.fullName) + '"' + (rowSelected ? ' checked' : '') + '></td>',
          '<td class="repo-cell">' + escapeHtml(target.fullName) + '</td>',
          cells,
          '<td><div class="status-pills">' + statusPillHtml(target) + '</div></td>',
          '<td class="action-cell"><button class="secondary" type="button" data-sync-repo="' + escapeHtml(target.fullName) + '" title="Sync remote data.json">Sync</button></td>',
          '</tr>',
        ].join("");
      }).join("");

      editor.innerHTML = [
        '<div class="table-toolbar">',
        '<div>',
        '<h2>All Repos Table</h2>',
        '<p class="summary">' + targets.length + ' visible of ' + state.targets.length + ' repos. ' + overrideCount + ' have saved overrides. ' + dirtyCount + ' dirty.</p>',
        '</div>',
        '<div class="actions">',
        '<button id="exportCsv" class="secondary" type="button">Export CSV</button>',
        '<button id="importCsvButton" class="secondary" type="button">Import CSV</button>',
        '<input id="importCsv" class="csv-input" type="file" accept=".csv,text/csv">',
        '<button id="clearSelected" class="danger" type="button"' + (selectedCount ? '' : ' disabled') + '>Clear Selected Overrides</button>',
        '<button id="saveAll" class="primary" type="button">Save All</button>',
        '<button id="syncSelected" class="primary" type="button" title="Sync selected remote data.json">Sync</button>',
        '</div>',
        '</div>',
        '<div id="status" class="table-status"></div>',
        activityHtml(),
        '<div class="table-wrap">',
        '<table>',
        '<colgroup>',
        '<col class="select-col">',
        '<col class="repo-col">',
        '<col class="data-col">',
        '<col class="data-col">',
        '<col class="data-col">',
        '<col class="status-col">',
        '<col class="action-col">',
        '</colgroup>',
        '<thead><tr>',
        '<th class="select-cell"><input id="selectVisible" type="checkbox"' + (allVisibleSelected ? ' checked' : '') + '></th>',
        '<th class="repo-cell">repo</th>',
        '<th>app_name</th>',
        '<th>serply_link</th>',
        '<th>github_source_repo</th>',
        '<th>Status</th>',
        '<th class="action-cell">Action</th>',
        '</tr></thead>',
        '<tbody>' + (rows || '<tr><td colspan="7" class="empty">No repos match the current filters.</td></tr>') + '</tbody>',
        '</table>',
        '</div>',
      ].join("");
    }

    function statusPillHtml(target) {
      const latest = repoActivity[target.fullName];
      const pills = [
        hasOverride(target.fullName) ? '<span class="pill override">Override</span>' : '',
        isDirty(target.fullName) ? '<span class="pill dirty">Dirty</span>' : '',
        selectedRepos.has(target.fullName) ? '<span class="pill selected">Selected</span>' : '',
        latest ? '<span class="pill ' + escapeHtml(latest.kind) + '">' + escapeHtml(latest.label) + '</span>' : '',
      ].join("");
      return pills || '<span class="hint">Generated</span>';
    }

    function activityHtml() {
      const items = activityLog.slice(0, 8).map((item) => [
        '<li class="activity-item">',
        '<span class="activity-time">' + escapeHtml(item.time) + '</span>',
        '<span class="activity-text">' + escapeHtml(item.text) + '</span>',
        '</li>',
      ].join("")).join("");
      return [
        '<div class="activity">',
        '<h3>Recent Activity</h3>',
        '<ul id="activityLog" class="activity-list">',
        items || '<li class="activity-item"><span class="activity-time">--:--:--</span><span class="activity-text">No saves or syncs yet this session.</span></li>',
        '</ul>',
        '</div>',
      ].join("");
    }

    function addActivity(text) {
      activityLog = [
        {
          time: new Date().toLocaleTimeString(),
          text,
        },
        ...activityLog,
      ].slice(0, 25);
      const activity = document.querySelector(".activity");
      if (activity) activity.outerHTML = activityHtml();
    }

    function markRepoActivity(repo, kind, label) {
      repoActivity[repo] = { kind, label };
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

    function updateRepoField(fullName, field, value) {
      const target = state.targets.find((item) => item.fullName === fullName);
      const generatedValue = target ? generatedFieldValue(target, field) : "";
      const trimmedValue = String(value || "").trim();
      const next = { ...currentOverride(fullName) };

      if (!trimmedValue || trimmedValue === generatedValue) {
        delete next[field];
      } else {
        next[field] = value;
      }

      for (const key of editableFields) {
        if (!String(next[key] || "").trim()) delete next[key];
      }
      if (Object.keys(next).length === 0) {
        delete overrides[fullName];
      } else {
        overrides[fullName] = next;
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
      savedOverrides = structuredClone(state.config.overrides || {});
      for (const target of state.targets) {
        markRepoActivity(target.fullName, "saved", "Saved");
      }
      render();
      setStatus("ok", payload.message + "\n\nSuggested check:\n" + payload.suggestedCommand);
      addActivity("Saved local config and validated " + state.targets.length + " repo entries.");
      return payload;
    }

    async function syncRemoteRepo() {
      if (!selectedRepo) {
        setStatus("error", "Select a repo to sync.");
        return;
      }
      setStatus("ok", "Saving config, then syncing remote data.json...");
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: selectedRepo, overrides }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus("error", payload.error || "Remote sync failed");
        addActivity("Sync failed for " + selectedRepo + ": " + (payload.error || "Remote sync failed"));
        return;
      }
      state = payload.state;
      overrides = structuredClone(state.config.overrides || {});
      savedOverrides = structuredClone(state.config.overrides || {});
      markRepoActivity(selectedRepo, "synced", "Synced");
      render();
      setStatus("ok", payload.message + (payload.output ? "\n\n" + payload.output : ""));
      addActivity("Synced remote data.json for " + selectedRepo + ".");
    }

    async function syncSelectedRepos() {
      const repos = Array.from(selectedRepos);
      if (repos.length === 0) {
        setStatus("error", "Select at least one repo to sync.");
        return;
      }
      setStatus("ok", "Saving config, then syncing " + repos.length + " selected repo(s)...");
      const saved = await save();
      if (!saved) return;
      setStatus("ok", "Saved config. Starting remote sync for " + repos.length + " selected repo(s)...");
      const results = [];
      for (const [index, repo] of repos.entries()) {
        try {
          setStatus("ok", "Syncing " + (index + 1) + " of " + repos.length + ": " + repo);
          const response = await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo, overrides }),
          });
          const payload = await response.json();
          if (!response.ok || !payload.ok) {
            markRepoActivity(repo, "failed", "Failed");
            results.push({ repo, status: "failed", detail: payload.error || "Remote sync failed" });
            continue;
          }
          state = payload.state;
          overrides = structuredClone(state.config.overrides || {});
          savedOverrides = structuredClone(state.config.overrides || {});
          const output = payload.output || "";
          const skipped = /\bskipped\b/.test(output);
          const status = skipped ? "skipped" : "updated";
          markRepoActivity(repo, skipped ? "skipped" : "synced", skipped ? "Skipped" : "Synced");
          results.push({ repo, status, detail: payload.message });
        } catch (error) {
          markRepoActivity(repo, "failed", "Failed");
          results.push({ repo, status: "failed", detail: error.message });
        }
      }
      render();
      const counts = results.reduce((memo, result) => {
        memo[result.status] = (memo[result.status] || 0) + 1;
        return memo;
      }, {});
      const lines = results.map((result) => result.repo + ": " + result.status + (result.detail ? " - " + result.detail : ""));
      setStatus(counts.failed ? "error" : "ok", [
        "Sync selected complete.",
        "Updated: " + (counts.updated || 0),
        "Skipped: " + (counts.skipped || 0),
        "Failed: " + (counts.failed || 0),
        "",
        ...lines,
      ].join("\n"));
      addActivity(
        "Synced selected repos. Updated: " + (counts.updated || 0) +
          ", skipped: " + (counts.skipped || 0) +
          ", failed: " + (counts.failed || 0) + ".",
      );
    }

    function clearSelectedOverrides() {
      for (const repo of selectedRepos) {
        delete overrides[repo];
      }
      render();
      setStatus("ok", "Cleared local override values for " + selectedRepos.size + " selected repo(s). Click Save All to write the config.");
      addActivity("Cleared local override values for " + selectedRepos.size + " selected repo(s).");
    }

    function csvEscape(value) {
      const text = String(value ?? "");
      return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    }

    function parseCsv(text) {
      const rows = [];
      let row = [];
      let cell = "";
      let inQuotes = false;
      for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const next = text[index + 1];
        if (inQuotes) {
          if (char === '"' && next === '"') {
            cell += '"';
            index += 1;
          } else if (char === '"') {
            inQuotes = false;
          } else {
            cell += char;
          }
          continue;
        }
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          row.push(cell);
          cell = "";
        } else if (char === "\n") {
          row.push(cell);
          rows.push(row);
          row = [];
          cell = "";
        } else if (char !== "\r") {
          cell += char;
        }
      }
      if (inQuotes) throw new Error("CSV has an unterminated quoted field.");
      if (cell || row.length) {
        row.push(cell);
        rows.push(row);
      }
      return rows.filter((item) => item.some((value) => String(value).trim()));
    }

    function exportCsv() {
      const rows = [csvFields];
      for (const target of state.targets) {
        rows.push([
          target.fullName,
          ...editableFields.map((field) => currentFieldValue(target, field)),
        ]);
      }
      const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "source-repo-data-json-config.csv";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("ok", "Exported " + state.targets.length + " rows with columns: " + csvFields.join(", "));
      addActivity("Exported CSV for " + state.targets.length + " repo rows.");
    }

    async function importCsv(file) {
      if (!file) return;
      try {
        const rows = parseCsv(await file.text());
        const header = rows.shift() || [];
        if (header.length !== csvFields.length || !csvFields.every((field, index) => header[index] === field)) {
          throw new Error("CSV header must be exactly: " + csvFields.join(","));
        }
        const targetsByFullName = new Map(state.targets.map((target) => [target.fullName, target]));
        const seen = new Set();
        const importedOverrides = structuredClone(overrides);
        const errors = [];
        rows.forEach((row, index) => {
          const lineNumber = index + 2;
          if (row.length !== csvFields.length) {
            errors.push("Line " + lineNumber + ": expected " + csvFields.length + " columns, got " + row.length);
            return;
          }
          const fullName = row[0].trim();
          const target = targetsByFullName.get(fullName);
          if (!target) {
            errors.push("Line " + lineNumber + ": unknown repo " + fullName);
            return;
          }
          if (seen.has(fullName)) {
            errors.push("Line " + lineNumber + ": duplicate repo " + fullName);
            return;
          }
          seen.add(fullName);
          const next = {};
          editableFields.forEach((field, fieldIndex) => {
            const value = row[fieldIndex + 1].trim();
            if (value && value !== generatedFieldValue(target, field)) {
              next[field] = row[fieldIndex + 1];
            }
          });
          if (Object.keys(next).length === 0) {
            delete importedOverrides[fullName];
          } else {
            importedOverrides[fullName] = next;
          }
        });
        if (errors.length > 0) {
          throw new Error("CSV import failed. No changes were applied.\n\n" + errors.join("\n"));
        }
        overrides = importedOverrides;
        render();
        setStatus("ok", "Imported " + rows.length + " CSV row(s). Review dirty markers, then click Save All to write the config.");
        addActivity("Imported " + rows.length + " CSV row(s). Save All is still required.");
      } catch (error) {
        setStatus("error", error.message);
        addActivity("CSV import failed: " + error.message.split("\n")[0]);
      }
    }

    repoList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-repo]");
      if (!button) return;
      selectedRepo = button.dataset.repo;
      if (viewMode === "table") {
        selectedRepos.has(selectedRepo) ? selectedRepos.delete(selectedRepo) : selectedRepos.add(selectedRepo);
      }
      render();
    });

    search.addEventListener("input", () => {
      filterText = search.value;
      render();
    });

    toggleSidebar.addEventListener("click", () => {
      sidebarCollapsed = !sidebarCollapsed;
      render();
    });

    singleView.addEventListener("click", () => {
      viewMode = "single";
      render();
    });

    tableView.addEventListener("click", () => {
      viewMode = "table";
      render();
    });

    quickFilterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        quickFilter = button.dataset.filter;
        quickFilterButtons.forEach((item) => item.classList.toggle("active", item === button));
        render();
      });
    });

    editor.addEventListener("input", (event) => {
      const input = event.target.closest("[data-field]");
      if (input) {
        updateField(input.dataset.field, input.value);
        return;
      }
      const tableInput = event.target.closest("[data-table-field]");
      if (tableInput) {
        updateRepoField(tableInput.dataset.repo, tableInput.dataset.tableField, tableInput.value);
        const target = state.targets.find((item) => item.fullName === tableInput.dataset.repo);
        if (target) {
          tableInput.closest("td")?.classList.toggle("dirty", fieldIsDirty(target, tableInput.dataset.tableField));
          const statusPills = tableInput.closest("tr")?.querySelector(".status-pills");
          if (statusPills) statusPills.innerHTML = statusPillHtml(target);
        }
      }
    });

    editor.addEventListener("click", (event) => {
      if (event.target.id === "clearRepo") {
        delete overrides[selectedRepo];
        render();
      }
      if (event.target.id === "save" || event.target.id === "saveAll") {
        save().catch((error) => setStatus("error", error.message));
      }
      if (event.target.id === "syncRepo") {
        syncRemoteRepo().catch((error) => setStatus("error", error.message));
      }
      if (event.target.id === "exportCsv") {
        exportCsv();
      }
      if (event.target.id === "importCsvButton") {
        document.querySelector("#importCsv")?.click();
      }
      if (event.target.id === "clearSelected") {
        clearSelectedOverrides();
      }
      if (event.target.id === "syncSelected") {
        syncSelectedRepos().catch((error) => setStatus("error", error.message));
      }
      const syncButton = event.target.closest("[data-sync-repo]");
      if (syncButton) {
        selectedRepo = syncButton.dataset.syncRepo;
        syncRemoteRepo().catch((error) => setStatus("error", error.message));
      }
    });

    editor.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-select-repo]");
      if (checkbox) {
        checkbox.checked ? selectedRepos.add(checkbox.dataset.selectRepo) : selectedRepos.delete(checkbox.dataset.selectRepo);
        render();
        return;
      }
      if (event.target.id === "selectVisible") {
        const targets = filteredTargets();
        for (const target of targets) {
          event.target.checked ? selectedRepos.add(target.fullName) : selectedRepos.delete(target.fullName);
        }
        render();
        return;
      }
      if (event.target.id === "importCsv") {
        importCsv(event.target.files?.[0]);
        event.target.value = "";
      }
    });

    fetch("/api/state")
      .then((response) => response.json())
      .then((payload) => {
        if (payload.ok === false) throw new Error(payload.error);
        state = payload;
        overrides = structuredClone(state.config.overrides || {});
        savedOverrides = structuredClone(state.config.overrides || {});
        selectedRepo = state.targets[0]?.fullName || "";
        render();
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
