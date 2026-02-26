# ARA Registry - GitHub Implementation

An open-source ARA (AI Registry for Agents) registry implementation using only GitHub's native components. No external databases, storage services, or servers to deploy.

## How It Works

This implementation maps every ARA concept to a GitHub-native component:

| ARA Concept | GitHub Component |
|---|---|
| Package archive storage | GitHub Releases (assets) |
| Manifest storage | GitHub Releases (ara.json asset) |
| Authentication | GitHub Personal Access Token |
| Search index | `registry/index.json` in repo |
| Ownership tracking | `registry/ownership.json` in repo |
| CI validation | GitHub Actions |
| CLI distribution | GitHub Releases or PyPI |

### Architecture

```
┌─────────────┐
│  CLI User   │
└──────┬──────┘
       │
       │ publish (triggers workflow_dispatch)
       ▼
┌─────────────────────────────────┐
│  GitHub Actions Workflow        │
│  - Decodes base85 payload       │
│  - Creates GitHub Release       │
│  - Uploads package.tar.zst      │
│  - Uploads ara.json             │
│  - Updates registry/index.json  │
└─────────────────────────────────┘
       │
       │ creates
       ▼
┌─────────────────────────────────┐
│  GitHub Release                 │
│  Tag: ara/ns/name/v1.0.0        │
│  Assets:                        │
│    - package.tar.zst            │
│    - ara.json                   │
└─────────────────────────────────┘
```

**Key Design**: Publishing works via `workflow_dispatch` - the CLI base85-encodes the package and sends it as workflow input. The GitHub Action (running with repo write access) decodes it, creates the release, and updates the index. This allows anyone with a GitHub PAT to publish without needing direct write access to the registry repo.

## Prerequisites

- Python 3.10 or higher
- pip or uv for package installation
- GitHub Personal Access Token with `public_repo` scope

## Setup

### 1. Create a GitHub Personal Access Token

Go to [github.com/settings/tokens](https://github.com/settings/tokens) and create a new token with the `public_repo` scope (needed to trigger workflows on public repos).

### 2. Set Environment Variables

```bash
export GITHUB_REPO=owner/repo  # Your registry repository
export GITHUB_TOKEN=ghp_xxxx   # Your GitHub PAT
```

For GitHub Enterprise, also set:

```bash
export GITHUB_API_URL=https://github.example.com/api/v3
```

### 3. Install the CLI

From PyPI (when published):

```bash
pip install ara-github
```

Or from source:

```bash
cd github-registry
pip install -e .
```

Or from a GitHub release:

```bash
pip install https://github.com/owner/repo/releases/download/v0.0.1/ara_github-0.0.1-py3-none-any.whl
```

## Usage

### Publish a Package

Create an `ara.json` manifest in your package directory:

```json
{
  "name": "acme/weather-agent",
  "version": "1.0.0",
  "description": "AI agent for weather information",
  "author": "team@acme.com",
  "tags": ["weather", "api"],
  "type": "kiro-agent",
  "files": ["prompts/", "config.json"]
}
```

Publish:

```bash
ara publish -p /path/to/package
```

The CLI will:
1. Validate the manifest
2. Check ownership (first-come, first-served)
3. Build a `.tar.zst` archive
4. Base85-encode it
5. Trigger the GitHub Actions workflow
6. Poll until the workflow completes

### Search for Packages

```bash
# Search by name or description
ara search "weather"

# Filter by tags
ara search -t weather,api

# Filter by namespace
ara search -n acme

# Filter by type
ara search --type kiro-agent
```

### Install a Package

```bash
# Install latest version
ara install acme/weather-agent

# Install specific version
ara install acme/weather-agent -v 1.0.0

# Install to custom directory
ara install acme/weather-agent -o /path/to/output
```

### Get Package Info

```bash
ara info acme/weather-agent
```

### Unpublish a Version

```bash
ara unpublish acme/weather-agent@1.0.0
```

This removes the version from the index and deletes the GitHub Release.

### Delete a Package

```bash
ara delete acme/weather-agent
```

This removes all versions and the package entry. Requires confirmation.

## Ownership Model

ARA uses a first-come, first-served ownership model:

- **Namespace capture**: The first user to publish to a namespace (e.g., `acme/`) becomes its owner
- **Package ownership**: The first user to publish a package becomes its owner
- **Version control**: Only the package owner can publish new versions, unpublish, or delete

Ownership is tracked in `registry/ownership.json`:

```json
{
  "namespaces": {
    "acme": "github-username"
  },
  "packages": {
    "acme/weather-agent": "github-username"
  }
}
```

## Supported Package Types

| Type | Description |
|------|-------------|
| `kiro-agent` | Kiro custom agent configurations |
| `mcp-server` | Model Context Protocol servers |
| `context` | Knowledge files and prompt templates |
| `skill` | Procedural knowledge via SKILL.md |
| `kiro-powers` | MCP tools with steering files and hooks |
| `kiro-steering` | Persistent project knowledge |
| `agents-md` | AGENTS.md format for coding agents |

## CI/CD

### Validating the Index

The `ci.yml` workflow validates `registry/index.json` on every push to main:

```yaml
- run: |
    python -c "
    import json
    idx = json.load(open('registry/index.json'))
    assert isinstance(idx, list)
    for p in idx:
        assert 'namespace' in p and 'name' in p
    "
```

### Publishing the CLI

Tag a commit to trigger a CLI release:

```bash
git tag v0.0.1
git push origin v0.0.1
```

The `ci.yml` workflow builds a wheel and attaches it to the GitHub Release.

### Package Publishing Workflow

The `publish.yml` workflow handles all write operations (publish, unpublish, delete). It's triggered via `workflow_dispatch` by the CLI.

**Inputs**:
- `action`: publish/unpublish/delete
- `namespace`, `name`, `version`: Package identifiers
- `username`: GitHub username (for ownership checks)
- `manifest_json`: Full ara.json as JSON string
- `chunk_count`: Number of payload chunks (1-20)
- `payload` or `payload_1`...`payload_20`: Base85-encoded package data

**Process**:
1. Reassemble payload chunks
2. Base85-decode to get `.tar.zst` archive
3. Verify ownership
4. Create GitHub Release with tag `ara/{namespace}/{name}/v{version}`
5. Upload `package.tar.zst` and `ara.json` as release assets
6. Update `registry/index.json` and `registry/ownership.json`

## Troubleshooting

### 401 Unauthorized

Your GitHub token is invalid or expired. Create a new token at [github.com/settings/tokens](https://github.com/settings/tokens).

### 403 Forbidden

Your token is missing the `public_repo` scope. Create a new token with the correct scope.

### 404 on Publish

- The registry repository doesn't exist
- The `publish.yml` workflow file is not in `.github/workflows/`
- Your token doesn't have access to the repository

### 409 Conflict

The version you're trying to publish already exists. Use a different version number.

### Workflow Failed

Check the Actions tab on the registry repository for error details. Common issues:

- Ownership check failed (you don't own the namespace/package)
- Invalid manifest JSON
- Package too large (see below)

### Package Too Large

The compressed + encoded archive exceeds ~1.04MB across 20 chunks. Solutions:

- Use the `files` field in `ara.json` to exclude unnecessary files
- For MCP servers, use the `sources` field to reference npm/PyPI instead of bundling files
- Split large packages into smaller ARA packages

### Wrong CLI Version

Force reinstall:

```bash
pip install --force-reinstall ara-github
```

## Architecture Decisions

### Why Zstandard + Base85?

- **Zstandard**: Better compression ratio than gzip for text-heavy packages (typical for AI artifacts)
- **Base85**: 25% overhead vs base64's 33%, maximizing usable payload per workflow input

Combined, these allow ~52KB of binary data per 65KB workflow input, supporting packages up to ~1MB.

### Why workflow_dispatch?

On public repos, random users don't have write access. By triggering a workflow, we leverage the repo's built-in `GITHUB_TOKEN` which has write access. The user's PAT only needs permission to trigger workflows (`public_repo` scope).

### Why Not Use GitHub Packages?

GitHub Packages requires a package manager (npm, pip, etc.) and doesn't support arbitrary file structures. ARA packages can contain any files (prompts, configs, etc.) and need custom metadata (tags, types).

### Release Tag Format

Tags use the format `ara/{namespace}/{name}/v{version}` to avoid collisions with normal repo tags. This allows the registry repo to have its own versioning scheme.

## License

Apache-2.0

## Contributing

Contributions welcome! Please open an issue or PR on the registry repository.
