"""ARA CLI for GitHub registry."""

import json
import os
import re
import sys
import tarfile
import tempfile
from pathlib import Path
from typing import Optional

import click
import zstandard as zstd
from pydantic import BaseModel, EmailStr, Field, ValidationError

from . import client, index


class AraManifest(BaseModel):
    """Pydantic model for ara.json validation."""
    
    name: str = Field(pattern=r"^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$", min_length=3, max_length=200)
    version: str = Field(
        pattern=r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
        r"(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)"
        r"(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))"
        r"?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$"
    )
    description: str = Field(min_length=1, max_length=500)
    author: EmailStr
    tags: list[str] = Field(min_items=1)
    type: str = Field(
        default="kiro-agent",
        pattern=r"^(kiro-agent|mcp-server|context|skill|kiro-powers|kiro-steering|agents-md)$"
    )
    files: Optional[list[str]] = None
    license: Optional[str] = Field(default=None, max_length=100)
    homepage: Optional[str] = None
    repository: Optional[str] = None
    dependencies: Optional[dict[str, str]] = None
    sources: Optional[list[dict]] = None


def _validate_manifest(manifest_path: Path) -> tuple[dict, str, str, str]:
    """
    Validate ara.json manifest.
    
    Returns (manifest_dict, namespace, name, version).
    """
    try:
        with open(manifest_path) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        click.echo(f"Error: Invalid JSON in ara.json: {e}", err=True)
        sys.exit(1)
    
    try:
        manifest = AraManifest(**data)
    except ValidationError as e:
        click.echo(f"Error: Invalid ara.json:\n{e}", err=True)
        sys.exit(1)
    
    # Extract namespace and name
    namespace, name = manifest.name.split("/", 1)
    
    return data, namespace, name, manifest.version


def _build_archive(package_dir: Path, manifest: dict, output_path: Path) -> None:
    """Build a .tar.zst archive of the package."""
    files_list = manifest.get("files")
    
    # Create temporary tar file
    with tempfile.NamedTemporaryFile(suffix=".tar", delete=False) as tmp_tar:
        tmp_tar_path = Path(tmp_tar.name)
    
    try:
        with tarfile.open(tmp_tar_path, "w") as tar:
            # Always include ara.json
            tar.add(package_dir / "ara.json", arcname="ara.json")
            
            if files_list is None:
                # Include all files except common ignores
                ignores = {".git", "node_modules", "__pycache__", "target", ".DS_Store"}
                for item in package_dir.rglob("*"):
                    if item.is_file() and item.name != "ara.json":
                        # Check if any parent is in ignores
                        if not any(part in ignores for part in item.parts):
                            arcname = item.relative_to(package_dir)
                            tar.add(item, arcname=str(arcname))
            elif files_list:
                # Include only specified files
                for file_path in files_list:
                    full_path = package_dir / file_path
                    
                    # Security: prevent path traversal
                    try:
                        full_path.resolve().relative_to(package_dir.resolve())
                    except ValueError:
                        click.echo(f"Error: Path escapes package root: {file_path}", err=True)
                        sys.exit(1)
                    
                    if not full_path.exists():
                        click.echo(f"Warning: File not found: {file_path}", err=True)
                        continue
                    
                    if full_path.is_dir():
                        # Add directory recursively
                        for item in full_path.rglob("*"):
                            if item.is_file():
                                arcname = item.relative_to(package_dir)
                                tar.add(item, arcname=str(arcname))
                    else:
                        # Add single file
                        arcname = full_path.relative_to(package_dir)
                        tar.add(full_path, arcname=str(arcname))
        
        # Compress with zstd
        with open(tmp_tar_path, "rb") as f_in:
            tar_data = f_in.read()
        
        cctx = zstd.ZstdCompressor(level=19)
        compressed = cctx.compress(tar_data)
        
        output_path.write_bytes(compressed)
    
    finally:
        tmp_tar_path.unlink(missing_ok=True)


def _safe_extract(archive_path: Path, dest_dir: Path) -> None:
    """Safely extract a .tar.zst archive with path traversal protection."""
    # Decompress zstd
    with open(archive_path, "rb") as f:
        compressed = f.read()
    
    dctx = zstd.ZstdDecompressor()
    tar_data = dctx.decompress(compressed)
    
    # Extract tar
    with tempfile.NamedTemporaryFile(suffix=".tar", delete=False) as tmp_tar:
        tmp_tar.write(tar_data)
        tmp_tar_path = Path(tmp_tar.name)
    
    try:
        with tarfile.open(tmp_tar_path, "r") as tar:
            for member in tar.getmembers():
                # Security: check for path traversal
                member_path = Path(member.name)
                if member_path.is_absolute() or ".." in member_path.parts:
                    click.echo(f"Error: Unsafe path in archive: {member.name}", err=True)
                    sys.exit(1)
                
                tar.extract(member, dest_dir)
    finally:
        tmp_tar_path.unlink(missing_ok=True)


@click.group()
def main():
    """ARA registry CLI backed by GitHub."""
    pass


@main.command()
@click.option("-p", "--path", type=click.Path(exists=True), default=".", help="Package directory")
def publish(path: str):
    """Publish a package to the registry."""
    # Check for required env vars
    try:
        from . import http
        http.get_github_repo()
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        click.echo("Error: GITHUB_TOKEN environment variable is required for publishing", err=True)
        sys.exit(1)
    
    package_dir = Path(path).resolve()
    manifest_path = package_dir / "ara.json"
    
    if not manifest_path.exists():
        click.echo("Error: ara.json not found in package directory", err=True)
        sys.exit(1)
    
    # Validate manifest
    manifest, namespace, name, version = _validate_manifest(manifest_path)
    
    # Get current user
    try:
        username = index.get_current_user()
    except Exception as e:
        click.echo(f"Error: Failed to get GitHub user: {e}", err=True)
        sys.exit(1)
    
    # Check ownership
    ownership_error = index.check_ownership(namespace, name, username)
    if ownership_error:
        click.echo(f"Error: {ownership_error}", err=True)
        sys.exit(1)
    
    # Check for duplicate version
    idx = index.fetch_index()
    for pkg in idx:
        if pkg.get("namespace") == namespace and pkg.get("name") == name:
            if version in pkg.get("versions", []):
                click.echo(f"Error: Version {version} already exists for {namespace}/{name}.", err=True)
                sys.exit(1)
    
    # Build archive
    click.echo(f"Building package {namespace}/{name}@{version}...")
    with tempfile.NamedTemporaryFile(suffix=".tar.zst", delete=False) as tmp:
        archive_path = Path(tmp.name)
    
    try:
        _build_archive(package_dir, manifest, archive_path)
        archive_size = archive_path.stat().st_size
        click.echo(f"Archive size: {archive_size} bytes")
        
        # Publish
        click.echo("Publishing to registry...")
        client.publish(namespace, name, version, manifest, archive_path, username)
        click.echo(f"Published {namespace}/{name}@{version}")
    
    finally:
        archive_path.unlink(missing_ok=True)


@main.command()
@click.argument("query", required=False)
@click.option("-t", "--tags", help="Filter by tags (comma-separated)")
@click.option("-n", "--namespace", help="Filter by namespace")
@click.option("--type", "pkg_type", help="Filter by package type")
def search(query: Optional[str], tags: Optional[str], namespace: Optional[str], pkg_type: Optional[str]):
    """Search for packages in the registry."""
    idx = index.fetch_index()
    
    tag_list = tags.split(",") if tags else None
    results = index.search(idx, q=query, tags=tag_list, namespace=namespace, pkg_type=pkg_type)
    
    if not results:
        click.echo("No packages found.")
        return
    
    click.echo(f"Found {len(results)} package(s):\n")
    for pkg in results:
        ns = pkg.get("namespace", "")
        name = pkg.get("name", "")
        version = pkg.get("latest_version", "")
        desc = pkg.get("description", "")
        pkg_tags = ", ".join(pkg.get("tags", []))
        
        click.echo(f"{ns}/{name}@{version}")
        click.echo(f"  {desc}")
        click.echo(f"  Tags: {pkg_tags}")
        click.echo()


@main.command()
@click.argument("package")
@click.option("-v", "--version", help="Specific version to install")
@click.option("-o", "--output", type=click.Path(), default=".", help="Output directory")
def install(package: str, version: Optional[str], output: str):
    """Install a package from the registry."""
    if "/" not in package:
        click.echo("Error: Package must be in format: namespace/name", err=True)
        sys.exit(1)
    
    namespace, name = package.split("/", 1)
    
    # Resolve version
    if not version:
        idx = index.fetch_index()
        for pkg in idx:
            if pkg.get("namespace") == namespace and pkg.get("name") == name:
                version = pkg.get("latest_version")
                break
        
        if not version:
            click.echo(f"Error: Package {package} not found", err=True)
            sys.exit(1)
    
    click.echo(f"Installing {namespace}/{name}@{version}...")
    
    # Download archive
    with tempfile.NamedTemporaryFile(suffix=".tar.zst", delete=False) as tmp:
        archive_path = Path(tmp.name)
    
    try:
        client.download_archive(namespace, name, version, archive_path)
        
        # Extract
        output_dir = Path(output).resolve()
        output_dir.mkdir(parents=True, exist_ok=True)
        _safe_extract(archive_path, output_dir)
        
        click.echo(f"Installed to {output_dir}")
    
    except FileNotFoundError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    finally:
        archive_path.unlink(missing_ok=True)


@main.command()
@click.argument("package")
def info(package: str):
    """Show package information."""
    if "/" not in package:
        click.echo("Error: Package must be in format: namespace/name", err=True)
        sys.exit(1)
    
    namespace, name = package.split("/", 1)
    
    idx = index.fetch_index()
    pkg = None
    for p in idx:
        if p.get("namespace") == namespace and p.get("name") == name:
            pkg = p
            break
    
    if not pkg:
        click.echo(f"Error: Package {package} not found", err=True)
        sys.exit(1)
    
    click.echo(f"Package: {namespace}/{name}")
    click.echo(f"Description: {pkg.get('description', '')}")
    click.echo(f"Type: {pkg.get('type', 'kiro-agent')}")
    click.echo(f"Latest version: {pkg.get('latest_version', '')}")
    click.echo(f"All versions: {', '.join(pkg.get('versions', []))}")
    click.echo(f"Tags: {', '.join(pkg.get('tags', []))}")
    click.echo(f"Downloads: {pkg.get('total_downloads', 0)}")


@main.command()
@click.argument("package")
def unpublish(package: str):
    """Unpublish a package version."""
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        click.echo("Error: GITHUB_TOKEN environment variable is required", err=True)
        sys.exit(1)
    
    if "@" not in package:
        click.echo("Error: Package must be in format: namespace/name@version", err=True)
        sys.exit(1)
    
    pkg_name, version = package.rsplit("@", 1)
    if "/" not in pkg_name:
        click.echo("Error: Package must be in format: namespace/name@version", err=True)
        sys.exit(1)
    
    namespace, name = pkg_name.split("/", 1)
    
    # Get current user
    try:
        username = index.get_current_user()
    except Exception as e:
        click.echo(f"Error: Failed to get GitHub user: {e}", err=True)
        sys.exit(1)
    
    # Check ownership
    ownership_error = index.check_ownership(namespace, name, username)
    if ownership_error:
        click.echo(f"Error: {ownership_error}", err=True)
        sys.exit(1)
    
    click.echo(f"Unpublishing {namespace}/{name}@{version}...")
    client.unpublish(namespace, name, version, username)
    click.echo(f"Unpublished {namespace}/{name}@{version}")


@main.command()
@click.argument("package")
@click.confirmation_option(prompt="Are you sure you want to delete this package and all its versions?")
def delete(package: str):
    """Delete a package and all its versions."""
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        click.echo("Error: GITHUB_TOKEN environment variable is required", err=True)
        sys.exit(1)
    
    if "/" not in package:
        click.echo("Error: Package must be in format: namespace/name", err=True)
        sys.exit(1)
    
    namespace, name = package.split("/", 1)
    
    # Get current user
    try:
        username = index.get_current_user()
    except Exception as e:
        click.echo(f"Error: Failed to get GitHub user: {e}", err=True)
        sys.exit(1)
    
    # Check ownership
    ownership_error = index.check_ownership(namespace, name, username)
    if ownership_error:
        click.echo(f"Error: {ownership_error}", err=True)
        sys.exit(1)
    
    click.echo(f"Deleting {namespace}/{name}...")
    client.delete_all(namespace, name, username)
    click.echo(f"Deleted {namespace}/{name}")


if __name__ == "__main__":
    main()
