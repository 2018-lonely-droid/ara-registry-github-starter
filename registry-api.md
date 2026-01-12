# ARA API Specification

A standardized RESTful HTTP API for ARA registries to provide consistent endpoints for discovering and retrieving packages.

Also see:
- [ara.json Spec](ara-json.md) - Package manifest format
- [JSON Schema](ara.schema.json) - Machine-readable schema for validation

## Quick Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/packages` | List and search packages |
| GET | `/packages/{namespace}/{name}/versions` | List all versions of a package |
| GET | `/packages/{namespace}/{name}/{version}/ara.json` | Get package manifest |
| GET | `/packages/{namespace}/{name}/{version}/download` | Get download URL |
| PUT | `/packages/{namespace}/{name}/{version}` | Initiate package upload |
| POST | `/packages/{namespace}/{name}/{version}/complete-upload` | Complete package upload |
| DELETE | `/packages/{namespace}/{name}/{version}` | Unpublish package version |
| DELETE | `/packages/{namespace}/{name}` | Delete package and all versions |

### Authentication

Write operations (publish, unpublish, delete) require authentication via bearer token:

```
Authorization: Bearer <token>
```

Read endpoints may be public or require authentication depending on registry configuration. Enterprise deployments typically require authentication for all endpoints.

### Content Type

All requests and responses use `application/json`.

---

## Endpoints

### List Packages

```
GET /packages
```

Query parameters:
- `q` (optional): Search query
- `tags` (optional): Filter by tags (comma-separated)
- `namespace` (optional): Filter by namespace
- `author` (optional): Filter by package owner
- `type` (optional): Filter by package type (`kiro-agent`, `mcp-server`, `context`, `skill`, `kiro-powers`, `kiro-steering`, `agents-md`)
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 50, max: 100)
- `sort` (optional): Sort by `name`, `downloads`, or `updated`

Response:

```json
{
  "packages": [
    {
      "namespace": "acme",
      "name": "weather-agent",
      "description": "AI agent for weather information",
      "type": "kiro-agent",
      "latest_version": "1.2.0",
      "tags": ["weather", "api"],
      "total_downloads": 1523,
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-15T14:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 50,
  "has_next": true,
  "has_prev": false
}
```

### List Package Versions

```
GET /packages/{namespace}/{name}/versions
```

Response:

```json
{
  "namespace": "acme",
  "name": "weather-agent",
  "versions": ["1.2.0", "1.1.0", "1.0.0"],
  "latest": "1.2.0"
}
```

### Get Package Manifest

```
GET /packages/{namespace}/{name}/{version}/ara.json
```

Returns the full `ara.json` manifest for the specified version.

Response:

```json
{
  "name": "acme/weather-agent",
  "version": "1.2.0",
  "description": "AI agent for weather information",
  "author": "team@acme.com",
  "tags": ["weather", "api"],
  "type": "kiro-agent",
  "files": ["prompts/", "config.json"],
  "license": "MIT"
}
```

### Download Package

```
GET /packages/{namespace}/{name}/{version}/download
```

Returns a signed URL for downloading the package archive.

Response:

```json
{
  "download_url": "https://storage.ara.dev/packages/acme/weather-agent/1.2.0/package.tgz",
  "expires_at": "2025-01-15T15:30:00Z",
  "size_bytes": 15234,
  "checksum": "sha256:a1b2c3d4e5f6..."
}
```

### Initiate Package Upload

```
PUT /packages/{namespace}/{name}/{version}
Authorization: Bearer <token>
Content-Type: application/json
```

Query parameters:
- `package_size` (required): Expected package file size in bytes

Request body: Full `ara.json` manifest

```json
{
  "name": "acme/weather-agent",
  "version": "1.2.0",
  "description": "AI agent for weather information",
  "author": "team@acme.com",
  "tags": ["weather", "api"],
  "type": "kiro-agent"
}
```

Response:

```json
{
  "package_upload_url": "https://storage.ara.dev/upload/...",
  "manifest_upload_url": "https://storage.ara.dev/upload/...",
  "upload_id": "abc123def456",
  "expires_at": "2025-01-15T15:30:00Z",
  "max_size_bytes": 52428800,
  "completion_url": "https://api.ara.dev/packages/acme/weather-agent/1.2.0/complete-upload"
}
```

#### Upload Workflow

1. Call this endpoint with manifest and `package_size`
2. Upload package file to `package_upload_url` (signed S3 URL)
3. Call `completion_url` to finalize

#### Ownership Rules

- First uploader becomes the package owner
- Only the owner can upload new versions
- Returns 403 if user doesn't own the package

### Complete Package Upload

```
POST /packages/{namespace}/{name}/{version}/complete-upload
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "upload_id": "abc123def456"
}
```

Response:

```json
{
  "namespace": "acme",
  "name": "weather-agent",
  "version": "1.2.0",
  "published_at": "2025-01-15T14:30:00Z",
  "size_bytes": 15234,
  "message": "Package published successfully"
}
```

### Unpublish Package

```
DELETE /packages/{namespace}/{name}/{version}
Authorization: Bearer <token>
```

Performs a soft delete - package becomes invisible to public APIs but data is preserved.

Response:

```json
{
  "message": "Package acme/weather-agent@1.2.0 unpublished successfully"
}
```

### Delete Package

```
DELETE /packages/{namespace}/{name}
Authorization: Bearer <token>
```

Deletes the package and all its versions. This is a destructive operation.

Response:

```json
{
  "message": "Package acme/weather-agent and all versions deleted successfully"
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "detail": "Package acme/unknown-agent not found"
}
```

HTTP status codes:
- `400`: Invalid request parameters
- `401`: Missing authentication
- `403`: Insufficient permissions (not package owner)
- `404`: Resource not found
- `409`: Version already exists
- `413`: Package size exceeds maximum
- `500`: Internal server error

---

## Ownership Model

### Current Behavior

ARA uses a first-come, first-served ownership model:

- **Namespace capture**: When a user publishes to a namespace that doesn't exist (e.g., `foobar/my-package`), they become the owner of that namespace
- **Package ownership**: The first user to publish a package becomes its owner
- **Version control**: Only the package owner can publish new versions or unpublish

This simple model works well for open registries but may need refinement for enterprise use cases.

### Ownership Rules

| Action | Who can perform |
|--------|-----------------|
| Create namespace (implicit) | Any authenticated user |
| Publish new package | Namespace owner |
| Publish new version | Package owner |
| Unpublish version | Package owner |
| Delete package | Package owner |

---

## Implementation Notes

Registries implementing this spec should:

1. Validate manifest name matches URL path (`{namespace}/{name}`)
2. Validate manifest version matches URL path
3. Enforce package ownership on write operations
4. Use signed URLs with expiration for uploads/downloads
5. Support soft delete for unpublish (preserve data, hide from APIs)
6. Return suggestions for similar packages on 404 errors

---

## Future Updates

The following features are planned for future versions of this specification:

### Namespace Management

- Explicit namespace creation and configuration
- Namespace-level settings (visibility, policies)
- Namespace transfer between users/organizations

### Fine-Grained Ownership

- Team/organization ownership (multiple maintainers)
- Role-based permissions (owner, maintainer, contributor)
- Ownership transfer for packages
- Namespace-level permission inheritance
