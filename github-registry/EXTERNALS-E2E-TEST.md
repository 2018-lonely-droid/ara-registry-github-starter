# External Registry End-to-End Test (Anthropic Skills)

This guide describes a concrete end-to-end flow to verify that external AI abilities from the Anthropic skills registry are resolved and installed correctly via `externalDependencies`.

The example uses the `skills/docx` skill from:

- Repository: `anthropics/skills`
- Skill path: `skills/docx/`

## Prerequisites

- `ara` CLI installed and configured to use this registry.
- `GITHUB_REPO` set to your registry repository (for example `2018-lonely-droid/ara-registry-github-starter`).
- `GITHUB_TOKEN` set to a token that can create Issues on that repository.

```bash
export GITHUB_REPO=2018-lonely-droid/ara-registry-github-starter
export GITHUB_TOKEN=ghp_your_token_here
```

## 1. Create a test package that references Anthropic `skills/docx`

```bash
mkdir -p /tmp/ara-ext-test/prompts
cd /tmp/ara-ext-test

cat > ara.json << 'EOF'
{
  "$schema": "https://raw.githubusercontent.com/aws/ara/refs/heads/main/ara.schema.json",
  "name": "test/anthropic-ext-docx",
  "version": "0.1.0",
  "description": "Test ARA package that uses the Anthropic docx skill via externalDependencies",
  "author": "you@example.com",
  "tags": ["test", "anthropic", "skills"],
  "type": "kiro-agent",
  "files": ["prompts/"],
  "externalDependencies": [
    {
      "registry": "anthropic/skills",
      "name": "skills/docx",
      "path": "skills/anthropic/docx"
    }
  ]
}
EOF

echo "# Anthropic external test" > prompts/system.md
```

Key points:

- `registry` is the allowlisted external registry id: `anthropic/skills`.
- `name` is the directory path within the Anthropic skills repo: `skills/docx`.
- `path` is where the external skill will be installed relative to the ARA package root: `skills/anthropic/docx`.

## 2. Publish the test package

```bash
cd /tmp/ara-ext-test
ara publish
```

You can confirm it exists in the index:

```bash
ara search anthropic-ext-docx
ara info test/anthropic-ext-docx
```

## 3. Install and verify external dependencies

```bash
mkdir -p /tmp/ara-ext-install
cd /tmp/ara-ext-install

ara install test/anthropic-ext-docx -o .
```

The install flow will:

1. Download and extract the ARA package into the current directory.
2. Read `./ara.json`.
3. For each entry in `externalDependencies`, call the appropriate external registry adapter.
4. For `anthropic/skills` with `name: "skills/docx"`, download `SKILL.md` (and other files, if present) from `anthropics/skills` and write them under `skills/anthropic/docx/`.

Verify the external skill was installed:

```bash
ls skills/anthropic/docx

sed -n '1,40p' skills/anthropic/docx/SKILL.md
```

If `skills/anthropic/docx/SKILL.md` matches the content from the Anthropic skills repository (`skills/docx/SKILL.md`), the external registry dependency path is working end-to-end.

