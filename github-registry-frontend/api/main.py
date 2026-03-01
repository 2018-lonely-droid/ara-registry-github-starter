"""FastAPI backend for ARA Registry website."""

import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="ARA Registry API", version="1.0.0")

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to registry data
REGISTRY_PATH = Path(__file__).parent.parent.parent / "registry"
INDEX_FILE = REGISTRY_PATH / "index.json"
OWNERSHIP_FILE = REGISTRY_PATH / "ownership.json"


def load_index() -> list[dict]:
    """Load the registry index."""
    if not INDEX_FILE.exists():
        return []
    with open(INDEX_FILE) as f:
        return json.load(f)


def load_ownership() -> dict:
    """Load ownership data."""
    if not OWNERSHIP_FILE.exists():
        return {"namespaces": {}, "packages": {}}
    with open(OWNERSHIP_FILE) as f:
        return json.load(f)


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/stats")
async def get_stats():
    """Get registry statistics."""
    index = load_index()
    
    total_packages = len(index)
    total_downloads = sum(pkg.get("total_downloads", 0) for pkg in index)
    namespaces = set(pkg.get("namespace") for pkg in index)
    total_namespaces = len(namespaces)
    
    # Package types breakdown
    types = {}
    for pkg in index:
        pkg_type = pkg.get("type", "kiro-agent")
        types[pkg_type] = types.get(pkg_type, 0) + 1
    
    return {
        "total_packages": total_packages,
        "total_downloads": total_downloads,
        "total_namespaces": total_namespaces,
        "package_types": types,
    }


@app.get("/api/packages")
async def list_packages(
    q: Optional[str] = Query(None, description="Search query"),
    type: Optional[str] = Query(None, description="Filter by package type"),
    namespace: Optional[str] = Query(None, description="Filter by namespace"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    sort: str = Query("updated", description="Sort by: updated, created, downloads, name"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List and search packages."""
    index = load_index()
    results = index
    
    # Apply filters
    if namespace:
        results = [p for p in results if p.get("namespace") == namespace]
    
    if type:
        results = [p for p in results if p.get("type") == type]
    
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        results = [
            p for p in results
            if any(tag in p.get("tags", []) for tag in tag_list)
        ]
    
    if q:
        q_lower = q.lower()
        results = [
            p for p in results
            if q_lower in p.get("name", "").lower()
            or q_lower in p.get("description", "").lower()
            or q_lower in p.get("namespace", "").lower()
        ]
    
    # Sort
    if sort == "updated":
        results.sort(key=lambda p: p.get("updated_at", ""), reverse=True)
    elif sort == "created":
        results.sort(key=lambda p: p.get("created_at", ""), reverse=True)
    elif sort == "downloads":
        results.sort(key=lambda p: p.get("total_downloads", 0), reverse=True)
    elif sort == "name":
        results.sort(key=lambda p: f"{p.get('namespace', '')}/{p.get('name', '')}")
    
    # Pagination
    total = len(results)
    results = results[offset:offset + limit]
    
    return {
        "packages": results,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/api/packages/{namespace}/{name}")
async def get_package(namespace: str, name: str):
    """Get package details."""
    index = load_index()
    ownership = load_ownership()
    
    # Find package
    pkg = None
    for p in index:
        if p.get("namespace") == namespace and p.get("name") == name:
            pkg = p
            break
    
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Add owner info
    pkg_key = f"{namespace}/{name}"
    owner = ownership.get("packages", {}).get(pkg_key)
    if owner:
        pkg["owner"] = owner
    
    return pkg


@app.get("/api/namespaces")
async def list_namespaces():
    """List all namespaces with package counts."""
    index = load_index()
    ownership = load_ownership()
    
    namespaces = {}
    for pkg in index:
        ns = pkg.get("namespace")
        if ns not in namespaces:
            namespaces[ns] = {
                "namespace": ns,
                "package_count": 0,
                "owner": ownership.get("namespaces", {}).get(ns),
            }
        namespaces[ns]["package_count"] += 1
    
    return {"namespaces": list(namespaces.values())}


@app.get("/api/tags")
async def list_tags():
    """List all tags with usage counts."""
    index = load_index()
    
    tags = {}
    for pkg in index:
        for tag in pkg.get("tags", []):
            tags[tag] = tags.get(tag, 0) + 1
    
    # Sort by usage
    sorted_tags = sorted(tags.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "tags": [{"tag": tag, "count": count} for tag, count in sorted_tags]
    }


# Mount static files (frontend)
app.mount("/", StaticFiles(directory=Path(__file__).parent.parent / "static", html=True), name="static")
