# Source Repo data.json Sync

The downloader source repo `data.json` registry moved to `serpcompany/downloader-source-registry`.

Use that repository for:

- `data/source-repo-downloaders.txt`
- `data/source-repo-data-json-config.json`
- `data/source-repo-data-json-config.schema.json`
- `scripts/sync-source-repo-data-json.mjs`
- `scripts/edit-source-repo-data-json-config.mjs`
- `.github/workflows/sync-source-repo-data-json.yml`
- the Cloudflare Pages dashboard in `apps/source-repo-dashboard/`

Do not restore a writable copy of the registry in `serp-actions`; the new registry repo is the source of truth.
