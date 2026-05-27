#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  run-serpgames-skills-add-loop.sh \
    --runs-per-cycle N \
    --seconds-between-cycles N \
    --seconds-between-runs N \
    --seconds-after-cycle N \
    [--max-cycles N] \
    [--mode github|smithery|both] \
    [--smithery-namespace NAMESPACE] \
    [--seconds-between-skill-adds N] \
    [--skills-repo-url URL] \
    [--skills-manifest-url URL] \
    [--dry-run]

Runs one SERP Games GitHub skill install per skill listed in the manifest:
  npx -y skills add https://github.com/serpgames/skills --skill 2048-game -y

Runs one Smithery skill install per skill when mode is smithery or both:
  npx -y skills add https://smithery.ai/skills/serpgames/2048-game
EOF
}

require_integer() {
  local name="$1"
  local value="$2"

  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "Invalid value for $name: $value" >&2
    exit 1
  fi
}

run_command() {
  if [[ "$dry_run" == "1" ]]; then
    printf 'DRY RUN:'
  else
    printf 'RUN:'
  fi
  printf ' %q' "$@"
  printf '\n'

  if [[ "$dry_run" == "1" ]]; then
    return 0
  fi

  "$@"
}

fetch_skill_names() {
  local manifest_json

  manifest_json="$(curl -fsSL "$skills_manifest_url")"

  python3 -c '
import json
import re
import sys

data = json.load(sys.stdin)
if not isinstance(data, list):
    raise SystemExit("Manifest must be a JSON array")

seen = set()
for entry in data:
    if not isinstance(entry, dict):
        continue
    skill = str(entry.get("skill") or "").strip()
    if not skill:
        continue
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", skill):
        raise SystemExit(f"Invalid skill name in manifest: {skill}")
    if skill in seen:
        continue
    seen.add(skill)
    print(skill)
' <<< "$manifest_json"
}

maybe_sleep_between_skill_adds() {
  if (( seconds_between_skill_adds > 0 )); then
    sleep "$seconds_between_skill_adds"
  fi
}

load_skill_names() {
  local skill_names=()
  local skill_count

  mapfile -t skill_names < <(fetch_skill_names)
  skill_count="${#skill_names[@]}"

  if (( skill_count < 1 )); then
    echo "No skills found in manifest: $skills_manifest_url" >&2
    exit 1
  fi

  printf '%s\n' "${skill_names[@]}"
}

run_github_add_commands() {
  local skill_names=("$@")
  local skill_count="${#skill_names[@]}"

  echo "Running GitHub skills add for $skill_count SERP Games skills"

  for index in "${!skill_names[@]}"; do
    local skill_name="${skill_names[$index]}"
    echo "SERP Games skill $((index + 1))/$skill_count: $skill_name"
    run_command npx -y skills add "$skills_repo_url" --skill "$skill_name" -y
    maybe_sleep_between_skill_adds
  done
}

run_smithery_add_commands() {
  local skill_names=("$@")
  local skill_count="${#skill_names[@]}"

  echo "Running Smithery skills add for $skill_count SERP Games skills in namespace $smithery_namespace"

  for index in "${!skill_names[@]}"; do
    local skill_name="${skill_names[$index]}"
    echo "Smithery skill $((index + 1))/$skill_count: $skill_name"
    run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/$skill_name"
    maybe_sleep_between_skill_adds
  done
}

run_add_once() {
  local skill_names=()

  mapfile -t skill_names < <(load_skill_names)

  case "$mode" in
    github|both)
      run_github_add_commands "${skill_names[@]}"
      ;;
  esac

  case "$mode" in
    smithery|both)
      run_smithery_add_commands "${skill_names[@]}"
      ;;
  esac
}

runs_per_cycle=""
seconds_between_cycles=""
seconds_between_runs=""
seconds_after_cycle=""
max_cycles=""
mode="both"
smithery_namespace="serpgames"
seconds_between_skill_adds="0"
skills_repo_url="https://github.com/serpgames/skills"
skills_manifest_url="https://raw.githubusercontent.com/serpgames/skills/main/docs/serpgames-live-games.json"
dry_run="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runs-per-cycle)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      runs_per_cycle="${2:-}"; shift 2 ;;
    --seconds-between-cycles)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      seconds_between_cycles="${2:-}"; shift 2 ;;
    --seconds-between-runs)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      seconds_between_runs="${2:-}"; shift 2 ;;
    --seconds-after-cycle)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      seconds_after_cycle="${2:-}"; shift 2 ;;
    --max-cycles)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      max_cycles="${2:-}"; shift 2 ;;
    --mode)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      mode="${2:-}"; shift 2 ;;
    --smithery-namespace)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      smithery_namespace="${2:-}"; shift 2 ;;
    --seconds-between-skill-adds)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      seconds_between_skill_adds="${2:-}"; shift 2 ;;
    --skills-repo-url)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      skills_repo_url="${2:-}"; shift 2 ;;
    --skills-manifest-url)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      skills_manifest_url="${2:-}"; shift 2 ;;
    --dry-run)
      dry_run="1"; shift ;;
    -h|--help)
      usage; exit 0 ;;
    --*)
      echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
    *)
      echo "Unexpected argument: $1" >&2; usage >&2; exit 1 ;;
  esac
done

if [[ -z "$runs_per_cycle" || -z "$seconds_between_cycles" || -z "$seconds_between_runs" || -z "$seconds_after_cycle" ]]; then
  usage >&2
  exit 1
fi

require_integer "runs_per_cycle" "$runs_per_cycle"
require_integer "seconds_between_cycles" "$seconds_between_cycles"
require_integer "seconds_between_runs" "$seconds_between_runs"
require_integer "seconds_after_cycle" "$seconds_after_cycle"
require_integer "seconds_between_skill_adds" "$seconds_between_skill_adds"

if [[ -n "$max_cycles" ]]; then
  require_integer "max_cycles" "$max_cycles"
fi

if (( runs_per_cycle < 1 )); then
  echo "runs_per_cycle must be at least 1" >&2
  exit 1
fi

if [[ -n "$max_cycles" ]] && (( max_cycles < 1 )); then
  echo "max_cycles must be at least 1" >&2
  exit 1
fi

case "$mode" in
  github|smithery|both) ;;
  *) echo "mode must be github, smithery, or both" >&2; exit 1 ;;
esac

cycle_number=1

while true; do
  echo "Starting cycle $cycle_number"

  for (( run_number = 1; run_number <= runs_per_cycle; run_number++ )); do
    echo "Cycle $cycle_number, run $run_number/$runs_per_cycle"
    run_add_once

    if (( run_number < runs_per_cycle && seconds_between_runs > 0 )); then
      echo "Sleeping $seconds_between_runs seconds before the next run"
      sleep "$seconds_between_runs"
    fi
  done

  if (( seconds_after_cycle > 0 )); then
    echo "Sleeping $seconds_after_cycle seconds after cycle $cycle_number"
    sleep "$seconds_after_cycle"
  fi

  if [[ -n "$max_cycles" ]] && (( cycle_number >= max_cycles )); then
    echo "Reached max cycles ($max_cycles); exiting"
    break
  fi

  if (( seconds_between_cycles > 0 )); then
    echo "Sleeping $seconds_between_cycles seconds before cycle $((cycle_number + 1))"
    sleep "$seconds_between_cycles"
  fi

  cycle_number=$(( cycle_number + 1 ))
done
