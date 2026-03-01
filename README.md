# AI Registry for Agents (ARA)

ARA (pronounced: _ah-rah_) is a package registry and distribution system for AI development artifacts. It provides a standardized way to discover, share, and install reusable components that enhance AI assistants and development workflows.

## Package Types

ARA supports various types of packages:

- **Kiro Custom Agents** (`kiro-agent`): Kiro custom agent configurations with prompts, tools, and behaviors
- **MCP Servers** (`mcp-server`): Model Context Protocol servers that extend AI capabilities
- **Context** (`context`): Knowledge files, prompt templates, and reference materials
- **Skills** (`skill`): Procedural knowledge via SKILL.md that agents load dynamically
- **Kiro Powers** (`kiro-powers`): Bundle for MCP tools, steering files and hooks that give agents specialized knowledge
- **Kiro Steering** (`kiro-steering`): Kiro persistent knowledge about your projects
- **AGENTS.md** (`agents-md`): An open format for guiding coding agents

## Registry Implementations

This repository includes a complete GitHub-based registry implementation:

- **[GitHub Registry](github-registry/)** - CLI and backend using GitHub as storage
- **[Web Frontend](github-registry-frontend/)** - Beautiful web interface for browsing packages

### Web Interface

A modern, PartyRock-inspired web interface for discovering and browsing ARA packages:

- 🔍 Real-time search and filtering
- 📊 Live statistics dashboard
- 🎨 Vibrant, gradient-based design
- 📱 Fully responsive
- 🚀 Deploy to GitHub Pages in minutes

[Get Started →](github-registry-frontend/GETTING-STARTED.md)

## Quick Links

- [Vision](vision.md) - Understand the project goals and tenets
- [ara.json Spec](ara-json.md) - Package manifest format
- [JSON Schema](ara.schema.json) - Validate your ara.json
- [Registry API](registry-api.md) - HTTP API specification for registry implementations
- [Security](security.md) - Security guidance for implementers
- [GitHub Registry README](github-registry/README.md) - CLI and publishing guide
- [Frontend Documentation](github-registry-frontend/README.md) - Web interface docs

## Example ara.json

```json
{
  "$schema": "https://raw.githubusercontent.com/ara-registry/spec/refs/heads/main/ara.schema.json",
  "name": "acme/code-reviewer",
  "version": "1.0.0",
  "description": "AI agent for automated code review",
  "author": "developer@example.com",
  "tags": ["code-review", "automation"],
  "type": "kiro-agent"
}
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
