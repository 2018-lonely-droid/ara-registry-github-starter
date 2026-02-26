"""Shared HTTP client for GitHub API interactions."""

import os
from typing import Optional

import httpx


def get_github_token() -> Optional[str]:
    """Get GitHub token from environment."""
    return os.getenv("GITHUB_TOKEN")


def get_github_repo() -> str:
    """Get GitHub repository from environment in owner/repo format."""
    repo = os.getenv("GITHUB_REPO")
    if not repo:
        raise ValueError("GITHUB_REPO environment variable is required (format: owner/repo)")
    if "/" not in repo:
        raise ValueError("GITHUB_REPO must be in format: owner/repo")
    return repo


def get_github_api_url() -> str:
    """Get GitHub API base URL, defaults to public GitHub."""
    return os.getenv("GITHUB_API_URL", "https://api.github.com")


def api_base() -> str:
    """Get the base API URL for the configured repository."""
    return f"{get_github_api_url()}/repos/{get_github_repo()}"


def headers() -> dict[str, str]:
    """Build headers for GitHub API requests."""
    h = {"Accept": "application/vnd.github+json"}
    token = get_github_token()
    if token:
        h["Authorization"] = f"token {token}"
    return h


def get_client(timeout: float = 30.0) -> httpx.Client:
    """Create an HTTP client configured for GitHub API."""
    return httpx.Client(
        headers=headers(),
        follow_redirects=True,
        timeout=timeout,
    )
