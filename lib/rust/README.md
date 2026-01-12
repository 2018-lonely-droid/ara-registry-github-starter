# ara-ref

Reference library for ARA package manifests.

> **Note:** This library is intended for demonstration purposes only. It is not meant to be used in production.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
ara-ref = { path = "lib/rust" }
```

Or build locally:

```bash
cargo build --release
```

## Usage

### CLI

```bash
# Validate a ara.json file
cargo run -- validate path/to/ara.json

# Read manifest and output as JSON
cargo run -- read path/to/ara.json
```

### Rust API

```rust
use ara_ref::{ARAManifest, validate, read_manifest};
use std::path::Path;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Validate a manifest file
    let errors = validate(Path::new("ara.json"))?;
    if !errors.is_empty() {
        println!("Validation errors: {:?}", errors);
    }

    // Read and parse manifest
    let manifest = read_manifest(Path::new("ara.json"))?;
    println!("Package: {} v{}", manifest.name, manifest.version);
    println!("Type: {:?}", manifest.r#type);

    // Create manifest programmatically
    let manifest = ARAManifest {
        name: "acme/my-agent".to_string(),
        version: "1.0.0".to_string(),
        description: "My AI agent".to_string(),
        author: "dev@example.com".to_string(),
        tags: vec!["ai".to_string(), "agent".to_string()],
        ..Default::default()
    };
    println!("{}", serde_json::to_string_pretty(&manifest)?);

    Ok(())
}
```

## License

Apache-2.0
