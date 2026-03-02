"""External registry resolution for ARA CLI."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

import httpx

from . import http


EXTERNALS_PATH = "registry/externals.json"


@dataclass
class ExternalRegistry:
    """Configuration for an external registry."""

    id: str
    type: str
    repo: Optional[str] = None
    branch: str = "main"
    description: Optional[str] = None


def _fetch_externals_config() -> dict[str, Any]:
    """
    Fetch externals.json from the registry repository.

    Admins manage this file in the registry repo. The CLI treats it as
    the allowlist of external registries.
    """
    url = f"{http.api_base()}/contents/{EXTERNALS_PATH}"

    try:
        with http.get_client() as client:
            response = client.get(url)
            if response.status_code == 404:
                return {}
            response.raise_for_status()
            data = response.json()
            content = data.get("content")
            if not content:
                return {}
            # GitHub returns base64 content for file blobs
            import base64

            decoded = base64.b64decode(content).decode("utf-8")
            return json.loads(decoded)
    except Exception:
        # Fail closed: no external registries if config cannot be read
        return {}


def get_external_registry(registry_id: str) -> Optional[ExternalRegistry]:
    """Look up an external registry configuration by ID (e.g. 'anthropic/skills')."""
    config = _fetch_externals_config()
    entry = config.get(registry_id)
    if not entry:
        return None

    return ExternalRegistry(
        id=registry_id,
        type=entry.get("type", ""),
        repo=entry.get("repo"),
        branch=entry.get("branch", "main"),
        description=entry.get("description"),
    )


def _github_raw_base(repo: str, branch: str) -> str:
    """Build the raw content base URL for a GitHub repo."""
    return f"https://raw.githubusercontent.com/{repo}/{branch}"


def install_anthropic_skill(
    name: str,
    dest_dir: Path,
    registry: ExternalRegistry,
) -> None:
    """
    Install a skill from the Anthropic skills GitHub repository.

    This implementation is intentionally minimal: it downloads SKILL.md and,
    if present, any additional files in the skill directory via GitHub's
    contents API.
    """
    if not registry.repo:
        raise RuntimeError("Anthropic skills registry configuration is missing 'repo'")

    dest_dir.mkdir(parents=True, exist_ok=True)

    raw_base = _github_raw_base(registry.repo, registry.branch)

    # Always fetch SKILL.md
    skill_md_url = f"{raw_base}/{name}/SKILL.md"
    with httpx.Client(follow_redirects=True, timeout=30.0) as client:
        resp = client.get(skill_md_url)
        if resp.status_code != 200:
            raise RuntimeError(
                f"Failed to download Anthropic skill '{name}' from {skill_md_url} "
                f"(status {resp.status_code})"
            )
        (dest_dir / "SKILL.md").write_bytes(resp.content)

    # Optionally fetch other files in the skill directory using GitHub API
    # This keeps SKILL.md working even if listing fails.
    api_url = f"https://api.github.com/repos/{registry.repo}/contents/{name}"
    with httpx.Client(follow_redirects=True, timeout=30.0) as client:
        resp = client.get(api_url)
        if resp.status_code != 200:
            return
        try:
            items = resp.json()
        except Exception:
            return

        for item in items:
            item_name = item.get("name")
            download_url = item.get("download_url")
            if not item_name or not download_url:
                continue
            if item_name == "SKILL.md":
                continue

            target_path = dest_dir / item_name
            file_resp = client.get(download_url)
            if file_resp.status_code != 200:
                continue
            target_path.write_bytes(file_resp.content)


def resolve_and_install_external_dependency(dep: dict, package_root: Path) -> None:
    """
    Resolve and install a single external dependency under the given package root.

    The dep dict is one element of the externalDependencies array from ara.json.
    """
    registry_id = dep.get("registry")
    name = dep.get("name")
    path = dep.get("path")

    if not registry_id or not name:
        return

    registry = get_external_registry(registry_id)
    if not registry:
        # Not in allowlist; ignore rather than failing the whole install
        return

    # Default path convention if none supplied
    if not path:
        safe_name = name.replace("/", "_")
        path = f"external/{registry_id.replace('/', '_')}/{safe_name}"

    dest_dir = package_root / path

    if registry.type == "anthropic_skills_github":
        install_anthropic_skill(name=name, dest_dir=dest_dir, registry=registry)
    else:
        # Unknown external registry type; ignore for now
        return

