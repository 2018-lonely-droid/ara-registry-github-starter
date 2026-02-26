# Testing Guide

This guide walks through testing the full lifecycle of the ARA GitHub registry.

## Prerequisites

1. Create a test GitHub repository for the registry
2. Create a GitHub Personal Access Token with `public_repo` scope
3. Set up environment variables:

```bash
export GITHUB_REPO=your-username/test-ara-registry
export GITHUB_TOKEN=ghp_your_token_here
```

## Setup

1. Push the registry code to your test repository:

```bash
cd github-registry
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/test-ara-registry.git
git push -u origin main
```

2. Install the CLI locally:

```bash
pip install -e .
```

3. Verify the CLI is installed:

```bash
ara --help
```

## Test Lifecycle

### 1. Publish a Package

Use the example package:

```bash
cd examples/hello-agent
ara publish
```

Expected output:
```
Building package test/hello-agent@0.1.0...
Archive size: XXXX bytes
Publishing to registry...
Successfully published test/hello-agent@0.1.0
```

Check the GitHub repository:
- A new release should appear with tag `ara/test/hello-agent/v0.1.0`
- The release should have two assets: `package.tar.zst` and `ara.json`
- `registry/index.json` should be updated with the package entry
- `registry/ownership.json` should show your username as owner

### 2. Search for the Package

Search by name:

```bash
ara search "hello"
```

Expected output:
```
Found 1 package(s):

test/hello-agent@0.1.0
  Test agent to verify the ARA registry works
  Tags: test, hello
```

Search by tag:

```bash
ara search -t test
```

Search by type:

```bash
ara search --type kiro-agent
```

### 3. Get Package Info

```bash
ara info test/hello-agent
```

Expected output:
```
Package: test/hello-agent
Description: Test agent to verify the ARA registry works
Type: kiro-agent
Latest version: 0.1.0
All versions: 0.1.0
Tags: test, hello
Downloads: 0
```

### 4. Install the Package

```bash
mkdir /tmp/ara-test-install
ara install test/hello-agent -o /tmp/ara-test-install
```

Expected output:
```
Installing test/hello-agent@0.1.0...
Installed to /tmp/ara-test-install
```

Verify the installation:

```bash
ls /tmp/ara-test-install/
# Should show: ara.json  prompts/

cat /tmp/ara-test-install/prompts/system.md
# Should show the content of the system prompt
```

### 5. Test Duplicate Version Rejection

Try publishing the same version again:

```bash
cd examples/hello-agent
ara publish
```

Expected output:
```
Error: Version 0.1.0 already exists for test/hello-agent.
```

### 6. Publish a New Version

Update the version in `ara.json`:

```json
{
  "version": "0.2.0",
  ...
}
```

Publish:

```bash
ara publish
```

Verify:

```bash
ara info test/hello-agent
# Should show versions: 0.2.0, 0.1.0
# Latest version should be 0.2.0
```

### 7. Unpublish a Version

```bash
ara unpublish test/hello-agent@0.1.0
```

Expected output:
```
Unpublishing test/hello-agent@0.1.0...
Successfully unpublished test/hello-agent@0.1.0
```

Verify:

```bash
ara info test/hello-agent
# Should only show version 0.2.0
```

Check GitHub:
- The release `ara/test/hello-agent/v0.1.0` should be deleted
- The git tag should be deleted

### 8. Delete the Package

```bash
ara delete test/hello-agent
```

You'll be prompted for confirmation. Type `y` and press Enter.

Expected output:
```
Deleting test/hello-agent...
Successfully deleted test/hello-agent
```

Verify:

```bash
ara search "hello"
# Should show: No packages found.
```

Check GitHub:
- All releases for `test/hello-agent` should be deleted
- `registry/index.json` should be empty: `[]`
- `registry/ownership.json` should have the package removed

### 9. Clean Up

```bash
rm -rf /tmp/ara-test-install
```

## Testing Ownership

### Test Namespace Ownership

1. Publish a package to a new namespace (e.g., `mycompany/tool`)
2. Try to publish another package to the same namespace from a different GitHub account
3. Expected: The second publish should fail with an ownership error

### Test Package Ownership

1. Publish a package (e.g., `test/my-package`)
2. Try to publish a new version from a different GitHub account
3. Expected: The publish should fail with an ownership error

## Testing Large Packages

Create a package with multiple files to test chunking:

```bash
mkdir -p /tmp/large-package/data
cd /tmp/large-package

# Create ara.json
cat > ara.json << 'EOF'
{
  "name": "test/large-package",
  "version": "1.0.0",
  "description": "Test package with multiple files",
  "author": "test@example.com",
  "tags": ["test"],
  "type": "context",
  "files": ["data/"]
}
EOF

# Create some test files
for i in {1..10}; do
  echo "Test data file $i" > data/file$i.txt
done

# Publish
ara publish
```

The CLI should handle chunking automatically if the encoded payload exceeds 65KB.

## Troubleshooting Tests

### Workflow Not Found

If you get a 404 error when publishing, ensure:
- The `.github/workflows/publish.yml` file is committed to the `main` branch
- The workflow file is valid YAML
- You're using the correct repository name in `GITHUB_REPO`

### Permission Denied

If you get a 403 error:
- Verify your GitHub token has the `public_repo` scope
- Check that the token hasn't expired
- Ensure you have access to the repository

### Workflow Failed

Check the Actions tab in your GitHub repository:
1. Go to `https://github.com/your-username/test-ara-registry/actions`
2. Find the failed workflow run
3. Click on it to see the error details
4. Common issues:
   - Python dependencies not installed
   - Invalid manifest JSON
   - Ownership check failed

## Automated Testing

For CI/CD, you can create a test script:

```bash
#!/bin/bash
set -e

echo "Testing ARA GitHub Registry"

# Setup
export GITHUB_REPO=your-username/test-ara-registry
export GITHUB_TOKEN=$GITHUB_TOKEN  # Set in CI environment

# Test publish
cd examples/hello-agent
ara publish

# Test search
ara search "hello" | grep "test/hello-agent"

# Test info
ara info test/hello-agent | grep "0.1.0"

# Test install
ara install test/hello-agent -o /tmp/test-install
test -f /tmp/test-install/ara.json

# Test unpublish
ara unpublish test/hello-agent@0.1.0

# Cleanup
rm -rf /tmp/test-install

echo "All tests passed!"
```

Save as `test.sh` and run:

```bash
chmod +x test.sh
./test.sh
```
