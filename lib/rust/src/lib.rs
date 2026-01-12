mod models;

pub use models::{ARAManifest, PackageSource, PackageType, SourceType};

use once_cell::sync::Lazy;
use regex::Regex;
use std::fs;
use std::path::Path;
use thiserror::Error;

// Semantic versioning pattern from the JSON schema
static SEMVER_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$"
    ).unwrap()
});

// Tag pattern from the JSON schema
static TAG_PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[a-zA-Z0-9_-]+$").unwrap());

// Name pattern from the JSON schema
static NAME_PATTERN: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$").unwrap());

// Simple email pattern (contains @ with text before and after)
static EMAIL_PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap());

// URI pattern (starts with http:// or https://)
static URI_PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new(r"^https?://").unwrap());

#[derive(Error, Debug)]
pub enum ARAError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Validation error: {0}")]
    Validation(String),
}

pub fn read_manifest(path: &Path) -> Result<ARAManifest, ARAError> {
    let content = fs::read_to_string(path)?;
    let manifest: ARAManifest = serde_json::from_str(&content)?;
    Ok(manifest)
}

pub fn validate(path: &Path) -> Result<Vec<String>, ARAError> {
    let manifest = read_manifest(path)?;
    let mut errors = Vec::new();

    // Name format validation (pattern + length)
    if !NAME_PATTERN.is_match(&manifest.name) {
        errors.push("name must match pattern ^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$".to_string());
    }
    if manifest.name.len() < 3 {
        errors.push("name must be at least 3 characters".to_string());
    }
    if manifest.name.len() > 200 {
        errors.push("name must be at most 200 characters".to_string());
    }

    // Required fields
    if manifest.version.is_empty() {
        errors.push("version is required".to_string());
    }
    if manifest.description.is_empty() {
        errors.push("description is required".to_string());
    }
    if manifest.description.len() > 500 {
        errors.push("description must be at most 500 characters".to_string());
    }
    if manifest.tags.is_empty() {
        errors.push("at least one tag is required".to_string());
    }

    // Version format validation (semver)
    if !manifest.version.is_empty() && !SEMVER_PATTERN.is_match(&manifest.version) {
        errors.push(format!(
            "version must be a valid semantic version (e.g., '1.0.0'), got: {}",
            manifest.version
        ));
    }

    // Email format validation
    if !EMAIL_PATTERN.is_match(&manifest.author) {
        errors.push(format!(
            "author must be a valid email address, got: {}",
            manifest.author
        ));
    }

    // Tag format validation
    for tag in &manifest.tags {
        if tag.is_empty() || tag.len() > 50 {
            errors.push(format!(
                "invalid tag length: '{}' (must be 1-50 characters)",
                tag
            ));
        } else if !TAG_PATTERN.is_match(tag) {
            errors.push(format!(
                "invalid tag format: '{}' (must match ^[a-zA-Z0-9_-]+$)",
                tag
            ));
        }
    }

    // License length validation
    if let Some(ref license) = manifest.license {
        if license.len() > 100 {
            errors.push("license must be at most 100 characters".to_string());
        }
    }

    // URI validation for homepage
    if let Some(ref homepage) = manifest.homepage {
        if !URI_PATTERN.is_match(homepage) {
            errors.push(format!(
                "homepage must be a valid HTTP(S) URL, got: {}",
                homepage
            ));
        }
    }

    // URI validation for repository
    if let Some(ref repository) = manifest.repository {
        if !URI_PATTERN.is_match(repository) {
            errors.push(format!(
                "repository must be a valid HTTP(S) URL, got: {}",
                repository
            ));
        }
    }

    // Sources only for mcp-server
    if manifest.sources.is_some() && manifest.r#type != PackageType::McpServer {
        errors.push("sources field is only allowed for mcp-server type".to_string());
    }

    // Validate PackageSource conditional requirements
    if let Some(ref sources) = manifest.sources {
        for (i, source) in sources.iter().enumerate() {
            match source.source_type {
                SourceType::Npm | SourceType::Pypi | SourceType::McpRegistry => {
                    if source.package.is_none() {
                        errors.push(format!(
                            "sources[{}]: 'package' is required for {:?} source type",
                            i, source.source_type
                        ));
                    }
                }
                SourceType::Git => {
                    if source.repository.is_none() {
                        errors.push(format!(
                            "sources[{}]: 'repository' is required for git source type",
                            i
                        ));
                    }
                }
            }

            // Validate registry URL if present
            if let Some(ref registry) = source.registry {
                if !URI_PATTERN.is_match(registry) {
                    errors.push(format!(
                        "sources[{}]: registry must be a valid HTTP(S) URL, got: {}",
                        i, registry
                    ));
                }
            }

            // Validate repository URL if present
            if let Some(ref repository) = source.repository {
                if !URI_PATTERN.is_match(repository) {
                    errors.push(format!(
                        "sources[{}]: repository must be a valid HTTP(S) URL, got: {}",
                        i, repository
                    ));
                }
            }
        }
    }

    Ok(errors)
}
