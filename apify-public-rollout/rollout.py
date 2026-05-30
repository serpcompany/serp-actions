from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib import error, parse, request


DEFAULT_REPORT_PATH = Path(__file__).resolve().parent / "apify-non-public-actors-2026-05-30.txt"
DEFAULT_OWNERS = ("how-to-download-videos", "serpdownloaders", "serpxxx")
DEFAULT_BASE_URL = "https://api.apify.com/v2"
BLOCKING_ERROR_CODES = ("daily-publication-limit-exceeded", "store-terms-not-accepted")
CADENCE_HOURS = 26
SKIPPABLE_UPDATE_ERROR_CODES = ("tagged-build-required",)


class ApifyAppError(RuntimeError):
    pass


class ApifyHttpError(ApifyAppError):
    def __init__(self, message: str, *, status_code: int | None = None, response_text: str | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.response_text = response_text


@dataclass(frozen=True)
class ReportActor:
    owner: str
    name: str
    title: str | None = None
    actor_id: str | None = None


def clean_string(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned or None


def _owner_token_candidates(owner: str) -> list[str]:
    env_safe_owner = "".join(char if char.isalnum() else "_" for char in owner)
    return [
        f"APIFY_API_TOKEN_{owner}",
        f"APIFY_API_TOKEN_{owner.upper()}",
        f"APIFY_API_TOKEN_{env_safe_owner}",
        f"APIFY_API_TOKEN_{env_safe_owner.upper()}",
        f"APIFY_TOKEN_{owner}",
        f"APIFY_TOKEN_{owner.upper()}",
        f"APIFY_TOKEN_{env_safe_owner}",
        f"APIFY_TOKEN_{env_safe_owner.upper()}",
    ]


def resolve_apify_token(owner: str) -> str:
    for key in _owner_token_candidates(owner):
        token = clean_string(os.getenv(key))
        if token:
            return token
    raise ApifyAppError(f"Missing Apify token for owner {owner!r}.")


class ApifyApiClient:
    def __init__(self, owner: str, *, base_url: str = DEFAULT_BASE_URL) -> None:
        self.owner = owner
        self.token = resolve_apify_token(owner)
        self.base_url = base_url.rstrip("/")

    def _headers(self) -> dict[str, str]:
        return {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "serp-actions-apify-public-rollout",
        }

    def request_json(self, method: str, path: str, *, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        data = json.dumps(payload, ensure_ascii=True).encode("utf-8") if payload is not None else None
        req = request.Request(f"{self.base_url}{path}", data=data, headers=self._headers(), method=method)
        try:
            with request.urlopen(req, timeout=30) as response:
                body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise ApifyHttpError(
                f"Apify API {method} {path} failed with HTTP {exc.code}: {detail}",
                status_code=exc.code,
                response_text=detail,
            ) from exc
        except error.URLError as exc:
            raise ApifyAppError(f"Apify API {method} {path} failed: {exc}") from exc
        payload_json = json.loads(body) if body else {}
        if not isinstance(payload_json, dict):
            raise ApifyAppError(f"Apify API {method} {path} returned a non-object response.")
        return payload_json

    def get(self, path: str) -> dict[str, Any]:
        return self.request_json("GET", path)

    def put(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self.request_json("PUT", path, payload=payload)


def parse_non_public_report(path: str | Path) -> list[ReportActor]:
    actors: list[ReportActor] = []
    current_owner: str | None = None
    last_actor_index: int | None = None

    for raw_line in Path(path).read_text(encoding="utf-8").splitlines():
        line = raw_line.rstrip()
        if line.startswith("## "):
            current_owner = line.removeprefix("## ").strip()
            last_actor_index = None
            continue
        if current_owner is None:
            continue
        if line.startswith("- "):
            last_actor_index = None
            body = line[2:].strip()
            if body == "None" or "/" not in body:
                continue
            actor_slug, _, title = body.partition(" — ")
            owner, _, name = actor_slug.partition("/")
            if not owner or not name:
                continue
            actors.append(ReportActor(owner=owner, name=name, title=clean_string(title)))
            last_actor_index = len(actors) - 1
            continue
        if last_actor_index is not None:
            actor_id_match = re.match(r"\s*actor_id:\s*(\S+)\s*$", line)
            if actor_id_match:
                previous = actors[last_actor_index]
                actors[last_actor_index] = ReportActor(
                    owner=previous.owner,
                    name=previous.name,
                    title=previous.title,
                    actor_id=actor_id_match.group(1),
                )
    return actors


def cadence_allows_run(*, force: bool, slot: int | None, now: datetime | None = None) -> tuple[bool, dict[str, Any]]:
    now_utc = now.astimezone(UTC) if now is not None else datetime.now(UTC)
    epoch_hour = int(now_utc.timestamp()) // 3600
    current_slot = epoch_hour % CADENCE_HOURS
    details = {
        "force": force,
        "slot": slot,
        "current_slot": current_slot,
        "epoch_hour": epoch_hour,
        "cadence_hours": CADENCE_HOURS,
        "checked_at": now_utc.isoformat(),
    }
    if force:
        return True, details
    if slot is None:
        details["reason"] = "missing_slot"
        return False, details
    allowed = current_slot == slot
    if not allowed:
        details["reason"] = "not_scheduled_slot"
    return allowed, details


def _actor_path(owner: str, name: str) -> str:
    return f"/acts/{parse.quote(f'{owner}~{name}', safe='~')}"


def _actor_data(response: dict[str, Any]) -> dict[str, Any]:
    data = response.get("data")
    return data if isinstance(data, dict) else {}


def _valid_categories(value: Any) -> list[str] | None:
    if not isinstance(value, list) or not value:
        return None
    categories = [category.strip() for category in value if isinstance(category, str) and category.strip()]
    return categories or None


def _apify_error_code(exc: ApifyHttpError) -> str | None:
    response_text = exc.response_text or ""
    try:
        payload = json.loads(response_text)
    except json.JSONDecodeError:
        payload = None

    candidates: list[str] = [response_text]
    if isinstance(payload, dict):
        api_error = payload.get("error")
        if isinstance(api_error, dict):
            for key in ("type", "code", "name", "message"):
                value = api_error.get(key)
                if isinstance(value, str):
                    candidates.append(value)
        elif isinstance(api_error, str):
            candidates.append(api_error)

    haystack = " ".join(candidates).lower()
    for code in (*BLOCKING_ERROR_CODES, *SKIPPABLE_UPDATE_ERROR_CODES):
        if code in haystack:
            return code
    return None


def _owner_queue(actors: list[ReportActor], owner: str) -> list[ReportActor]:
    return [actor for actor in actors if actor.owner == owner]


def _result_entry(actor: ReportActor, **extra: Any) -> dict[str, Any]:
    entry = {
        "owner": actor.owner,
        "name": actor.name,
        "slug": f"{actor.owner}/{actor.name}",
        "actor_id": actor.actor_id,
        "report_title": actor.title,
    }
    entry.update(extra)
    return entry


def run_rollout(
    *,
    report_path: str | Path = DEFAULT_REPORT_PATH,
    owners: list[str] | tuple[str, ...] = DEFAULT_OWNERS,
    batch_size: int = 5,
    dry_run: bool = False,
    force: bool = False,
    slot: int | None = None,
) -> dict[str, Any]:
    allowed, cadence = cadence_allows_run(force=force, slot=slot)
    summary: dict[str, Any] = {
        "dry_run": dry_run,
        "force": force,
        "batch_size": batch_size,
        "owners": list(owners),
        "report_path": str(report_path),
        "cadence": cadence,
        "attempted": [],
        "published": [],
        "skipped": [],
        "blocked": [],
        "failed": [],
        "owner_results": {},
    }
    if not allowed:
        summary["operation"] = "skipped_by_cadence"
        return summary

    summary["operation"] = "rollout"
    actors = parse_non_public_report(report_path)

    for owner in owners:
        owner_result: dict[str, Any] = {
            "attempted": [],
            "published": [],
            "dry_run": [],
            "skipped": [],
            "blocked": [],
            "failed": [],
        }
        summary["owner_results"][owner] = owner_result
        client = ApifyApiClient(owner)
        selected_count = 0

        for actor in _owner_queue(actors, owner):
            if selected_count >= batch_size:
                break
            try:
                live_actor = _actor_data(client.get(_actor_path(owner, actor.name)))
            except ApifyAppError as exc:
                entry = _result_entry(actor, error=str(exc), phase="get")
                owner_result["failed"].append(entry)
                summary["failed"].append(entry)
                break

            is_public = live_actor.get("isPublic")
            if is_public is True:
                entry = _result_entry(actor, reason="already_public")
                owner_result["skipped"].append(entry)
                summary["skipped"].append(entry)
                continue
            if is_public is not False:
                entry = _result_entry(actor, reason="unknown_visibility", live_is_public=is_public)
                owner_result["skipped"].append(entry)
                summary["skipped"].append(entry)
                continue

            title = clean_string(live_actor.get("title"))
            categories = _valid_categories(live_actor.get("categories"))
            if title is None:
                entry = _result_entry(actor, reason="missing_title")
                owner_result["skipped"].append(entry)
                summary["skipped"].append(entry)
                continue
            if categories is None:
                entry = _result_entry(actor, reason="missing_categories")
                owner_result["skipped"].append(entry)
                summary["skipped"].append(entry)
                continue

            payload = {"isPublic": True, "title": title, "categories": categories}
            entry = _result_entry(actor, payload=payload)
            owner_result["attempted"].append(entry)
            summary["attempted"].append(entry)

            if dry_run:
                selected_count += 1
                owner_result["dry_run"].append(entry)
                continue

            try:
                response = client.put(_actor_path(owner, actor.name), payload)
            except ApifyHttpError as exc:
                error_code = _apify_error_code(exc)
                if error_code in BLOCKING_ERROR_CODES:
                    blocked = _result_entry(actor, reason=error_code, error=str(exc), phase="put")
                    owner_result["blocked"].append(blocked)
                    summary["blocked"].append(blocked)
                    break
                if error_code in SKIPPABLE_UPDATE_ERROR_CODES:
                    skipped = _result_entry(actor, reason=error_code, error=str(exc), phase="put")
                    owner_result["skipped"].append(skipped)
                    summary["skipped"].append(skipped)
                    continue
                failed = _result_entry(actor, error=str(exc), phase="put")
                owner_result["failed"].append(failed)
                summary["failed"].append(failed)
                continue
            except ApifyAppError as exc:
                failed = _result_entry(actor, error=str(exc), phase="put")
                owner_result["failed"].append(failed)
                summary["failed"].append(failed)
                continue

            published = _result_entry(actor, response=_actor_data(response))
            selected_count += 1
            owner_result["published"].append(published)
            summary["published"].append(published)

    return summary


def write_summary_artifacts(summary: dict[str, Any], output_dir: str | Path) -> dict[str, str]:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    json_path = output_path / "summary.json"
    text_path = output_path / "summary.txt"
    json_path.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    lines = [
        f"operation: {summary.get('operation')}",
        f"dry_run: {summary.get('dry_run')}",
        f"force: {summary.get('force')}",
        f"batch_size: {summary.get('batch_size')}",
        f"attempted: {len(summary.get('attempted', []))}",
        f"published: {len(summary.get('published', []))}",
        f"skipped: {len(summary.get('skipped', []))}",
        f"blocked: {len(summary.get('blocked', []))}",
        f"failed: {len(summary.get('failed', []))}",
        "",
    ]
    owner_results = summary.get("owner_results", {})
    if isinstance(owner_results, dict):
        for owner, result in owner_results.items():
            if not isinstance(result, dict):
                continue
            lines.append(f"[{owner}]")
            for key in ("attempted", "published", "dry_run", "skipped", "blocked", "failed"):
                value = result.get(key, [])
                lines.append(f"{key}: {len(value) if isinstance(value, list) else 0}")
                if isinstance(value, list):
                    for item in value:
                        if not isinstance(item, dict):
                            continue
                        slug = item.get("slug", "unknown")
                        reason = item.get("reason") or item.get("phase") or ""
                        suffix = f" ({reason})" if reason else ""
                        lines.append(f"  - {slug}{suffix}")
            lines.append("")
    text_path.write_text("\n".join(lines), encoding="utf-8")
    return {"json": str(json_path), "text": str(text_path)}


def _slot_from_env() -> int | None:
    raw_slot = clean_string(os.getenv("APIFY_PUBLIC_ROLLOUT_SLOT"))
    return int(raw_slot) if raw_slot is not None else None


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Publish private Apify actors in small visibility-only waves.")
    parser.add_argument("--report", default=str(DEFAULT_REPORT_PATH), help="Non-public actor report path.")
    parser.add_argument("--owners", nargs="+", default=list(DEFAULT_OWNERS), help="Apify owner queues to process.")
    parser.add_argument("--batch-size", type=int, default=5, help="Maximum private actors to publish per owner.")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and select actors without sending PUT updates.")
    parser.add_argument("--force", action="store_true", help="Bypass the modulo-26 scheduled cadence gate.")
    parser.add_argument(
        "--slot",
        type=int,
        default=_slot_from_env(),
        help="Scheduled epoch-hour modulo 26 slot. Defaults to APIFY_PUBLIC_ROLLOUT_SLOT.",
    )
    parser.add_argument("--summary-dir", default=None, help="Optional directory for summary.json and summary.txt.")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.batch_size < 1:
        parser.exit(status=2, message="--batch-size must be at least 1.\n")
    if args.slot is not None and not 0 <= args.slot < CADENCE_HOURS:
        parser.exit(status=2, message=f"--slot must be between 0 and {CADENCE_HOURS - 1}.\n")

    summary = run_rollout(
        report_path=args.report,
        owners=args.owners,
        batch_size=args.batch_size,
        dry_run=args.dry_run,
        force=args.force,
        slot=args.slot,
    )
    if args.summary_dir:
        summary["artifacts"] = write_summary_artifacts(summary, args.summary_dir)
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 1 if summary.get("failed") else 0


if __name__ == "__main__":
    sys.exit(main())
