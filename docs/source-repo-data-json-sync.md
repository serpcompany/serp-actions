# Source Repo data.json Sync

This repo owns the local config and automation that updates downloader repo `data.json` files.

## Files

- `data/source-repo-downloaders.txt`: checked-in target repo list.
- `data/source-repo-data-json-config.json`: source of truth for generated fields and per-repo overrides.
- `data/source-repo-data-json-config.schema.json`: JSON Schema for the config shape.
- `scripts/sync-source-repo-data-json.mjs`: validates config and writes `data.json` to target repos.
- `scripts/edit-source-repo-data-json-config.mjs`: local browser editor for per-repo overrides.

## Local Editor

Start the editor from this repo:

```bash
node scripts/edit-source-repo-data-json-config.mjs
```

Open the printed localhost URL. The editor has two views:

- `Single Repo`: the original focused editor for one repo.
- `All Repos Table`: a spreadsheet-like view of every configured repo.

Both views show local effective values only: generated defaults plus saved overrides from `data/source-repo-data-json-config.json`. They do not read live remote GitHub `data.json` files.

Inline edits use the same override rule in both views:

- generated values are shown in the form but are not saved as overrides when unchanged
- edited values that differ from generated defaults are saved under `overrides`
- blank values remove that field override
- clearing all fields removes the repo override object

The editor writes only `data/source-repo-data-json-config.json` when you click `Save All`. Remote `data.json` files are unchanged until you click `Sync Remote data.json` for one row or `Sync Selected Remote data.json` in the table.

The search box filters both the single-repo list and the table. Quick filters show all repos, repos with saved overrides, or repos with unsaved dirty changes. The table marks saved overrides, dirty cells, and rows selected for remote sync.

## Table CSV Import and Export

The table can export and import CSV for operator review. CSV is a convenience format only; JSON config remains the source of truth.

Exported and imported CSV must use this exact header:

```csv
repo,app_name,serply_link,github_source_repo
```

Import behavior:

- rows are matched by `repo`
- values equal to generated defaults are not saved as overrides
- blank values remove that field override
- unknown repo ids, duplicate repo rows, malformed CSV, or wrong columns block the import before any browser-side changes are applied
- after a successful import, review dirty markers and click `Save All` to write the JSON config

## Table Selected Sync Workflow

In `All Repos Table`:

1. Select rows with the checkboxes.
2. Optionally edit cells or import CSV changes.
3. Click `Save All` to write local config, or click `Sync Selected Remote data.json` to save first and then sync each selected repo.
4. Review the per-repo summary for updated, skipped, and failed results.

`Clear Selected Overrides` removes local override values for selected rows in the browser. Click `Save All` afterward to persist the removal.

## Credentials

Remote sync needs GitHub write access to the target repo. The scripts resolve credentials in this order:

1. `SERPCOMPANY_SOURCE_REPO_DATA_JSON_TOKEN` from the shell, `.env.local`, or `.env`
2. `gh auth token`

Use a local ignored env file when needed:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and set:

```text
SERPCOMPANY_SOURCE_REPO_DATA_JSON_TOKEN=your_token
```

If the env token is missing, a placeholder, or rejected with `401`, the sync script falls back to `gh auth token` when available.

## Validate

Run these checks before syncing broadly:

```bash
node --check scripts/sync-source-repo-data-json.mjs
node --check scripts/edit-source-repo-data-json-config.mjs
node scripts/sync-source-repo-data-json.mjs --self-test
node scripts/sync-source-repo-data-json.mjs --validate
```

Validate one repo:

```bash
node scripts/sync-source-repo-data-json.mjs --validate --repo serpcompany/321tube-downloader
```

## Sync One Repo

From the editor, select the repo and click `Sync Remote data.json`.

From the CLI:

```bash
node scripts/sync-source-repo-data-json.mjs --write --repo serpcompany/321tube-downloader
```

## Sync All Repos

```bash
node scripts/sync-source-repo-data-json.mjs --write
```

The default mode is dry-run unless `--write` is passed.
