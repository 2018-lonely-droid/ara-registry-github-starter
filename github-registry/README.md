# ARA Registry - GitHub Implementation

An open-source ARA (AI Registry for Agents) registry implementation using only GitHub's native components. No external databases, storage services, or servers to deploy.

> **This Registry Instance**: This is the public ARA registry at `2018-lonely-droid/ara-registry-github-starter`. To use this registry, install the CLI and set `GITHUB_REPO=2018-lonely-droid/ara-registry-github-starter`. To deploy your own registry, follow the deployment steps below.

## Quick Start

### For Users (Using This Registry)

Install the CLI:

```bash
# Recommended: Using uv (fastest)
uv tool install https://github.com/2018-lonely-droid/ara-registry-github-starter/releases/download/v0.0.1/ara_github-0.0.1-py3-none-any.whl

# Alternative: Using pipx
brew install pipx
pipx install https://github.com/2018-lonely-droid/ara-registry-github-starter/releases/download/v0.0.1/ara_github-0.0.1-py3-none-any.whl

# Alternative: Using pip with --user flag
pip install --user https://github.com/2018-lonely-droid/ara-registry-github-starter/releases/download/v0.0.1/ara_github-0.0.1-py3-none-any.whl
```

If you get a warning that `ara` is not on PATH:

```bash
# For uv (usually automatic):
# uv automatically adds ~/.local/bin to PATH

# For pipx:
pipx ensurepath

# For pip --user on macOS:
export PATH="$HOME/Library/Python/3.x/bin:$PATH"  # Replace 3.x with your version

# For pip --user on Linux:
export PATH="$HOME/.local/bin:$PATH"

# Make it permanent by adding to ~/.bashrc or ~/.zshrc, then:
source ~/.bashrc  # or source ~/.zshrc
```

Verify installation:

```bash
ara --help
```

Configure environment:

```bash
export GITHUB_REPO=2018-lonely-droid/ara-registry-github-starter
export GITHUB_TOKEN=ghp_your_token_here  # Only needed for publishing
```

Start using:

```bash
# Search packages
ara search

# Install a package
ara install namespace/package-name

# Publish your package (requires token)
ara publish
```

### For Administrators (Deploying Your Own Registry)

Clone and push to your GitHub repository:

```bash
git clone https://github.com/aws/ara.git
cd ara

# Push to your new registry repository
git remote set-url origin https://github.com/your-username/your-registry-name.git
git push -u origin main
```

The GitHub Actions workflows are now active and will validate the registry on every push.

### 2. Build and Release the CLI

Tag a release to build the CLI wheel:

```bash
git tag v0.0.1
git push origin v0.0.1
```

This triggers the CI workflow which builds the Python wheel and attaches it to the GitHub Release.

### 3. Install the CLI

Download and install from the GitHub Release:

```bash
pip install https://github.com/2018-lonely-droid/ara-registry-github-starter/releases/download/v0.0.1/ara_github-0.0.1-py3-none-any.whl
```

### 4. Configure Environment

Create a GitHub Personal Access Token:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select the `public_repo` scope
4. Generate and copy the token

Set environment variables:

```bash
export GITHUB_REPO=2018-lonely-droid/ara-registry-github-starter
export GITHUB_TOKEN=ghp_your_token_here
```

Make them permanent by adding to `~/.bashrc` or `~/.zshrc`:

```bash
echo 'export GITHUB_REPO=2018-lonely-droid/ara-registry-github-starter' >> ~/.bashrc
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.bashrc
source ~/.bashrc
```

### 5. Publish Your First Package

Create a package:

```bash
mkdir -p ~/my-agent/prompts
cd ~/my-agent

cat > ara.json << 'EOF'
{
  "name": "myname/my-agent",
  "version": "1.0.0",
  "description": "My first ARA package",
  "author": "you@example.com",
  "tags": ["demo"],
  "type": "kiro-agent",
  "files": ["prompts/"]
}
EOF

echo "# My Agent" > prompts/system.md

ara publish
```

### 6. Use the Registry

```bash
# Search for packages
ara search "my-agent"

# Get package info
ara info myname/my-agent

# Install a package
ara install myname/my-agent -o /tmp/test

# Unpublish a version
ara unpublish myname/my-agent@1.0.0

# Delete entire package
ara delete myname/my-agent
```

## How It Works

### Architecture

```
┌─────────────┐
│  CLI User   │
└──────┬──────┘
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

### Component Mapping

| ARA Concept | GitHub Component |
|---|---|
| Package storage | GitHub Releases (assets) |
| Manifest storage | GitHub Releases (ara.json) |
| Authentication | GitHub Personal Access Token |
| Search index | `registry/index.json` in repo |
| Ownership tracking | `registry/ownership.json` in repo |
| CI validation | GitHub Actions |
| CLI distribution | GitHub Releases |

### Key Design

**Publishing via workflow_dispatch**: The CLI base85-encodes packages and sends them as workflow inputs. The GitHub Action (with repo write access) decodes, validates, and publishes. This allows anyone with a GitHub PAT to publish without needing direct write access to the registry repo.

**Compression & Encoding**: Zstandard compression + Base85 encoding allows ~52KB of binary data per 65KB workflow input, supporting packages up to ~832KB (16 chunks due to GitHub's 25 input limit).

**Ownership**: First-come, first-served. The first publisher of a namespace or package becomes its owner.

## CLI Commands

### ara publish

Publish a package to the registry.

```bash
ara publish [-p path]
```

Options:
- `-p, --path`: Package directory (default: current directory)

Requirements:
- `ara.json` manifest in the package directory
- `GITHUB_TOKEN` environment variable set

Example:
```bash
cd my-package
ara publish
```

### ara search

Search for packages in the registry.

```bash
ara search [query] [-t tags] [-n namespace] [--type type]
```

Options:
- `query`: Search term (searches name and description)
- `-t, --tags`: Filter by tags (comma-separated)
- `-n, --namespace`: Filter by namespace
- `--type`: Filter by package type

Examples:
```bash
ara search "weather"
ara search -t api,weather
ara search -n acme
ara search --type kiro-agent
```

### ara install

Install a package from the registry.

```bash
ara install <namespace/name> [-v version] [-o output]
```

Options:
- `-v, --version`: Specific version (default: latest)
- `-o, --output`: Output directory (default: current directory)

Examples:
```bash
ara install acme/weather-agent
ara install acme/weather-agent -v 1.0.0
ara install acme/weather-agent -o /tmp/packages
```

### ara info

Show package information.

```bash
ara info <namespace/name>
```

Example:
```bash
ara info acme/weather-agent
```

### ara unpublish

Unpublish a specific package version.

```bash
ara unpublish <namespace/name@version>
```

Requirements:
- `GITHUB_TOKEN` environment variable set
- You must own the package

Example:
```bash
ara unpublish acme/weather-agent@1.0.0
```

### ara delete

Delete a package and all its versions.

```bash
ara delete <namespace/name>
```

Requirements:
- `GITHUB_TOKEN` environment variable set
- You must own the package
- Confirmation prompt

Example:
```bash
ara delete acme/weather-agent
```

## Package Format

### ara.json Manifest

Required fields:

```json
{
  "name": "namespace/package-name",
  "version": "1.0.0",
  "description": "Package description",
  "author": "you@example.com",
  "tags": ["tag1", "tag2"],
  "type": "kiro-agent"
}
```

Optional fields:
- `files`: Array of files/directories to include
- `license`: SPDX license identifier
- `homepage`: Project homepage URL
- `repository`: Source repository URL
- `dependencies`: Package dependencies
- `sources`: Installation sources (for MCP servers)

### Package Types

| Type | Description |
|------|-------------|
| `kiro-agent` | Kiro custom agent configurations |
| `mcp-server` | Model Context Protocol servers |
| `context` | Knowledge files and prompt templates |
| `skill` | Procedural knowledge via SKILL.md |
| `kiro-powers` | MCP tools with steering files |
| `kiro-steering` | Persistent project knowledge |
| `agents-md` | AGENTS.md format for coding agents |

### Files Field

If omitted, all files are included (excluding `.git`, `node_modules`, `__pycache__`, `target`).

If specified, only listed files/directories are included:

```json
{
  "files": [
    "prompts/",
    "config.json",
    "README.md"
  ]
}
```

## Ownership Model

ARA uses first-come, first-served ownership:

- **Namespace capture**: First publisher to a namespace becomes its owner
- **Package ownership**: First publisher of a package becomes its owner
- **Version control**: Only owners can publish new versions, unpublish, or delete

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

## Testing

### Full Lifecycle Test

```bash
# 1. Create test package
mkdir -p /tmp/test-agent/prompts
cd /tmp/test-agent

cat > ara.json << 'EOF'
{
  "name": "test/hello",
  "version": "0.1.0",
  "description": "Test package",
  "author": "test@example.com",
  "tags": ["test"],
  "type": "kiro-agent",
  "files": ["prompts/"]
}
EOF

echo "# Hello" > prompts/system.md

# 2. Publish
ara publish

# 3. Search
ara search "hello"

# 4. Info
ara info test/hello

# 5. Install
ara install test/hello -o /tmp/install
ls /tmp/install

# 6. Unpublish
ara unpublish test/hello@0.1.0

# 7. Verify removed
ara search "hello"

# 8. Cleanup
rm -rf /tmp/test-agent /tmp/install
```

### Test Ownership

1. Publish a package to a new namespace
2. Try to publish from a different GitHub account
3. Should fail with ownership error

### Test Duplicate Version

1. Publish a package version
2. Try to publish the same version again
3. Should fail with "Version already exists" error

## Troubleshooting

### 401 Unauthorized

Your GitHub token is invalid or expired.

**Solution**: Create a new token at https://github.com/settings/tokens

### 403 Forbidden

Your token is missing the `public_repo` scope.

**Solution**: Create a new token with the correct scope.

### 404 on Publish

The registry repository doesn't exist or the workflow file is missing.

**Solutions**:
- Verify `GITHUB_REPO` is correct
- Check that `.github/workflows/publish.yml` exists in the main branch
- Ensure your token has access to the repository

### 409 Conflict

The version you're trying to publish already exists.

**Solution**: Use a different version number.

### Workflow Failed

The GitHub Actions workflow encountered an error.

**Solutions**:
1. Check the Actions tab on your registry repository
2. Click on the failed workflow run
3. Review the error logs
4. Common issues:
   - Ownership check failed (you don't own the namespace/package)
   - Invalid manifest JSON
   - Package too large (>832KB)

### Package Too Large

The compressed + encoded archive exceeds ~832KB.

**Solutions**:
- Use the `files` field to exclude unnecessary files
- For MCP servers, use the `sources` field to reference npm/PyPI
- Split into multiple smaller packages

### Wrong CLI Version

**Solution**: Force reinstall from your registry's release URL:

```bash
pip install --force-reinstall https://github.com/your-username/your-registry/releases/download/v0.0.1/ara_github-0.0.1-py3-none-any.whl
```

### GITHUB_REPO Not Set

**Solution**: Export the environment variable with your registry repository:

```bash
export GITHUB_REPO=your-username/your-registry
```

## GitHub Enterprise

To use with GitHub Enterprise, set the API URL:

```bash
export GITHUB_API_URL=https://github.example.com/api/v3
export GITHUB_REPO=org/registry
export GITHUB_TOKEN=ghp_xxx
```

## CI/CD Integration

### Automatic Publishing

Create a GitHub Actions workflow in your package repository:

```yaml
name: Publish to ARA

on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install ARA CLI
        run: |
          pip install https://github.com/your-username/your-registry/releases/download/v0.0.1/ara_github-0.0.1-py3-none-any.whl
      
      - name: Publish package
        env:
          GITHUB_REPO: your-username/your-registry
          GITHUB_TOKEN: ${{ secrets.ARA_REGISTRY_TOKEN }}
        run: ara publish
```

Add `ARA_REGISTRY_TOKEN` to your repository secrets.

## Performance

Typical operation times:

- **Publish** (small package): 10-20 seconds (workflow execution)
- **Search**: <1 second (reads index.json)
- **Install**: 2-5 seconds (download + extract)
- **Unpublish**: 10-15 seconds (workflow execution)

## Limitations

### Package Size

Maximum ~832KB compressed + encoded (16 chunks × 52KB per chunk). Most ARA packages are well under this limit since they typically contain text files.

### Workflow Polling

The CLI polls for workflow completion. If the workflow takes >2 minutes, it may timeout (rare for typical packages).

### No Dependency Resolution

The CLI doesn't automatically install dependencies listed in `ara.json`. Users must install them manually.

### No Lock Files

No support for `ara.lock` files yet. All installs fetch the latest versions.

## Advanced Usage

### Custom Package Filters

Combine search filters:

```bash
ara search -n acme -t weather --type kiro-agent
```

### Install Specific Version

```bash
ara install acme/weather-agent -v 1.2.0
```

### Publish from Subdirectory

```bash
ara publish -p ./packages/my-agent
```

### Batch Operations

```bash
# Publish multiple packages
for dir in packages/*/; do
  ara publish -p "$dir"
done

# Install multiple packages
for pkg in acme/agent1 acme/agent2 acme/agent3; do
  ara install "$pkg" -o "./installed/$pkg"
done
```

## Security

### Token Security

- Never commit tokens to repositories
- Use environment variables or secret managers
- Rotate tokens regularly
- Use tokens with minimal required scopes

### Package Validation

The CLI validates:
- Manifest format and required fields
- Semantic versioning
- Path traversal in archives
- Ownership before write operations

### Archive Safety

- Zstandard decompression with size limits
- Path traversal protection during extraction
- Validation of archive contents

## Contributing

Contributions welcome! The implementation is in `github-registry/`:

```
github-registry/
├── src/ara_github/
│   ├── http.py      # HTTP client
│   ├── client.py    # API client
│   ├── index.py     # Index management
│   └── cli.py       # CLI commands
├── pyproject.toml   # Package config
└── examples/        # Example packages
```

To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Apache-2.0

## Support

- **Issues**: Open on the registry repository
- **Documentation**: See [ARA specification](../ara-json.md)
- **Examples**: See `github-registry/examples/`

## Comparison with Other Registries

| Feature | GitHub | GitLab | npm | PyPI |
|---------|--------|--------|-----|------|
| Setup | Zero config | Zero config | Account + config | Account + config |
| Storage | Releases | Package Registry | npm registry | PyPI servers |
| Auth | PAT | PAT/CI token | npm token | PyPI token |
| Max size | ~832KB | Unlimited | 50MB | 100MB |
| Cost | Free | Free | Free | Free |
| Private | Yes | Yes | Paid | Paid |

## Architecture Decisions

### Why Zstandard + Base85?

- **Zstandard**: Better compression than gzip for text-heavy packages
- **Base85**: 25% overhead vs base64's 33%
- Combined: Maximum efficiency within GitHub's constraints

### Why workflow_dispatch?

On public repos, users don't have write access. By triggering a workflow, we leverage the repo's `GITHUB_TOKEN` which has write access. The user's PAT only needs permission to trigger workflows.

### Why Not GitHub Packages?

GitHub Packages requires package managers (npm, pip) and doesn't support arbitrary file structures. ARA packages can contain any files and need custom metadata.

### Release Tag Format

Tags use `ara/{namespace}/{name}/v{version}` to avoid collisions with normal repo tags.

## FAQ

**Q: Can I use this with private repositories?**  
A: Yes, but users will need tokens with appropriate access.

**Q: How do I migrate from another registry?**  
A: Export packages from the old registry and republish using `ara publish`.

**Q: Can I host multiple registries?**  
A: Yes, just use different `GITHUB_REPO` values.

**Q: What happens if I lose my token?**  
A: Create a new token. Your published packages remain accessible.

**Q: Can I transfer package ownership?**  
A: Not currently. This is a planned feature.

**Q: How do I delete my registry?**  
A: Delete the GitHub repository. All packages and metadata will be removed.

**Q: Can I use this in CI/CD?**  
A: Yes, see the CI/CD Integration section above.

**Q: Is there a rate limit?**  
A: GitHub API rate limits apply (5,000 requests/hour for authenticated users).
