# Contributing to ARA GitHub Registry

Thank you for your interest in contributing! This document provides guidelines for contributing to the ARA GitHub registry implementation.

## Development Setup

1. Clone the repository:

```bash
git clone https://github.com/your-org/ara-github-registry.git
cd ara-github-registry
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install in development mode:

```bash
pip install -e .
```

4. Install development dependencies:

```bash
pip install pytest black ruff mypy
```

## Code Style

- Use [Black](https://black.readthedocs.io/) for code formatting
- Use [Ruff](https://docs.astral.sh/ruff/) for linting
- Use type hints where possible
- Follow PEP 8 guidelines

Format code before committing:

```bash
black src/
ruff check src/ --fix
```

## Testing

Run the test suite:

```bash
pytest tests/
```

For manual testing, see [TESTING.md](TESTING.md).

## Making Changes

1. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes
3. Test your changes thoroughly
4. Commit with a descriptive message:

```bash
git commit -m "Add feature: description of what you added"
```

5. Push to your fork:

```bash
git push origin feature/your-feature-name
```

6. Open a pull request

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Ensure all tests pass
- Update documentation if needed
- Keep changes focused and atomic

## Areas for Contribution

### High Priority

- Add unit tests for CLI commands
- Add integration tests for GitHub API interactions
- Improve error messages and user feedback
- Add progress bars for long operations
- Support for package dependencies resolution

### Medium Priority

- Add `ara update` command to update installed packages
- Add `ara list` command to show installed packages
- Support for lock files (ara.lock)
- Caching of downloaded packages
- Parallel downloads for faster installs

### Low Priority

- Shell completion scripts (bash, zsh, fish)
- Colorized output
- JSON output mode for scripting
- Package verification with checksums
- Support for private registries

## Documentation

When adding new features:

1. Update the README.md with usage examples
2. Add docstrings to new functions/classes
3. Update TESTING.md if testing procedures change
4. Consider adding examples in the `examples/` directory

## Reporting Issues

When reporting issues, please include:

- Python version (`python --version`)
- CLI version (`pip show ara-github`)
- Operating system
- Full error message and stack trace
- Steps to reproduce
- Expected vs actual behavior

## Questions?

Open an issue with the `question` label or start a discussion in the repository.

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.
