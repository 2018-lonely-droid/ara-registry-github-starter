# ara-ref

Reference library for ARA package manifests.

> **Note:** This library is intended for demonstration purposes only. It is not meant to be used in production.

## Installation

Using pip:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

Or using [uv](https://docs.astral.sh/uv/):

```bash
uv sync
source .venv/bin/activate
```

After installation, the `ara-ref` executable will be available on your `$PATH` (within the activated virtual environment).

## Usage

### CLI

```bash
# Validate a ara.json file
ara-ref validate path/to/ara.json

# Read manifest and output as JSON
ara-ref read path/to/ara.json
```

### Python API

```python
from pathlib import Path
from ara_ref import validate, read_manifest, ARAManifest

# Validate a manifest file
errors = validate(Path("ara.json"))
if errors:
    print("Validation errors:", errors)

# Read and parse manifest
manifest = read_manifest(Path("ara.json"))
print(f"Package: {manifest.name} v{manifest.version}")
print(f"Type: {manifest.type}")

# Create manifest programmatically
manifest = ARAManifest(
    name="acme/my-agent",
    version="1.0.0",
    description="My AI agent",
    author="dev@example.com",
    tags=["ai", "agent"],
)
print(manifest.model_dump_json(indent=2))
```

## License

Apache-2.0
