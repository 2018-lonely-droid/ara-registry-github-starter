# Quick Start Guide

Get started with the ARA GitHub registry in 5 minutes.

## 1. Prerequisites

- Python 3.10+
- A GitHub account
- A GitHub repository for your registry

## 2. Create Your Registry Repository

```bash
# Create a new repository on GitHub (e.g., my-ara-registry)
# Then clone this implementation
git clone https://github.com/aws/ara.git
cd ara/github-registry

# Initialize your registry
git init
git add .
git commit -m "Initial ARA registry setup"
git remote add origin https://github.com/YOUR_USERNAME/my-ara-registry.git
git push -u origin main
```

## 3. Create a GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name like "ARA Registry"
4. Select the `public_repo` scope
5. Click "Generate token"
6. Copy the token (starts with `ghp_`)

## 4. Configure Environment

```bash
export GITHUB_REPO=YOUR_USERNAME/my-ara-registry
export GITHUB_TOKEN=ghp_your_token_here
```

Add these to your `~/.bashrc` or `~/.zshrc` to make them permanent:

```bash
echo 'export GITHUB_REPO=YOUR_USERNAME/my-ara-registry' >> ~/.bashrc
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.bashrc
source ~/.bashrc
```

## 5. Install the CLI

```bash
pip install -e .
```

Verify installation:

```bash
ara --help
```

## 6. Publish Your First Package

Create a simple package:

```bash
mkdir -p ~/my-first-agent/prompts
cd ~/my-first-agent

# Create ara.json
cat > ara.json << 'EOF'
{
  "name": "myname/my-first-agent",
  "version": "1.0.0",
  "description": "My first ARA package",
  "author": "you@example.com",
  "tags": ["demo", "test"],
  "type": "kiro-agent",
  "files": ["prompts/"]
}
EOF

# Create a prompt
cat > prompts/system.md << 'EOF'
# My First Agent

This is my first ARA package!
EOF

# Publish
ara publish
```

## 7. Search and Install

Search for your package:

```bash
ara search "my-first"
```

Install it:

```bash
ara install myname/my-first-agent -o /tmp/test-install
ls /tmp/test-install
```

## Next Steps

- Read the [full README](README.md) for detailed documentation
- Check out [TESTING.md](TESTING.md) for comprehensive testing
- See [examples/](examples/) for more package examples
- Read the [ARA spec](../ara-json.md) to understand package formats

## Common Issues

### "GITHUB_REPO environment variable is required"

Make sure you've exported the environment variables:

```bash
export GITHUB_REPO=YOUR_USERNAME/my-ara-registry
export GITHUB_TOKEN=ghp_your_token_here
```

### "403 Forbidden"

Your token needs the `public_repo` scope. Create a new token with the correct permissions.

### "404 Not Found" when publishing

Make sure:
1. The repository exists
2. The `.github/workflows/publish.yml` file is committed to the main branch
3. You're using the correct repository name

### Workflow fails

Check the Actions tab in your GitHub repository to see the error details.

## Getting Help

- Open an issue in the registry repository
- Check the [troubleshooting section](README.md#troubleshooting) in the README
- Review the [ARA specification](../ara-json.md)
