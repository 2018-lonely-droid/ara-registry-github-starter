# ara.json Format Specification

A `ara.json` file is a standardized way to describe packages for registry publishing, client discovery, and package management.

See also:
- [Ecosystem Vision](vision.md) for design principles and architecture
- [JSON Schema](ara.schema.json) for machine-readable validation

## Table of Contents

- [For Implementers](#for-implementers)
- [Required Fields](#required-fields)
  - [name](#name)
  - [version](#version)
  - [description](#description)
  - [author](#author)
  - [tags](#tags)
- [Optional Fields](#optional-fields)
  - [type](#type)
  - [files](#files)
  - [license](#license)
  - [homepage](#homepage)
  - [repository](#repository)
  - [dependencies](#dependencies)
  - [externalDependencies](#externaldependencies)
  - [sources](#sources)
- [Package Types](#package-types)
- [Complete Example](#complete-example)

## For Implementers

This specification defines the `ara.json` format for package manifests. Sections marked "Implementation Notes" provide guidance for clients and registries implementing this standard. These notes describe expected behavior but allow flexibility in implementation details.

---

## Required Fields

### name

Package name in `namespace/package-name` format.

| Property | Value |
|----------|-------|
| Type | `string` |
| Pattern | `^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$` |
| Min length | 3 |
| Max length | 200 |

The namespace groups packages by author or organization. Both namespace and package name may contain letters, numbers, hyphens, and underscores.

```json
{
  "name": "acme/code-reviewer"
}
```

### version

Semantic version string.

| Property | Value |
|----------|-------|
| Type | `string` |
| Format | [Semantic Versioning 2.0.0](https://semver.org/) |

Supports prerelease tags (`1.0.0-alpha`) and build metadata (`1.0.0+build.123`).

```json
{
  "version": "2.1.0"
}
```

### description

Human-readable explanation of package functionality.

| Property | Value |
|----------|-------|
| Type | `string` |
| Min length | 1 |
| Max length | 500 |

Focus on capabilities and use cases, not implementation details.

```json
{
  "description": "AI agent for automated code review with multi-language support"
}
```

### author

Author email address for contact and attribution.

| Property | Value |
|----------|-------|
| Type | `string` |
| Format | email |

```json
{
  "author": "team@acme.com"
}
```

### tags

Discovery tags for search and categorization.

| Property | Value |
|----------|-------|
| Type | `array` of `string` |
| Min items | 1 |
| Item pattern | `^[a-zA-Z0-9_-]+$` |
| Item max length | 50 |

Use lowercase, hyphen-separated terms. Tags improve discoverability in registry searches.

```json
{
  "tags": ["code-review", "automation", "typescript"]
}
```

---

## Optional Fields

### type

Package type determining installation and usage behavior.

| Property | Value |
|----------|-------|
| Type | `string` |
| Enum | `kiro-agent`, `mcp-server`, `context`, `skill`, `kiro-powers`, `kiro-steering`, `agents-md` |
| Default | `kiro-agent` |

| Type | Description |
|------|-------------|
| `kiro-agent` | Kiro custom agent configurations with prompts, tools, and behaviors |
| `mcp-server` | Model Context Protocol servers that extend AI capabilities |
| `context` | Knowledge files, prompt templates, and reference materials |
| `skill` | Procedural knowledge via SKILL.md that agents load dynamically |
| `kiro-powers` | Bundle for MCP tools, steering files and hooks that give agents specialized knowledge |
| `kiro-steering` | Kiro persistent knowledge about your projects |
| `agents-md` | AGENTS.md format for guiding coding agents |

```json
{
  "type": "mcp-server"
}
```

### files

Package files to include when publishing.

| Property | Value |
|----------|-------|
| Type | `array` of `string` |
| Default | All files (excluding common ignores) |

#### Behavior

| Scenario | Behavior |
|----------|----------|
| `files` omitted | All files included (excluding `.git`, `node_modules`, etc.) |
| `files` is `[]` | No files included - metadata-only package |
| `files` has entries | Only specified files/directories included |

#### Path Rules

- Paths are relative to the package root (where `ara.json` lives)
- Paths must not escape the package root (no `../` traversal)
- Directory paths should end with `/` to include all contents recursively
- Glob patterns are not supported - use explicit paths

```json
{
  "files": [
    "prompts/",
    "config.json",
    "README.md"
  ]
}
```

#### Implementation Notes

Clients implementing this spec should:

1. Resolve paths relative to the `ara.json` location
2. Reject paths containing `..` or absolute paths
3. When a directory path ends with `/`, recursively include all files within
4. Preserve directory structure in the packaged output
5. When `files` is omitted, apply sensible defaults to exclude build artifacts and version control directories

### license

SPDX license identifier.

| Property | Value |
|----------|-------|
| Type | `string` |
| Max length | 100 |

Use identifiers from the [SPDX License List](https://spdx.org/licenses/).

```json
{
  "license": "MIT"
}
```

### homepage

Project homepage or documentation URL.

| Property | Value |
|----------|-------|
| Type | `string` |
| Format | URI |

```json
{
  "homepage": "https://acme.com/code-reviewer"
}
```

### repository

Source repository URL for browsing and contributing.

| Property | Value |
|----------|-------|
| Type | `string` |
| Format | URI |

```json
{
  "repository": "https://github.com/acme/code-reviewer"
}
```

### dependencies

Package dependencies with version constraints.

| Property | Value |
|----------|-------|
| Type | `object` |
| Keys | Package names in `namespace/package-name` format |
| Values | Version constraint strings |

Version constraints follow semantic versioning:

| Constraint | Meaning |
|------------|---------|
| `1.0.0` | Exact version |
| `^1.0.0` | Compatible with 1.x.x (>=1.0.0 <2.0.0) |
| `~1.0.0` | Compatible with 1.0.x (>=1.0.0 <1.1.0) |
| `>=1.0.0` | Version 1.0.0 or higher |
| `*` | Any version |

```json
{
  "dependencies": {
    "acme/base-prompts": "^1.0.0",
    "acme/common-tools": ">=2.0.0"
  }
}
```

#### Implementation Notes

Clients implementing dependency resolution should:

1. Parse version constraints using semver semantics
2. Resolve the dependency graph before installation
3. Detect and report circular dependencies
4. Support lock files for reproducible installs

### externalDependencies

External AI ability dependencies that should be fetched from approved external registries (for example the Anthropic skills registry).

| Property | Value |
|----------|-------|
| Type | `array` of objects |
| Applies to | All package types |

Each entry describes one external ability:

| Field | Required | Description |
|-------|----------|-------------|
| `registry` | Yes | External registry identifier (e.g., `anthropic/skills`) |
| `name` | Yes | Ability or package name within the external registry |
| `version` | No | Optional version or revision identifier |
| `path` | No | Relative path under the installed package where the ability should be placed |

```json
{
  "externalDependencies": [
    {
      "registry": "anthropic/skills",
      "name": "browser-use",
      "version": "1.0.0",
      "path": "skills/anthropic/browser-use"
    }
  ]
}
```

#### Implementation Notes

Clients implementing external dependency handling should:

1. Restrict resolution to an administrator-configured allowlist of external registries
2. Resolve and download external abilities during installation of the parent ARA package
3. Place downloaded abilities at the configured `path` (or a sensible default convention when omitted)

### sources

Installation sources for MCP server packages.

| Property | Value |
|----------|-------|
| Type | `array` of `PackageSource` |
| Applies to | `mcp-server` type only |

Only valid when `type` is `mcp-server`. Clients attempt sources in order, preferring those marked with `preferred: true`.

#### Source Types

**npm** - Install from npm registry:
```json
{
  "type": "npm",
  "package": "@acme/weather-mcp",
  "version": "1.0.0",
  "registry": "https://registry.npmjs.org"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | `"npm"` |
| `package` | Yes | npm package name |
| `version` | No | Specific version |
| `registry` | No | Registry URL (defaults to npmjs.org) |

**pypi** - Install from PyPI:
```json
{
  "type": "pypi",
  "package": "weather-mcp-server",
  "version": "0.5.0",
  "registry": "https://pypi.org"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | `"pypi"` |
| `package` | Yes | PyPI package name |
| `version` | No | Specific version |
| `registry` | No | Registry URL (defaults to pypi.org) |

**git** - Build from source:
```json
{
  "type": "git",
  "repository": "https://github.com/example/mcp-server",
  "ref": "v1.0.0",
  "subfolder": "packages/server",
  "installCommand": "npm install && npm run build",
  "executable": "dist/index.js"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | `"git"` |
| `repository` | Yes | Git repository URL |
| `ref` | No | Tag, branch, or commit hash |
| `subfolder` | No | Subdirectory for monorepos |
| `installCommand` | No | Build command after clone |
| `executable` | No | Path to executable after build |

**mcp-registry** - Install from MCP Registry:
```json
{
  "type": "mcp-registry",
  "package": "@modelcontextprotocol/server-brave-search"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | `"mcp-registry"` |
| `package` | Yes | MCP Registry package name |

#### Multiple Sources

Packages can specify multiple sources for redundancy:

```json
{
  "sources": [
    {
      "type": "npm",
      "package": "@acme/server",
      "version": "1.0.0",
      "preferred": true
    },
    {
      "type": "pypi",
      "package": "acme-server",
      "version": "1.0.0"
    }
  ]
}
```

#### Implementation Notes

Clients implementing source resolution should:

1. Attempt the source marked `preferred: true` first
2. Fall back to other sources in array order on failure
3. Validate git repositories against an allowlist of trusted domains
4. Cache installed packages to avoid redundant downloads

---

## Package Types

### Kiro Agent Packages

Kiro agent packages contain AI assistant configurations including prompts, tool definitions, and behavioral settings.

```json
{
  "$schema": "https://raw.githubusercontent.com/aws/ara/refs/heads/main/ara.schema.json",
  "name": "acme/code-reviewer",
  "version": "1.0.0",
  "description": "AI agent for automated code review",
  "author": "developer@example.com",
  "tags": ["code-review", "automation", "quality"],
  "type": "kiro-agent",
  "files": [
    "prompts/system.md",
    "prompts/review.md",
    "config.json"
  ]
}
```

### MCP Server Packages

MCP server packages describe Model Context Protocol servers with installation sources.

```json
{
  "$schema": "https://raw.githubusercontent.com/aws/ara/refs/heads/main/ara.schema.json",
  "name": "acme/weather-server",
  "version": "2.0.0",
  "description": "MCP server for weather data access",
  "author": "developer@example.com",
  "tags": ["weather", "api", "mcp"],
  "type": "mcp-server",
  "sources": [
    {
      "type": "npm",
      "package": "@acme/weather-mcp",
      "version": "2.0.0"
    }
  ]
}
```

### Context Packages

Context packages contain knowledge files, prompt templates, and reference materials.

```json
{
  "$schema": "https://raw.githubusercontent.com/aws/ara/refs/heads/main/ara.schema.json",
  "name": "acme/rust-guidelines",
  "version": "1.0.0",
  "description": "Rust coding guidelines and best practices",
  "author": "developer@example.com",
  "tags": ["rust", "guidelines", "best-practices"],
  "type": "context",
  "files": [
    "guidelines.md",
    "examples/"
  ]
}
```

### Skill Packages

Skill packages contain procedural knowledge that agents load dynamically via SKILL.md files. Unlike agents which configure AI assistant identity, skills provide on-demand instructions for specific tasks.

```json
{
  "$schema": "https://raw.githubusercontent.com/aws/ara/refs/heads/main/ara.schema.json",
  "name": "acme/git-workflow",
  "version": "1.0.0",
  "description": "Git workflow procedures for branching and merging",
  "author": "developer@example.com",
  "tags": ["git", "workflow", "procedures"],
  "type": "skill",
  "files": [
    "SKILL.md"
  ]
}
```

### Kiro Powers Packages

Kiro Powers packages bundle MCP tools with steering files and hooks that give agents specialized knowledge.

```json
{
  "$schema": "https://raw.githubusercontent.com/aws/ara/refs/heads/main/ara.schema.json",
  "name": "acme/database-power",
  "version": "1.0.0",
  "description": "Database management power with SQL tools and best practices",
  "author": "developer@example.com",
  "tags": ["database", "sql", "tools"],
  "type": "kiro-powers",
  "files": [
    "tools/",
    "steering/",
    "hooks/"
  ]
}
```

### Kiro Steering Packages

Kiro Steering packages contain persistent knowledge about your projects.

```json
{
  "$schema": "https://raw.githubusercontent.com/aws/ara/refs/heads/main/ara.schema.json",
  "name": "acme/react-patterns",
  "version": "1.0.0",
  "description": "React development patterns and conventions",
  "author": "developer@example.com",
  "tags": ["react", "patterns", "conventions"],
  "type": "kiro-steering",
  "files": [
    "steering.md"
  ]
}
```

### AGENTS.md Packages

AGENTS.md packages use the open format for guiding coding agents.

```json
{
  "$schema": "https://raw.githubusercontent.com/aws/ara/refs/heads/main/ara.schema.json",
  "name": "acme/monorepo-guide",
  "version": "1.0.0",
  "description": "AGENTS.md guide for monorepo development",
  "author": "developer@example.com",
  "tags": ["monorepo", "agents", "guide"],
  "type": "agents-md",
  "files": [
    "AGENTS.md"
  ]
}
```

---

## Lock File (ara.lock)

The `ara.lock` file records exact versions and integrity hashes for reproducible installations. It is generated automatically when installing packages locally.

### Purpose

- **Reproducibility**: Ensures all team members install identical versions
- **Integrity**: SHA-256 hashes verify package contents haven't changed
- **Speed**: Skips resolution when lock file is present and valid

### Format

```json
{
  "lockfileVersion": 1,
  "generatedAt": "2025-12-30T15:30:00+00:00",
  "packages": {
    "acme/code-review": {
      "version": "1.2.0",
      "type": "skill",
      "integrity": "sha256-abc123...",
      "resolved": "https://...",
      "dependencies": {}
    },
    "acme/test-generator": {
      "version": "2.0.1",
      "type": "skill",
      "integrity": "sha256-def456...",
      "resolved": "https://...",
      "dependencies": {
        "acme/code-review": "^1.0.0"
      }
    },
    "myteam/my-agent": {
      "version": "0.5.0",
      "type": "kiro-agent",
      "integrity": "sha256-ghi789...",
      "resolved": "https://...",
      "dependencies": {}
    }
  }
}
```

### Fields

| Field | Description |
|-------|-------------|
| `lockfileVersion` | Lock file format version (currently `1`) |
| `generatedAt` | ISO 8601 timestamp when lock file was generated |
| `packages` | Map of package names to locked metadata |
| `version` | Exact installed version |
| `type` | Package type (`kiro-agent`, `mcp-server`, `context`, `skill`, `kiro-powers`, `kiro-steering`, `agents-md`) |
| `integrity` | SHA-256 hash of package contents |
| `resolved` | URL where package was downloaded from |
| `dependencies` | Map of dependency names to version ranges |

### Behavior

| Command | Lock file behavior |
|---------|-------------------|
| `install <package>` | Add to lock file |
| `install` (no args) | Install from lock file |
| `update <package>` | Update entry in lock file |
| `uninstall <package>` | Remove from lock file |

### Implementation Notes

Clients implementing lock file support should:

1. Generate lock file on first install or when dependencies change
2. Verify integrity hash before using cached packages
3. Re-resolve if lock file is missing or corrupted
4. Commit lock file to version control for team reproducibility

---

## Complete Example

```json
{
  "$schema": "https://raw.githubusercontent.com/aws/ara/refs/heads/main/ara.schema.json",
  "name": "acme/full-stack-assistant",
  "version": "2.1.0",
  "description": "AI assistant for full-stack development with code review and testing capabilities",
  "author": "team@acme.com",
  "tags": ["development", "code-review", "testing", "full-stack"],
  "type": "kiro-agent",
  "license": "MIT",
  "homepage": "https://acme.com/full-stack-assistant",
  "repository": "https://github.com/acme/full-stack-assistant",
  "files": [
    "prompts/system.md",
    "prompts/review.md",
    "prompts/test.md",
    "config.json"
  ],
  "dependencies": {
    "acme/code-standards": "^1.0.0"
  }
}
```


---

## Reference Libraries

Demo implementations for parsing and validating `ara.json` files:

- [Python Reference Library](lib/python/) using Pydantic
- [Rust Reference Library](lib/rust/) using Serde

These libraries are provided as examples for implementers and are not production-ready.
