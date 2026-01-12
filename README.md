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

## Quick Links

- [Vision](vision.md) - Understand the project goals and tenets
- [ara.json Spec](ara-json.md) - Package manifest format
- [JSON Schema](ara.schema.json) - Validate your ara.json
- [Registry API](registry-api.md) - HTTP API specification for registry implementations
- [Security](security.md) - Security guidance for implementers

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
