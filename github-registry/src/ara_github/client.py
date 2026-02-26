"""GitHub API client for ARA registry operations."""

import base64
import json
import time
import uuid
from pathlib import Path
from typing import Optional

import httpx

from . import http

# Constants
PUBLISH_WORKFLOW = "publish.yml"
MAX_CHUNK_SIZE = 65000  # Conservative limit for workflow_dispatch input
MAX_CHUNKS = 16  # GitHub allows 25 inputs total, we use 9 for metadata


def _release_tag(namespace: str, name: str, version: str) -> str:
    """Generate release tag for a package version."""
    return f"ara/{namespace}/{name}/v{version}"


def _get_release_by_tag(tag: str) -> dict:
    """Get release by tag name."""
    url = f"{http.api_base()}/releases/tags/{tag}"
    with http.get_client() as client:
        response = client.get(url)
        if response.status_code == 404:
            raise FileNotFoundError(f"Release not found: {tag}")
        response.raise_for_status()
        return response.json()


def _trigger_workflow(workflow_file: str, inputs: dict) -> dict:
    """
    Trigger a workflow_dispatch and poll until completion.
    
    Returns the workflow run result dict with 'conclusion' field.
    Raises an exception if the workflow fails.
    """
    # Generate unique dispatch ID for matching
    dispatch_id = str(uuid.uuid4())
    inputs["dispatch_id"] = dispatch_id
    
    # Trigger the workflow
    url = f"{http.api_base()}/actions/workflows/{workflow_file}/dispatches"
    with http.get_client() as client:
        response = client.post(url, json={"ref": "main", "inputs": inputs})
        response.raise_for_status()
    
    # Poll for the workflow run
    runs_url = f"{http.api_base()}/actions/runs"
    run_id = None
    
    # Wait a bit for the run to appear
    time.sleep(2)
    
    # Find the run by dispatch_id (poll for up to 30 seconds)
    for _ in range(15):
        with http.get_client() as client:
            response = client.get(runs_url, params={"event": "workflow_dispatch"})
            response.raise_for_status()
            runs = response.json().get("workflow_runs", [])
            
            # Look for our dispatch_id in the run's inputs
            for run in runs:
                # The run must be recent (within last 5 minutes)
                created_at = run.get("created_at", "")
                if not created_at:
                    continue
                    
                # Check if this is our run by fetching the workflow jobs
                # (dispatch inputs aren't directly available in the runs API)
                # We'll use a heuristic: most recent workflow_dispatch run
                # that started after we triggered it
                if run.get("name") == workflow_file.replace(".yml", ""):
                    run_id = run["id"]
                    break
            
            if run_id:
                break
        
        time.sleep(2)
    
    if not run_id:
        # Fallback: use the most recent workflow_dispatch run
        with http.get_client() as client:
            response = client.get(runs_url, params={"event": "workflow_dispatch", "per_page": 1})
            response.raise_for_status()
            runs = response.json().get("workflow_runs", [])
            if runs:
                run_id = runs[0]["id"]
    
    if not run_id:
        raise RuntimeError("Failed to find workflow run after triggering")
    
    # Poll the run status until completion
    run_url = f"{http.api_base()}/actions/runs/{run_id}"
    
    for _ in range(60):  # Poll for up to 2 minutes
        with http.get_client() as client:
            response = client.get(run_url)
            response.raise_for_status()
            run = response.json()
            
            status = run.get("status")
            conclusion = run.get("conclusion")
            
            if status == "completed":
                if conclusion != "success":
                    # Fetch job logs for error details
                    jobs_url = f"{http.api_base()}/actions/runs/{run_id}/jobs"
                    jobs_response = client.get(jobs_url)
                    jobs_response.raise_for_status()
                    jobs = jobs_response.json().get("jobs", [])
                    
                    error_msg = f"Workflow failed with conclusion: {conclusion}"
                    if jobs:
                        job = jobs[0]
                        error_msg += f"\nJob: {job.get('name')}"
                        for step in job.get("steps", []):
                            if step.get("conclusion") == "failure":
                                error_msg += f"\nFailed step: {step.get('name')}"
                    
                    raise RuntimeError(error_msg)
                
                return run
        
        time.sleep(2)
    
    raise TimeoutError("Workflow did not complete within timeout")


def publish(
    namespace: str,
    name: str,
    version: str,
    manifest: dict,
    archive_path: Path,
    username: str,
) -> dict:
    """
    Publish a package by creating a GitHub issue.
    
    The issue will be processed by a GitHub Actions workflow.
    """
    # Read and encode the archive
    archive_data = archive_path.read_bytes()
    encoded = base64.b85encode(archive_data).decode("ascii")
    
    # Create issue body with package data
    issue_title = f"[PUBLISH] {namespace}/{name}@{version}"
    issue_body = f"""## Package Publication Request

**Package**: `{namespace}/{name}`
**Version**: `{version}`
**Publisher**: @{username}

### Manifest
```json
{json.dumps(manifest, indent=2)}
```

### Package Data
```
{encoded}
```

---
*This issue was created automatically by the ARA CLI. It will be processed by GitHub Actions.*
"""
    
    # Create the issue
    url = f"{http.api_base()}/issues"
    with http.get_client() as client:
        try:
            response = client.post(
                url,
                json={
                    "title": issue_title,
                    "body": issue_body,
                    "labels": ["ara-publish"],
                },
            )
            response.raise_for_status()
        except Exception as e:
            if "403" in str(e):
                raise RuntimeError(
                    "Permission denied. Your GitHub token needs 'Issues: Read and write' permission.\n"
                    "For fine-grained tokens: Add 'Issues: Read and write' to the repository.\n"
                    "For classic tokens: Use 'public_repo' or 'repo' scope.\n"
                    f"Original error: {e}"
                )
            raise
        issue = response.json()
    
    issue_number = issue["number"]
    issue_url = issue["html_url"]
    
    print(f"Created issue #{issue_number}: {issue_url}")
    print("Waiting for workflow to process...")
    
    # Poll the issue for completion
    for attempt in range(60):  # Poll for up to 2 minutes
        time.sleep(2)
        
        with http.get_client() as client:
            # Check issue state and comments
            issue_url_api = f"{http.api_base()}/issues/{issue_number}"
            response = client.get(issue_url_api)
            response.raise_for_status()
            issue_data = response.json()
            
            # If issue is closed, it's done
            if issue_data.get("state") == "closed":
                print(f"✅ Published {namespace}/{name}@{version}")
                return {"status": "success", "issue": issue_number}
            
            # Check comments for status
            comments_url = f"{http.api_base()}/issues/{issue_number}/comments"
            response = client.get(comments_url)
            response.raise_for_status()
            comments = response.json()
            
            for comment in comments:
                body = comment.get("body", "")
                if "✅ Published successfully" in body:
                    print(f"✅ Published {namespace}/{name}@{version}")
                    return {"status": "success", "issue": issue_number}
                elif "❌ Publication failed" in body:
                    raise RuntimeError(f"Publication failed. See issue #{issue_number} for details: {issue_url}")
    
    # Timeout - but check one more time if it succeeded
    with http.get_client() as client:
        issue_url_api = f"{http.api_base()}/issues/{issue_number}"
        response = client.get(issue_url_api)
        response.raise_for_status()
        issue_data = response.json()
        
        if issue_data.get("state") == "closed":
            print(f"✅ Published {namespace}/{name}@{version}")
            return {"status": "success", "issue": issue_number}
    
    print(f"⚠️  Publication may have succeeded. Check issue #{issue_number} for status: {issue_url}")
    return {"status": "unknown", "issue": issue_number}


def download_manifest(namespace: str, name: str, version: str) -> dict:
    """Download and parse the ara.json manifest for a package version."""
    tag = _release_tag(namespace, name, version)
    release = _get_release_by_tag(tag)
    
    # Find ara.json asset
    ara_json_asset = None
    for asset in release.get("assets", []):
        if asset["name"] == "ara.json":
            ara_json_asset = asset
            break
    
    if not ara_json_asset:
        raise FileNotFoundError(f"ara.json not found in release {tag}")
    
    # Download the asset
    asset_url = ara_json_asset["url"]
    with http.get_client() as client:
        response = client.get(asset_url, headers={"Accept": "application/octet-stream"})
        response.raise_for_status()
        return json.loads(response.content)


def download_url(namespace: str, name: str, version: str) -> str:
    """Get the download URL for a package archive."""
    tag = _release_tag(namespace, name, version)
    release = _get_release_by_tag(tag)
    
    # Find package.tar.zst asset
    for asset in release.get("assets", []):
        if asset["name"] == "package.tar.zst":
            return asset["browser_download_url"]
    
    raise FileNotFoundError(f"package.tar.zst not found in release {tag}")


def download_archive(namespace: str, name: str, version: str, dest: Path) -> str:
    """Download package archive to destination path."""
    tag = _release_tag(namespace, name, version)
    release = _get_release_by_tag(tag)
    
    # Find package.tar.zst asset
    asset = None
    for a in release.get("assets", []):
        if a["name"] == "package.tar.zst":
            asset = a
            break
    
    if not asset:
        raise FileNotFoundError(f"package.tar.zst not found in release {tag}")
    
    # Download the asset
    asset_url = asset["url"]
    with http.get_client(timeout=120.0) as client:
        with client.stream("GET", asset_url, headers={"Accept": "application/octet-stream"}) as response:
            response.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in response.iter_bytes(chunk_size=8192):
                    f.write(chunk)
    
    return str(dest)


def unpublish(namespace: str, name: str, version: str, username: str) -> None:
    """Unpublish a package version by creating a GitHub issue."""
    issue_title = f"[UNPUBLISH] {namespace}/{name}@{version}"
    issue_body = f"""## Package Unpublish Request

**Package**: `{namespace}/{name}`
**Version**: `{version}`
**Requester**: @{username}

---
*This issue was created automatically by the ARA CLI.*
"""
    
    url = f"{http.api_base()}/issues"
    with http.get_client() as client:
        response = client.post(
            url,
            json={
                "title": issue_title,
                "body": issue_body,
                "labels": ["ara-unpublish"],
            },
        )
        response.raise_for_status()
        issue = response.json()
    
    print(f"Created unpublish request: {issue['html_url']}")


def delete_all(namespace: str, name: str, username: str) -> None:
    """Delete all versions of a package by creating a GitHub issue."""
    issue_title = f"[DELETE] {namespace}/{name}"
    issue_body = f"""## Package Delete Request

**Package**: `{namespace}/{name}`
**Requester**: @{username}

---
*This issue was created automatically by the ARA CLI.*
"""
    
    url = f"{http.api_base()}/issues"
    with http.get_client() as client:
        response = client.post(
            url,
            json={
                "title": issue_title,
                "body": issue_body,
                "labels": ["ara-delete"],
            },
        )
        response.raise_for_status()
        issue = response.json()
    
    print(f"Created delete request: {issue['html_url']}")
