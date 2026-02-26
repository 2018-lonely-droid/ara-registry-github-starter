# Deployment Checklist

Use this checklist when deploying a new ARA GitHub registry.

## Pre-Deployment

### 1. Create GitHub Repository

- [ ] Create a new public repository on GitHub
- [ ] Name it appropriately (e.g., `ara-registry`, `my-ara-registry`)
- [ ] Add a description: "ARA package registry for AI development artifacts"
- [ ] Initialize with README (optional, will be replaced)

### 2. Prepare Local Environment

- [ ] Clone this implementation
- [ ] Review and customize README.md if needed
- [ ] Update any organization-specific information
- [ ] Test locally with a test repository first

## Deployment Steps

### 1. Push Registry Code

```bash
cd github-registry
git init
git add .
git commit -m "Initial ARA registry setup"
git remote add origin https://github.com/YOUR_ORG/your-registry.git
git push -u origin main
```

- [ ] Code pushed to main branch
- [ ] All files committed (check with `git status`)

### 2. Verify GitHub Actions

- [ ] Go to repository Settings → Actions → General
- [ ] Ensure "Allow all actions and reusable workflows" is enabled
- [ ] Check that workflows appear in the Actions tab
- [ ] Verify `ci.yml` and `publish.yml` are listed

### 3. Test Workflows

- [ ] Make a small change and push to trigger `ci.yml`
- [ ] Check that the validation workflow passes
- [ ] Review workflow logs for any errors

### 4. Create Release for CLI (Optional)

If you want to distribute the CLI via GitHub Releases:

```bash
git tag v0.0.1
git push origin v0.0.1
```

- [ ] Tag created and pushed
- [ ] Release workflow triggered
- [ ] Wheel file attached to release

## Post-Deployment

### 1. Documentation

- [ ] Update README.md with your registry URL
- [ ] Add usage examples specific to your organization
- [ ] Document any custom policies or guidelines
- [ ] Add contact information for support

### 2. User Setup Instructions

Create a guide for your users:

```markdown
## Using Our ARA Registry

1. Install the CLI:
   ```bash
   pip install ara-github
   ```

2. Configure environment:
   ```bash
   export GITHUB_REPO=YOUR_ORG/your-registry
   export GITHUB_TOKEN=ghp_your_token_here
   ```

3. Publish your first package:
   ```bash
   ara publish -p /path/to/package
   ```
```

- [ ] User guide created
- [ ] Shared with team
- [ ] Added to internal documentation

### 3. Access Control

- [ ] Decide on repository visibility (public/private)
- [ ] Configure branch protection for main branch
- [ ] Set up required reviews for workflow changes
- [ ] Document token requirements for users

### 4. Testing

Run through the full test suite:

- [ ] Publish a test package
- [ ] Search for the package
- [ ] Install the package
- [ ] Unpublish the test package
- [ ] Verify index updates correctly

See [TESTING.md](TESTING.md) for detailed procedures.

### 5. Monitoring

- [ ] Set up notifications for workflow failures
- [ ] Monitor Actions usage (if on free tier)
- [ ] Track registry growth (number of packages)
- [ ] Monitor release storage usage

## Security Checklist

### Repository Security

- [ ] Enable "Require approval for all outside collaborators" for Actions
- [ ] Review and restrict workflow permissions if needed
- [ ] Enable Dependabot for dependency updates
- [ ] Set up security advisories

### Token Management

- [ ] Document token creation process for users
- [ ] Recommend token expiration policies
- [ ] Provide token rotation instructions
- [ ] Never commit tokens to the repository

### Package Security

- [ ] Document package validation process
- [ ] Consider implementing package scanning
- [ ] Set up policies for malicious package reporting
- [ ] Document ownership transfer process

## Maintenance

### Regular Tasks

- [ ] Review and update dependencies monthly
- [ ] Check for GitHub Actions updates
- [ ] Monitor workflow execution times
- [ ] Review and clean up old releases if needed

### Quarterly Reviews

- [ ] Review ownership.json for accuracy
- [ ] Audit package list for abandoned packages
- [ ] Update documentation
- [ ] Gather user feedback

### Annual Tasks

- [ ] Review and update security policies
- [ ] Evaluate registry performance
- [ ] Consider feature additions
- [ ] Update Python version requirements

## Troubleshooting Deployment Issues

### Workflows Not Running

**Symptom**: Workflows don't trigger when expected

**Solutions**:
- Check Actions are enabled in repository settings
- Verify workflow files are in `.github/workflows/`
- Ensure YAML syntax is valid
- Check branch name matches workflow trigger (usually `main`)

### Permission Errors

**Symptom**: Workflows fail with permission errors

**Solutions**:
- Verify `permissions: contents: write` in workflow
- Check repository settings allow workflow write access
- Ensure `GITHUB_TOKEN` has correct permissions

### Index Not Updating

**Symptom**: Published packages don't appear in searches

**Solutions**:
- Check workflow logs for errors
- Verify `registry/index.json` is being updated
- Ensure Contents API calls are succeeding
- Check file SHA is being fetched correctly

### Large Package Failures

**Symptom**: Publishing fails for packages >1MB

**Solutions**:
- Reduce package size using `files` field
- Use `sources` for MCP servers instead of bundling
- Split into multiple smaller packages
- Document size limits for users

## Rollback Procedure

If deployment fails:

1. **Revert to previous commit**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Delete problematic releases**:
   - Go to Releases tab
   - Delete any failed releases
   - Clean up git tags if needed

3. **Reset index files**:
   ```bash
   git checkout HEAD~1 -- registry/index.json registry/ownership.json
   git commit -m "Reset registry files"
   git push origin main
   ```

4. **Notify users**:
   - Post issue explaining the rollback
   - Provide timeline for fix
   - Document workarounds if available

## Success Criteria

Your deployment is successful when:

- [ ] CI workflow passes on main branch
- [ ] Test package publishes successfully
- [ ] Test package appears in search results
- [ ] Test package installs correctly
- [ ] Unpublish removes package from index
- [ ] All documentation is accessible
- [ ] Users can successfully publish packages

## Support Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **ARA Specification**: See `../ara-json.md`
- **Implementation Details**: See `IMPLEMENTATION.md`
- **Testing Guide**: See `TESTING.md`
- **Quick Start**: See `QUICKSTART.md`

## Getting Help

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review workflow logs in the Actions tab
3. Search existing issues in the ARA repository
4. Open a new issue with deployment details
5. Join the community discussions

## Next Steps After Deployment

1. **Announce the registry** to your team/community
2. **Create example packages** for common use cases
3. **Set up CI/CD** for automatic package publishing
4. **Gather feedback** from early users
5. **Iterate and improve** based on usage patterns

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Registry URL**: https://github.com/____________/____________

**Notes**: 
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
