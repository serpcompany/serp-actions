#!/usr/bin/env node

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const OWNER = "serpcompany";
const API_BASE_URL = "https://api.github.com";
const DEFAULT_CONFIG_PATH = "data/source-repo-data-json-config.json";
const DEFAULT_REPO_LIST_PATH = "data/source-repo-downloaders.txt";
const DEFAULT_SUMMARY_PATH = "tmp/sync-source-repo-data-json-summary.json";
const COMMIT_MESSAGE = "Update source repo data.json";
const REQUIRED_FIELDS = ["github_source_repo", "serply_link", "app_name"];
const ALLOWED_TEMPLATE_TOKENS = new Set(["owner", "repo", "app_name"]);
const OWNER_REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

loadLocalEnv();

function parseArgs(argv) {
  const args = {
    dryRun: parseBoolean(process.env.DRY_RUN ?? "true"),
    limit: parseOptionalNumber(process.env.LIMIT ?? ""),
    configPath: process.env.CONFIG_PATH || DEFAULT_CONFIG_PATH,
    repoListPath: process.env.REPO_LIST_PATH || DEFAULT_REPO_LIST_PATH,
    repo: process.env.REPO || "",
    summaryPath: process.env.SUMMARY_PATH || DEFAULT_SUMMARY_PATH,
    selfTest: false,
    validateOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--write") {
      args.dryRun = false;
    } else if (arg === "--limit") {
      args.limit = parseOptionalNumber(argv[++index] ?? "");
    } else if (arg === "--config") {
      args.configPath = argv[++index] ?? "";
    } else if (arg === "--repo-list") {
      args.repoListPath = argv[++index] ?? "";
    } else if (arg === "--repo") {
      args.repo = argv[++index] ?? "";
    } else if (arg === "--summary") {
      args.summaryPath = argv[++index] ?? "";
    } else if (arg === "--self-test") {
      args.selfTest = true;
    } else if (arg === "--validate") {
      args.validateOnly = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.configPath) {
    throw new Error("--config cannot be empty");
  }
  if (!args.repoListPath) {
    throw new Error("--repo-list cannot be empty");
  }
  if (args.repo && !OWNER_REPO_PATTERN.test(args.repo) && !/^[A-Za-z0-9._-]+$/.test(args.repo)) {
    throw new Error("--repo must be a repo name or owner/repo");
  }
  if (!args.summaryPath) {
    throw new Error("--summary cannot be empty");
  }

  return args;
}

function loadLocalEnv(envPaths = [".env.local", ".env"]) {
  const loaded = [];
  for (const envPath of envPaths) {
    const absolutePath = path.resolve(PROJECT_ROOT, envPath);
    if (!existsSync(absolutePath)) continue;
    const content = readFileSync(absolutePath, "utf8");
    applyEnvFile(content);
    loaded.push(absolutePath);
  }
  return loaded;
}

function applyEnvFile(content) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = parseEnvValue(rawValue);
  }
}

function parseEnvValue(rawValue) {
  let value = rawValue.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  } else {
    value = value.replace(/\s+#.*$/, "");
  }
  return value.replace(/\\n/g, "\n");
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  throw new Error(`Invalid boolean value: ${value}`);
}

function parseOptionalNumber(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return undefined;
  const number = Number(normalized);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`Expected a positive integer limit, got: ${value}`);
  }
  return number;
}

async function readRepoList(repoListPath, limit) {
  const raw = await readFile(repoListPath, "utf8");
  const targets = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => repoTargetFromListEntry(line, repoListPath));

  const seen = new Set();
  const uniqueTargets = [];
  for (const target of targets) {
    if (seen.has(target.fullName)) {
      throw new Error(`Duplicate repo in ${repoListPath}: ${target.fullName}`);
    }
    seen.add(target.fullName);
    uniqueTargets.push(target);
  }

  return typeof limit === "number" ? uniqueTargets.slice(0, limit) : uniqueTargets;
}

async function readConfig(configPath) {
  const raw = await readFile(configPath, "utf8");
  let config;
  try {
    config = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${configPath} is malformed JSON: ${error.message}`);
  }
  validateConfig(config, configPath);
  return config;
}

function repoTargetFromListEntry(entry, repoListPath) {
  const githubUrlMatch = entry.match(/^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/?$/);
  if (githubUrlMatch) {
    const [, owner, repo] = githubUrlMatch;
    return repoTarget(owner, repo);
  }
  if (/^[A-Za-z0-9._-]+$/.test(entry)) return repoTarget(OWNER, entry);
  if (OWNER_REPO_PATTERN.test(entry)) {
    const [owner, repo] = entry.split("/");
    return repoTarget(owner, repo);
  }
  throw new Error(`Invalid repo entry in ${repoListPath}: ${entry}`);
}

function repoTarget(owner, repo) {
  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`,
  };
}

function extractFirstMarkdownH1(markdown) {
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\s*#(?!#)\s+(.+?)\s*#*\s*$/);
    if (match) return match[1].trim();
  }
  return "";
}

function cleanAppNameFromH1(h1) {
  return h1.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function titleFromSlug(repo) {
  return repo
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeAppName(appName, config) {
  let normalized = appName.trim();
  if (config.app_name?.strip_trailing_parenthetical) {
    normalized = normalized.replace(/\s*\([^)]*\)\s*$/, "").trim();
  }
  if (config.app_name?.ensure_video_before_downloader) {
    normalized = normalized.replace(/(?<!\bVideo\s)\bDownloader$/i, "Video Downloader");
  }
  return normalized;
}

function appNameFromReadme(markdown, repo, config) {
  const h1 = extractFirstMarkdownH1(markdown);
  const appName = h1 ? h1 : titleFromSlug(repo);
  return normalizeAppName(appName, config);
}

function renderTemplate(template, values) {
  return template.replace(/\{([a-z_]+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return values[key];
    }
    throw new Error(`Unknown template token: ${match}`);
  });
}

function generatedData(target, appName, config) {
  const values = {
    owner: target.owner,
    repo: target.repo,
    app_name: appName,
  };
  const data = {};
  for (const [key, template] of Object.entries(config.fields)) {
    if (typeof template !== "string") {
      throw new Error(`Config field template must be a string: ${key}`);
    }
    data[key] = renderTemplate(template, values);
  }
  return {
    ...data,
    ...(config.overrides?.[target.fullName] ?? {}),
  };
}

function validateConfig(config, configPath) {
  assertPlainJsonObject(config, configPath);
  assertAllowedKeys(config, ["$schema", "fields", "app_name", "overrides"], configPath);
  assertPlainJsonObject(config.fields, `${configPath}.fields`);
  assertAllowedKeys(config.fields, REQUIRED_FIELDS, `${configPath}.fields`);
  for (const field of REQUIRED_FIELDS) {
    if (typeof config.fields[field] !== "string" || config.fields[field].trim() === "") {
      throw new Error(`${configPath}.fields.${field} must be a non-empty string`);
    }
    validateTemplate(config.fields[field], `${configPath}.fields.${field}`);
  }

  assertPlainJsonObject(config.app_name, `${configPath}.app_name`);
  assertAllowedKeys(
    config.app_name,
    ["strip_trailing_parenthetical", "ensure_video_before_downloader"],
    `${configPath}.app_name`,
  );
  for (const key of ["strip_trailing_parenthetical", "ensure_video_before_downloader"]) {
    if (typeof config.app_name[key] !== "boolean") {
      throw new Error(`${configPath}.app_name.${key} must be a boolean`);
    }
  }

  assertPlainJsonObject(config.overrides, `${configPath}.overrides`);
  for (const [fullName, overrides] of Object.entries(config.overrides)) {
    if (!OWNER_REPO_PATTERN.test(fullName)) {
      throw new Error(`${configPath}.overrides key must be owner/repo: ${fullName}`);
    }
    assertPlainJsonObject(overrides, `${configPath}.overrides.${fullName}`);
    assertAllowedKeys(overrides, REQUIRED_FIELDS, `${configPath}.overrides.${fullName}`);
    for (const [key, value] of Object.entries(overrides)) {
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`${configPath}.overrides.${fullName}.${key} must be a non-empty string`);
      }
    }
  }
}

function assertAllowedKeys(object, allowedKeys, description) {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) {
      throw new Error(`${description} has unsupported key: ${key}`);
    }
  }
}

function validateTemplate(template, description) {
  const tokenMatches = template.matchAll(/\{([^}]+)\}/g);
  for (const match of tokenMatches) {
    if (!ALLOWED_TEMPLATE_TOKENS.has(match[1])) {
      throw new Error(`${description} contains unsupported template token: {${match[1]}}`);
    }
  }
  if (/[{}]/.test(template.replace(/\{[a-z_]+\}/g, ""))) {
    throw new Error(`${description} contains malformed template braces`);
  }
}

function validateGeneratedData(data, target, description = "generated data.json") {
  assertPlainJsonObject(data, description);
  for (const field of REQUIRED_FIELDS) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      throw new Error(`${description}.${field} must be a non-empty string for ${target.fullName}`);
    }
  }
  if (data.github_source_repo !== target.url) {
    throw new Error(`${description}.github_source_repo must equal ${target.url}`);
  }
  if (!/^https:\/\/serp\.ly\/[A-Za-z0-9_.-]+$/.test(data.serply_link)) {
    throw new Error(`${description}.serply_link must be a https://serp.ly/<repo> URL`);
  }
}

function assertPlainJsonObject(value, description) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${description} must be a JSON object`);
  }
}

function mergeDataJson(existingData, generated) {
  const base = existingData ?? {};
  assertPlainJsonObject(base, "Existing data.json");
  return {
    ...base,
    ...generated,
  };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function base64ToUtf8(content) {
  return Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");
}

function utf8ToBase64(content) {
  return Buffer.from(content, "utf8").toString("base64");
}

class GitHubClient {
  constructor({ token }) {
    const resolvedToken = resolveGitHubToken(token);
    if (!resolvedToken) {
      throw new Error("GitHub token is required. Add SERPCOMPANY_SOURCE_REPO_DATA_JSON_TOKEN to .env.local or run gh auth login.");
    }
    this.token = resolvedToken.token;
    this.tokenSource = resolvedToken.source;
  }

  async request(pathname, options = {}, retryWithGhToken = true) {
    const response = await fetch(`${API_BASE_URL}${pathname}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "User-Agent": "serpcompany-source-repo-data-json-sync",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers ?? {}),
      },
    });

    if (response.status === 404 && options.allowNotFound) {
      return null;
    }

    if (response.status === 401 && retryWithGhToken && this.tokenSource !== "gh auth token") {
      const ghToken = getGhAuthToken();
      if (ghToken && ghToken !== this.token) {
        this.token = ghToken;
        this.tokenSource = "gh auth token";
        return this.request(pathname, options, false);
      }
    }

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 401) {
        throw new Error(
          `GitHub API 401 for ${pathname}: bad credentials from ${this.tokenSource}. Update .env.local or run gh auth login.`,
        );
      }
      throw new Error(`GitHub API ${response.status} for ${pathname}: ${body}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async getRepo(target) {
    return this.request(`/repos/${target.owner}/${target.repo}`);
  }

  async getFile(target, filePath, ref) {
    const encodedPath = filePath
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    const encodedRef = encodeURIComponent(ref);
    const result = await this.request(
      `/repos/${target.owner}/${target.repo}/contents/${encodedPath}?ref=${encodedRef}`,
      { allowNotFound: true },
    );
    if (!result) return null;
    if (Array.isArray(result) || result.type !== "file" || typeof result.content !== "string") {
      throw new Error(`${filePath} in ${target.fullName} is not a file`);
    }
    return {
      sha: result.sha,
      text: base64ToUtf8(result.content),
    };
  }

  async putFile(target, filePath, branch, content, sha) {
    const encodedPath = filePath
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    const payload = {
      message: COMMIT_MESSAGE,
      content: utf8ToBase64(content),
      branch,
    };
    if (sha) payload.sha = sha;

    return this.request(`/repos/${target.owner}/${target.repo}/contents/${encodedPath}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }
}

function resolveGitHubToken(token = process.env.SERPCOMPANY_SOURCE_REPO_DATA_JSON_TOKEN) {
  if (token && !isPlaceholderToken(token)) {
    return { token, source: "SERPCOMPANY_SOURCE_REPO_DATA_JSON_TOKEN" };
  }
  const ghToken = getGhAuthToken();
  if (ghToken) {
    return { token: ghToken, source: "gh auth token" };
  }
  return null;
}

function hasGitHubToken() {
  return Boolean(resolveGitHubToken());
}

function isPlaceholderToken(token) {
  return /^(YOUR_TOKEN_HERE|github_pat_or_classic_token_here|replace_me|changeme)$/i.test(token.trim());
}

function getGhAuthToken() {
  try {
    return execFileSync("gh", ["auth", "token"], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

async function processRepo({ client, config, target, dryRun }) {
  const repoMetadata = await client.getRepo(target);
  const defaultBranch = repoMetadata.default_branch;
  if (!defaultBranch) {
    throw new Error(`No default branch found for ${target.fullName}`);
  }

  const readmeFile = await client.getFile(target, "README.md", defaultBranch);
  const appName = appNameFromReadme(readmeFile?.text ?? "", target.repo, config);
  const existingFile = await client.getFile(target, "data.json", defaultBranch);

  let existingData = null;
  if (existingFile) {
    try {
      existingData = JSON.parse(existingFile.text);
    } catch (error) {
      throw new Error(`Existing data.json is malformed JSON: ${error.message}`);
    }
  }

  const nextData = mergeDataJson(existingData, generatedData(target, appName, config));
  validateGeneratedData(nextData, target);
  const nextContent = stableJson(nextData);

  if (existingFile?.text === nextContent) {
    return {
      repo: target.fullName,
      status: "skipped",
      reason: "unchanged",
      branch: defaultBranch,
      app_name: appName,
    };
  }

  if (dryRun) {
    return {
      repo: target.fullName,
      status: "updated",
      dry_run: true,
      reason: existingFile ? "would update" : "would create",
      branch: defaultBranch,
      app_name: appName,
      data: nextData,
    };
  }

  await client.putFile(target, "data.json", defaultBranch, nextContent, existingFile?.sha);
  return {
    repo: target.fullName,
    status: "updated",
    dry_run: false,
    reason: existingFile ? "updated" : "created",
    branch: defaultBranch,
    app_name: appName,
  };
}

async function writeSummary(summaryPath, summary) {
  await mkdir(path.dirname(summaryPath), { recursive: true });
  await writeFile(summaryPath, stableJson(summary), "utf8");
}

async function writeGitHubStepSummary(summary, summaryPath) {
  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!stepSummaryPath) return;

  const updatedLines = summary.updated
    .slice(0, 25)
    .map((item) => `- ${item.repo}: ${item.reason}`)
    .join("\n");
  const skippedLines = summary.skipped
    .slice(0, 10)
    .map((item) => `- ${item.repo}: ${item.reason}`)
    .join("\n");
  const failedLines = summary.failed.map((item) => `- ${item.repo}: ${item.error}`).join("\n");
  const content = [
    "# source repo data.json sync",
    "",
    `- Dry run: ${summary.dry_run}`,
    `- Limit: ${summary.limit ?? "none"}`,
    `- Total: ${summary.total}`,
    `- Updated: ${summary.updated.length}`,
    `- Skipped: ${summary.skipped.length}`,
    `- Failed: ${summary.failed.length}`,
    `- JSON artifact: ${summaryPath}`,
    "",
    "## Updated",
    updatedLines || "None",
    "",
    "## Skipped",
    skippedLines || "None",
    "",
    "## Failed",
    failedLines || "None",
    "",
  ].join("\n");
  await writeFile(stepSummaryPath, content, "utf8");
}

function validateSyncInputs(targets, config) {
  for (const target of targets) {
    const appName = normalizeAppName(titleFromSlug(target.repo), config);
    validateGeneratedData(generatedData(target, appName, config), target, "validated generated data.json");
  }
}

async function runSync(args) {
  const targets = filterTargets(await readRepoList(args.repoListPath), args.repo, args.limit);
  const config = await readConfig(args.configPath);
  validateSyncInputs(targets, config);
  if (args.validateOnly) {
    console.log(`Validated ${targets.length} repo entries and ${args.configPath}`);
    return;
  }
  const client = new GitHubClient({
    token: process.env.SERPCOMPANY_SOURCE_REPO_DATA_JSON_TOKEN,
  });
  const summary = {
    dry_run: args.dryRun,
    limit: args.limit ?? null,
    total: targets.length,
    updated: [],
    skipped: [],
    failed: [],
  };

  for (const target of targets) {
    try {
      const result = await processRepo({ client, config, target, dryRun: args.dryRun });
      summary[result.status].push(result);
      console.log(`${target.fullName}: ${result.status} (${result.reason})`);
    } catch (error) {
      const failure = {
        repo: target.fullName,
        error: error instanceof Error ? error.message : String(error),
      };
      summary.failed.push(failure);
      console.error(`${target.fullName}: failed - ${failure.error}`);
    }
  }

  await writeSummary(args.summaryPath, summary);
  await writeGitHubStepSummary(summary, args.summaryPath);

  console.log("");
  console.log(`Processed ${summary.total} repos`);
  console.log(`Updated: ${summary.updated.length}`);
  console.log(`Skipped: ${summary.skipped.length}`);
  console.log(`Failed: ${summary.failed.length}`);
  console.log(`Summary: ${args.summaryPath}`);

  if (summary.failed.length > 0) {
    process.exitCode = 1;
  }
}

function filterTargets(targets, repoFilter, limit) {
  const limitedTargets = (items) => (typeof limit === "number" ? items.slice(0, limit) : items);
  if (!repoFilter) return limitedTargets(targets);
  const normalizedFilter = OWNER_REPO_PATTERN.test(repoFilter) ? repoFilter : `${OWNER}/${repoFilter}`;
  const filteredTargets = targets.filter((target) => target.fullName === normalizedFilter);
  if (filteredTargets.length === 0) {
    throw new Error(`Repo is not listed in data/source-repo-downloaders.txt: ${normalizedFilter}`);
  }
  return filteredTargets;
}

async function runSelfTest() {
  const config = {
    fields: {
      github_source_repo: "https://github.com/{owner}/{repo}",
      serply_link: "https://serp.ly/{repo}",
      app_name: "{app_name}",
    },
    app_name: {
      strip_trailing_parenthetical: true,
      ensure_video_before_downloader: true,
    },
    overrides: {},
  };
  assert.equal(
    appNameFromReadme("# 3movs Downloader (Browser Extension)\n", "3movs-downloader", config),
    "3movs Video Downloader",
  );
  assert.equal(
    appNameFromReadme(
      "\n## Not H1\n# 4k69 Downloader (Browser Extension) ###\n",
      "4k69-downloader",
      config,
    ),
    "4k69 Video Downloader",
  );
  assert.equal(
    appNameFromReadme("No heading\n", "321tube-downloader", config),
    "321tube Video Downloader",
  );
  assert.equal(
    appNameFromReadme(
      "# Vimeo Video Downloader (Browser Extension)\n",
      "vimeo-video-downloader",
      config,
    ),
    "Vimeo Video Downloader",
  );
  assert.equal(
    repoTargetFromListEntry(
      "https://github.com/serpcompany/321tube-downloader",
      "data/source-repo-downloaders.txt",
    ).fullName,
    "serpcompany/321tube-downloader",
  );
  const target = repoTargetFromListEntry(
    "https://github.com/serpcompany/321tube-downloader",
    "data/source-repo-downloaders.txt",
  );

  const merged = mergeDataJson(
    {
      existing: true,
      app_name: "Old Name",
    },
    generatedData(target, "321tube Video Downloader", config),
  );
  assert.deepEqual(merged, {
    existing: true,
    github_source_repo: "https://github.com/serpcompany/321tube-downloader",
    serply_link: "https://serp.ly/321tube-downloader",
    app_name: "321tube Video Downloader",
  });

  validateConfig(config, "self-test config");
  validateGeneratedData(merged, target, "self-test data.json");
  assert.throws(() => mergeDataJson([], generatedData(target, "X", config)), /must be a JSON object/);
  assert.throws(
    () =>
      validateConfig(
        {
          ...config,
          fields: { ...config.fields, app_name: "{bad}" },
        },
        "bad config",
      ),
    /unsupported template token/,
  );
  assert.equal(stableJson(merged).endsWith("\n"), true);

  console.log("Self-test passed");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = parseArgs(process.argv.slice(2));
  if (args.selfTest) {
    await runSelfTest();
  } else {
    await runSync(args);
  }
}

export {
  appNameFromReadme,
  cleanAppNameFromH1,
  extractFirstMarkdownH1,
  generatedData,
  hasGitHubToken,
  loadLocalEnv,
  mergeDataJson,
  normalizeAppName,
  readRepoList,
  repoTargetFromListEntry,
  validateConfig,
  validateGeneratedData,
  stableJson,
  titleFromSlug,
};
