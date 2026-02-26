"""Registry index management (read-only from CLI)."""

import base64
import json
from typing import Optional

from . import http


def fetch_index() -> list[dict]:
    """Fetch the registry index from GitHub."""
    url = f"{http.api_base()}/contents/registry/index.json"
    
    try:
        with http.get_client() as client:
            response = client.get(url)
            if response.status_code == 404:
                return []
            response.raise_for_status()
            
            data = response.json()
            content = base64.b64decode(data["content"]).decode("utf-8")
            return json.loads(content)
    except Exception:
        return []


def fetch_ownership() -> dict:
    """Fetch the ownership data from GitHub."""
    url = f"{http.api_base()}/contents/registry/ownership.json"
    
    try:
        with http.get_client() as client:
            response = client.get(url)
            if response.status_code == 404:
                return {"namespaces": {}, "packages": {}}
            response.raise_for_status()
            
            data = response.json()
            content = base64.b64decode(data["content"]).decode("utf-8")
            return json.loads(content)
    except Exception:
        return {"namespaces": {}, "packages": {}}


def search(
    index: list[dict],
    q: Optional[str] = None,
    tags: Optional[list[str]] = None,
    namespace: Optional[str] = None,
    pkg_type: Optional[str] = None,
) -> list[dict]:
    """Filter index by search criteria."""
    results = index
    
    if namespace:
        results = [p for p in results if p.get("namespace") == namespace]
    
    if pkg_type:
        results = [p for p in results if p.get("type") == pkg_type]
    
    if tags:
        results = [
            p for p in results
            if any(tag in p.get("tags", []) for tag in tags)
        ]
    
    if q:
        q_lower = q.lower()
        results = [
            p for p in results
            if q_lower in p.get("name", "").lower()
            or q_lower in p.get("description", "").lower()
        ]
    
    return results


def check_ownership(namespace: str, name: Optional[str], username: str) -> Optional[str]:
    """
    Check if user owns the namespace or package.
    
    Returns None if user has permission, or an error message if not.
    """
    ownership = fetch_ownership()
    
    # Check namespace ownership
    ns_owner = ownership.get("namespaces", {}).get(namespace)
    if ns_owner and ns_owner != username:
        return f"Namespace '{namespace}' is owned by {ns_owner}"
    
    # Check package ownership if name is provided
    if name:
        pkg_key = f"{namespace}/{name}"
        pkg_owner = ownership.get("packages", {}).get(pkg_key)
        if pkg_owner and pkg_owner != username:
            return f"Package '{pkg_key}' is owned by {pkg_owner}"
    
    return None


def get_current_user() -> str:
    """Get the current user's GitHub username."""
    url = f"{http.get_github_api_url()}/user"
    
    with http.get_client() as client:
        response = client.get(url)
        response.raise_for_status()
        return response.json()["login"]
