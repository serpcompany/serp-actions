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
    [--dry-run]

Runs the SERP Games bulk GitHub skill install:
  npx -y skills add https://github.com/serpgames/skills --skill '*' -y
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
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

run_add_once() {
  echo "Running GitHub bulk skills add for SERP Games skills"
  run_command npx -y skills add https://github.com/serpgames/skills --skill '*' -y
}

runs_per_cycle=""
seconds_between_cycles=""
seconds_between_runs=""
seconds_after_cycle=""
max_cycles=""
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
