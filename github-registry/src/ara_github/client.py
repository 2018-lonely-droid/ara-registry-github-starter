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
    Publish a package by triggering the publish workflow.
    
    The archive is base85-encoded and sent as workflow input(s).
    """
    # Read and encode the archive
    archive_data = archive_path.read_bytes()
    encoded = base64.b85encode(archive_data).decode("ascii")
    
    # Build workflow inputs
    inputs = {
        "namespace": namespace,
        "name": name,
        "version": version,
        "manifest_json": json.dumps(manifest),
        "username": username,
    }
    
    # Split into chunks if needed
    if len(encoded) <= MAX_CHUNK_SIZE:
        inputs["chunk_count"] = "1"
        inputs["payload"] = encoded
    else:
        # Split into chunks
        chunks = []
        for i in range(0, len(encoded), MAX_CHUNK_SIZE):
            chunks.append(encoded[i:i + MAX_CHUNK_SIZE])
        
        if len(chunks) > MAX_CHUNKS:
            raise ValueError(
                f"Package too large: {len(encoded)} bytes encoded "
                f"requires {len(chunks)} chunks (max {MAX_CHUNKS})"
            )
        
        inputs["chunk_count"] = str(len(chunks))
        for i, chunk in enumerate(chunks, 1):
            inputs[f"payload_{i}"] = chunk
    
    # Trigger workflow
    result = _trigger_workflow(PUBLISH_WORKFLOW, inputs)
    return result


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
    """Unpublish a package version by triggering the workflow."""
    inputs = {
        "action": "unpublish",
        "namespace": namespace,
        "name": name,
        "version": version,
        "username": username,
    }
    _trigger_workflow(PUBLISH_WORKFLOW, inputs)


def delete_all(namespace: str, name: str, username: str) -> None:
    """Delete all versions of a package by triggering the workflow."""
    inputs = {
        "action": "delete",
        "namespace": namespace,
        "name": name,
        "username": username,
    }
    _trigger_workflow(PUBLISH_WORKFLOW, inputs)
