# Security Model

This document provides security guidance for teams building ARA-compatible clients and registries. It is not a threat model for a specific registry deployment. Instead, it offers opinionated recommendations that implementers can adapt to their own security requirements and risk tolerance.

The guidance covers authentication patterns, authorization models, package integrity verification, and operational best practices. Teams should evaluate these recommendations against their specific deployment context, whether that is a public community registry, a private enterprise registry, or something in between.

## Authentication

### Bearer Token Authentication

All write operations require authentication via bearer tokens in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens should be:
- Short-lived (recommended: 1 hour expiration)
- Scoped to specific operations when possible
- Stored securely (never in source control)

### Enterprise Authentication

Enterprise deployments may require authentication for all endpoints, including read operations. Supported authentication methods:

- Bearer tokens (OAuth2, JWT)
- API keys
- OIDC integration

## Authorization

### Ownership-Based Access Control

| Resource | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| Namespace | First publisher | Public* | Owner | Owner |
| Package | Namespace owner | Public* | Owner | Owner |
| Version | Package owner | Public* | - | Owner |

*Read access may require authentication in enterprise deployments.

### Future: Role-Based Access Control

Planned roles for fine-grained permissions:
- **Owner**: Full control over namespace/package
- **Maintainer**: Publish versions, manage metadata
- **Contributor**: Propose changes (requires approval)

## Package Integrity

### Checksums

All packages include SHA-256 checksums for integrity verification:

```json
{
  "checksum": "sha256:a1b2c3d4e5f6..."
}
```

Clients must verify checksums after download before installation.

### Lock Files

The `ara.lock` file ensures reproducible installations by recording exact versions and integrity hashes:

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
    }
  }
}
```

### Future: Package Signing

Package signing would allow publishers to cryptographically sign packages and clients to verify authenticity. We have not yet solidified an opinion on the signing mechanism. Options like Sigstore, GPG, or other approaches will be explored in future iterations.

### Future: Security Scanning

Automated scanning to proactively identify security issues:

- **Dependency scanning**: Detect known vulnerabilities in declared dependencies
- **Malware detection**: Scan package contents for malicious patterns
- **Secret detection**: Flag accidentally committed credentials or API keys
- **License compliance**: Identify incompatible or problematic licenses

Scanning should run as a blocking check during publish:
- Packages with critical issues rejected before publication
- Warnings surfaced but allow publish to proceed
- Results stored as package metadata
- Available via API for CI/CD integration

## Transport Security

### TLS Requirements

- All API endpoints must use HTTPS (TLS 1.2+)
- Signed URLs for uploads/downloads use HTTPS
- Certificate validation required (no self-signed in production)

### Signed URLs

Upload and download URLs should be pre-signed with expiration:

```json
{
  "upload_url": "https://...",
  "expires_at": "2025-01-15T15:30:00Z"
}
```

- Default expiration: 15 minutes
- URLs are single-use for uploads
- Clients should not cache or share signed URLs

## Rate Limiting

Registries should implement rate limiting to prevent abuse. The specific limits depend on your organization's requirements, infrastructure capacity, and usage patterns.

Return `429 Too Many Requests` when limits are exceeded, with a `Retry-After` header indicating when the client can retry.

## Source Repository Restrictions

MCP server packages can specify git repositories as installation sources. Registries should validate these URLs to prevent packages from referencing untrusted or malicious repositories.

Implementers should:

1. Maintain a configurable allowlist of trusted repository domains
2. Accept only HTTPS URLs
3. Reject URLs containing embedded credentials
4. Normalize and validate paths to prevent traversal attacks

The allowlist can range from public hosting providers for open registries to strictly internal domains for enterprise deployments. This is a deployment-time configuration decision based on your organization's security requirements.
