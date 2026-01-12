import json
import sys
from pathlib import Path
import click
from .core import validate, read_manifest


@click.group()
def main():
    """ARA manifest reference library."""
    pass


@main.command()
@click.argument("path", type=click.Path(exists=True, path_type=Path))
def validate_cmd(path: Path):
    """Validate a ara.json file."""
    errors = validate(path)
    if errors:
        for err in errors:
            click.echo(f"Error: {err}", err=True)
        sys.exit(1)
    click.echo("Valid ara.json")


@main.command("read")
@click.argument("path", type=click.Path(exists=True, path_type=Path))
def read_cmd(path: Path):
    """Read manifest and output as JSON."""
    manifest = read_manifest(path)
    click.echo(manifest.model_dump_json(indent=2, by_alias=True, exclude_none=True))


# Alias for validate command
main.add_command(validate_cmd, name="validate")

if __name__ == "__main__":
    main()
