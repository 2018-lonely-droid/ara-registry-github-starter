# AI Registry for Agents (ARA) Vision

How ARA fits into the broader AI development ecosystem and our vision for the future.

## What is ARA?

ARA is a package registry and distribution system for AI development artifacts. It provides a standardized way to discover, share, and install reusable components that enhance AI assistants and development workflows.

ARA supports various types of packages:

- **Kiro Custom Agents**: Kiro custom agent configurations with prompts, tools, and behaviors
- **MCP Servers**: Model Context Protocol servers that extend AI capabilities
- **Context**: Knowledge files, prompt templates, and reference materials
- **Kiro Powers**: Bundle for MCP tools, steering files and hooks that give agents specialized knowledge
- **Kiro Steering**: Kiro persistent knowledge about your projects
- **Skills**: Procedural knowledge via SKILL.md that agents load dynamically
- **AGENTS.md**: An open format for guiding coding agents

## Tenets

These tenets guide our decisions when building ARA. When we face tradeoffs, these tenets help us choose.

### Community-Driven Discovery Over Centralized Curation

Usage patterns and community feedback surface valuable artifacts, not editorial gatekeeping. When deciding between curated recommendations and organic discovery, we choose organic discovery.

### Platform Agnostic Over Tool-Specific

The specification defines artifacts that work across AI coding Agent (Kiro, Claude Code, Strand, and others), not just one platform. When choosing between optimizing for a single runtime and supporting multiple runtimes through modular transformations, we choose modularity.

### Convention Over Configuration

Sensible defaults reduce friction for authors and users. When choosing between flexibility through extensive configuration and simplicity through opinionated conventions, we choose conventions.

### Transparent Governance Over Closed Control

Project influence grows through active participation and contribution. Decisions are made openly with community input, and no single organization controls the specification's direction.

## The Registry Ecosystem

The ARA registry provides AI development tools with a catalog of packages, similar to how npm serves JavaScript or PyPI serves Python.

There are two parts to the project:

1. **The ara.json spec**: A standardized format that allows anyone to create compatible packages
2. **The ARA registry API spec**: A specification format that allows builders to create their own compatible repositories

Package creators publish once, and all consumers (CLI tools, IDE extensions, AI assistants) reference the same canonical data.

## Hybrid Registry Model

ARA is a hybrid registry that can both host packages directly and reference external sources.

**Canonical source (ARA-hosted):**
When a package has no `sources` array, ARA hosts the content directly in its own storage. This is the default for agents, contexts, and skills.

**Alternative sources (external registries):**
When a package specifies a `sources` array, ARA acts as a metaregistry, pointing to npm, PyPI, Docker, git, or other distribution channels. This is common for MCP servers that already exist in language-specific registries.

Supported sources include npm, PyPI, Docker, git, S3, and mcp-registry. Clients attempt sources in order of preference, falling back to alternatives if the preferred source fails.

## How Packages Are Represented

Each package entry contains:

- **Identity**: Unique name in `namespace/package-name` format
- **Type**: Package type (kiro-agent, mcp-server, context, skill, kiro-powers, kiro-steering, agents-md)
- **Metadata**: Description, version, author, tags
- **Files**: Package contents (for agents and context)
- **Sources**: Installation sources (for MCP servers)

This is stored in a standardized `ara.json` format that works across discovery, installation, and execution.

## Future Direction

The ecosystem will evolve to support:

- Additional upstream registries (Homebrew, Cargo, Docker Hub)
- Federation with other AI artifact registries
- Package signing and verification
- Usage analytics and popularity metrics
- Community ratings and reviews
- Namespaced private registries for organizations
