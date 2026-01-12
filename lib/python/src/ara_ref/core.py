import json
from pathlib import Path
from pydantic import ValidationError
from .models import ARAManifest


def validate(path: Path) -> list[str]:
    """Validate a ara.json file. Returns list of error messages."""
    try:
        read_manifest(path)
        return []
    except FileNotFoundError:
        return [f"File not found: {path}"]
    except json.JSONDecodeError as e:
        return [f"Invalid JSON: {e}"]
    except ValidationError as e:
        return [err["msg"] for err in e.errors()]


def read_manifest(path: Path) -> ARAManifest:
    """Read and parse a ara.json file."""
    with open(path) as f:
        data = json.load(f)
    return ARAManifest(**data)
