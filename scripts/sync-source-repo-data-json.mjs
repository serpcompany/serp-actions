#!/usr/bin/env node

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const OWNER = "serpcompany";
const API_BASE_URL = "https://api.github.com";
const DEFAULT_REPO_LIST_PATH = "data/source-repo-downloaders.txt";
const DEFAULT_SUMMARY_PATH = "tmp/sync-source-repo-data-json-summary.json";
const COMMIT_MESSAGE = "Update source repo data.json";

function parseArgs(argv) {
  const args = {
    dryRun: parseBoolean(process.env.DRY_RUN ?? "true"),
    limit: parseOptionalNumber(process.env.LIMIT ?? ""),
    repoListPath: process.env.REPO_LIST_PATH || DEFAULT_REPO_LIST_PATH,
    summaryPath: process.env.SUMMARY_PATH || DEFAULT_SUMMARY_PATH,
    selfTest: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--write") {
      args.dryRun = false;
    } else if (arg === "--limit") {
      args.limit = parseOptionalNumber(argv[++index] ?? "");
    } else if (arg === "--repo-list") {
      args.repoListPath = argv[++index] ?? "";
    } else if (arg === "--summary") {
      args.summaryPath = argv[++index] ?? "";
    } else if (arg === "--self-test") {
      args.selfTest = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.repoListPath) {
    throw new Error("--repo-list cannot be empty");
  }
  if (!args.summaryPath) {
    throw new Error("--summary cannot be empty");
  }

  return args;
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
  const repos = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  const seen = new Set();
  const uniqueRepos = [];
  for (const repo of repos) {
    if (seen.has(repo)) {
      throw new Error(`Duplicate repo in ${repoListPath}: ${repo}`);
    }
    seen.add(repo);
    uniqueRepos.push(repo);
  }

  return typeof limit === "number" ? uniqueRepos.slice(0, limit) : uniqueRepos;
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

function appNameFromReadme(markdown, repo) {
  const h1 = extractFirstMarkdownH1(markdown);
  const cleaned = cleanAppNameFromH1(h1);
  return cleaned || titleFromSlug(repo);
}

function generatedData(repo, appName) {
  return {
    github_source_repo: `https://github.com/${OWNER}/${repo}`,
    serply_link: `https://serp.ly/${repo}`,
    app_name: appName,
  };
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
    if (!token) {
      throw new Error("SERPCOMPANY_SOURCE_REPO_DATA_JSON_TOKEN is required");
    }
    this.token = token;
  }

  async request(pathname, options = {}) {
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

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub API ${response.status} for ${pathname}: ${body}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async getRepo(repo) {
    return this.request(`/repos/${OWNER}/${repo}`);
  }

  async getFile(repo, filePath, ref) {
    const encodedPath = filePath
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    const encodedRef = encodeURIComponent(ref);
    const result = await this.request(
      `/repos/${OWNER}/${repo}/contents/${encodedPath}?ref=${encodedRef}`,
      { allowNotFound: true },
    );
    if (!result) return null;
    if (Array.isArray(result) || result.type !== "file" || typeof result.content !== "string") {
      throw new Error(`${filePath} in ${repo} is not a file`);
    }
    return {
      sha: result.sha,
      text: base64ToUtf8(result.content),
    };
  }

  async putFile(repo, filePath, branch, content, sha) {
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

    return this.request(`/repos/${OWNER}/${repo}/contents/${encodedPath}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }
}

async function processRepo({ client, repo, dryRun }) {
  const repoMetadata = await client.getRepo(repo);
  const defaultBranch = repoMetadata.default_branch;
  if (!defaultBranch) {
    throw new Error(`No default branch found for ${repo}`);
  }

  const readmeFile = await client.getFile(repo, "README.md", defaultBranch);
  const appName = appNameFromReadme(readmeFile?.text ?? "", repo);
  const existingFile = await client.getFile(repo, "data.json", defaultBranch);

  let existingData = null;
  if (existingFile) {
    try {
      existingData = JSON.parse(existingFile.text);
    } catch (error) {
      throw new Error(`Existing data.json is malformed JSON: ${error.message}`);
    }
  }

  const nextData = mergeDataJson(existingData, generatedData(repo, appName));
  const nextContent = stableJson(nextData);

  if (existingFile?.text === nextContent) {
    return {
      repo,
      status: "skipped",
      reason: "unchanged",
      branch: defaultBranch,
      app_name: appName,
    };
  }

  if (dryRun) {
    return {
      repo,
      status: "updated",
      dry_run: true,
      reason: existingFile ? "would update" : "would create",
      branch: defaultBranch,
      app_name: appName,
      data: nextData,
    };
  }

  await client.putFile(repo, "data.json", defaultBranch, nextContent, existingFile?.sha);
  return {
    repo,
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

async function runSync(args) {
  const repos = await readRepoList(args.repoListPath, args.limit);
  const client = new GitHubClient({
    token: process.env.SERPCOMPANY_SOURCE_REPO_DATA_JSON_TOKEN,
  });
  const summary = {
    dry_run: args.dryRun,
    limit: args.limit ?? null,
    total: repos.length,
    updated: [],
    skipped: [],
    failed: [],
  };

  for (const repo of repos) {
    try {
      const result = await processRepo({ client, repo, dryRun: args.dryRun });
      summary[result.status].push(result);
      console.log(`${repo}: ${result.status} (${result.reason})`);
    } catch (error) {
      const failure = {
        repo,
        error: error instanceof Error ? error.message : String(error),
      };
      summary.failed.push(failure);
      console.error(`${repo}: failed - ${failure.error}`);
    }
  }

  await writeSummary(args.summaryPath, summary);

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

async function runSelfTest() {
  assert.equal(
    appNameFromReadme("# 3movs Downloader (Browser Extension)\n", "3movs-downloader"),
    "3movs Downloader",
  );
  assert.equal(
    appNameFromReadme("\n## Not H1\n# 4k69 Downloader (Browser Extension) ###\n", "4k69-downloader"),
    "4k69 Downloader",
  );
  assert.equal(appNameFromReadme("No heading\n", "321tube-downloader"), "321tube Downloader");

  const merged = mergeDataJson(
    {
      existing: true,
      app_name: "Old Name",
    },
    generatedData("321tube-downloader", "321tube Downloader"),
  );
  assert.deepEqual(merged, {
    existing: true,
    github_source_repo: "https://github.com/serpcompany/321tube-downloader",
    serply_link: "https://serp.ly/321tube-downloader",
    app_name: "321tube Downloader",
  });

  assert.throws(() => mergeDataJson([], generatedData("x", "X")), /must be a JSON object/);
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
  mergeDataJson,
  readRepoList,
  stableJson,
  titleFromSlug,
};
