# Publishing @browser-mcp/companion to NPM

## Prerequisites

1. **NPM Account**: Create at https://www.npmjs.com/signup
2. **Login**: `npm login`
3. **Email Verified**: Check your NPM email

## Before Publishing

### 1. Update Version

Already done in `package.json` (v1.0.9)

### 2. Test Locally

```bash
# Test the package works
cd companion-app
npm install
npm start

# Test in another terminal
curl http://localhost:3100/health
```

### 3. Verify Package Contents

```bash
npm pack --dry-run
```

Should include:
- `index.js`
- `README.md`
- `package.json`

## Publishing Steps

### First Time Setup

```bash
# Login to NPM
npm login

# Verify you're logged in
npm whoami
```

### Publish

```bash
cd companion-app

# Dry run (see what will be published)
npm publish --dry-run

# Publish to NPM
npm publish --access public
```

**Note**: The `@browser-mcp` scope requires `--access public` for first publish.

### Verify Publication

1. Check NPM: https://www.npmjs.com/package/@browser-mcp/companion
2. Test install:

```bash
npm install -g @browser-mcp/companion
browser-mcp-companion
```

## Updating Later

### Patch Release (1.0.9 → 1.0.10)

```bash
npm version patch
npm publish
```

### Minor Release (1.0.9 → 1.1.0)

```bash
npm version minor
npm publish
```

### Major Release (1.0.9 → 2.0.0)

```bash
npm version major
npm publish
```

## Troubleshooting

### "You do not have permission to publish"

- Make sure you're logged in: `npm whoami`
- Use `--access public` for scoped packages
- Verify package name is available

### "Version already exists"

- Update version in package.json
- Or use `npm version patch`

### "Package name too similar"

- The name `@browser-mcp/companion` must be unique
- Check https://www.npmjs.com/package/@browser-mcp/companion

## Post-Publish

### 1. Update Main README

Add install instructions:
```bash
npm install -g @browser-mcp/companion
```

### 2. Tag Release on GitHub

```bash
git tag v1.0.9
git push origin v1.0.9
```

### 3. Announce

- Update main repository README
- Tweet/blog post
- Update documentation

## Best Practices

- **Test before publishing**: Always test locally first
- **Semantic versioning**: Follow semver.org
- **Changelog**: Update CHANGELOG.md before each release
- **Git tags**: Tag releases in git
- **Deprecation**: Use `npm deprecate` for old versions if needed

## NPM Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "publish:companion": "cd companion-app && npm publish"
  }
}
```

Then:
```bash
npm run publish:companion
```

---

**Ready to publish!** 🚀

Run: `cd companion-app && npm publish --access public`
