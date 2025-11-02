# GitHub Configuration

This directory contains GitHub-specific configuration files for CI/CD, automation, and community management.

## 📁 Directory Structure

```
.github/
├── workflows/          # GitHub Actions workflows
├── ISSUE_TEMPLATE/     # Issue templates
├── PULL_REQUEST_TEMPLATE.md
├── dependabot.yml      # Dependency update automation
├── labeler.yml         # Auto-labeling configuration
├── FUNDING.yml         # GitHub Sponsors
└── README.md          # This file
```

## 🔄 Workflows

### CI Workflow (`ci.yml`)
**Triggers:** Push to main/develop, Pull Requests
**Purpose:** Continuous Integration testing

**Jobs:**
- **Test**: Runs tests on Node.js 18.x, 20.x, 22.x
- **Lint**: ESLint code quality checks
- **Security**: npm audit for vulnerabilities
- **Dependencies**: Check for outdated packages
- **Build**: Verify build process
- **Docker Test**: Test Docker image builds
- **Status Check**: Aggregate results

**Status Badge:**
```markdown
![CI](https://github.com/SoulofSorrow/discord-voicebot/workflows/CI/badge.svg)
```

---

### Docker Build & Publish (`docker-publish.yml`)
**Triggers:** Push to main, Version tags, Manual
**Purpose:** Build and publish multi-arch Docker images

**Jobs:**
- **Build and Push**: Build for linux/amd64 and linux/arm64
- **Scan**: Security scanning with Trivy
- **Test Image**: Verify published image works

**Features:**
- Multi-architecture support (amd64, arm64)
- Automatic versioning from Git tags
- Push to GitHub Container Registry (ghcr.io)
- Security scanning integration
- Build attestation for supply chain security

**Image Location:**
```bash
docker pull ghcr.io/soulofsorrow/discord-voicebot:latest
```

---

### CodeQL Security Analysis (`codeql.yml`)
**Triggers:** Push, PRs, Weekly schedule, Manual
**Purpose:** Automated security scanning

**Jobs:**
- **Analyze**: CodeQL security analysis for JavaScript
- **Dependency Review**: Check dependencies in PRs

**Features:**
- Security vulnerability detection
- Code quality analysis
- Dependency license checking
- Weekly scheduled scans

---

### Release (`release.yml`)
**Triggers:** Version tags (v*.*.*), Manual
**Purpose:** Automated release creation

**Jobs:**
- **Create Release**: Generate GitHub release with artifacts
- **Notify**: Release notification

**Features:**
- Automatic changelog generation
- Release artifact creation (tar.gz)
- SHA256 checksums
- Docker image references

**Usage:**
```bash
git tag v2.0.1
git push origin v2.0.1
```

---

### PR Labels & Automation (`pr-labels.yml`)
**Triggers:** Pull Request events
**Purpose:** Automate PR labeling and checks

**Jobs:**
- **Label**: Auto-label based on file changes
- **Size Label**: Add size labels (xs, s, m, l, xl)
- **Conventional Commits**: Verify commit message format
- **PR Comment**: Welcome message for new PRs

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance
- `ci`: CI/CD changes

---

### Stale Issues & PRs (`stale.yml`)
**Triggers:** Daily schedule, Manual
**Purpose:** Manage inactive issues and PRs

**Configuration:**
- Issues: Marked stale after 60 days, closed after 14 days
- PRs: Marked stale after 45 days, closed after 14 days
- Exempt labels: `pinned`, `security`, `critical`, `work-in-progress`

---

## 🤖 Dependabot (`dependabot.yml`)

Automated dependency updates for:
- **npm packages**: Weekly updates on Mondays
- **Docker base images**: Weekly updates
- **GitHub Actions**: Weekly updates

**Configuration:**
- Ignores major version updates (requires manual review)
- Auto-assigns reviewers
- Uses conventional commit messages

---

## 🏷️ Auto-Labeling (`labeler.yml`)

Automatically labels PRs based on changed files:

| Label | Files |
|-------|-------|
| `documentation` | *.md, docs/* |
| `docker` | Dockerfile, docker-compose.yml |
| `ci/cd` | .github/* |
| `dependencies` | package.json |
| `tests` | test/*, *.test.js |
| `dashboard` | public/*, DashboardService.js |
| `database` | DatabaseService.js |
| `monitoring` | MonitoringService.js |
| `core` | src/core/* |
| `services` | src/services/* |
| `utils` | src/utils/* |
| `modals` | src/modals/* |
| `language` | language/* |
| `config` | config/*, .env.example |

---

## 📝 Issue Templates

### Bug Report (`bug_report.yml`)
Structured template for reporting bugs with:
- Description
- Steps to reproduce
- Expected vs actual behavior
- Version and deployment info
- Logs

### Feature Request (`feature_request.yml`)
Template for suggesting new features with:
- Problem statement
- Proposed solution
- Alternatives
- Priority and category

### Configuration (`config.yml`)
- Disables blank issues
- Links to discussions for questions
- Links to documentation
- Security advisory link

---

## 📋 Pull Request Template

Comprehensive PR template including:
- Description and related issue
- Type of change (bug fix, feature, etc.)
- Testing checklist
- Deployment notes
- Screenshots (if applicable)

---

## 🎯 Best Practices

### For Contributors

1. **Commit Messages**: Follow conventional commits format
   ```
   feat(dashboard): add real-time updates
   fix(docker): resolve health check issue
   docs(readme): update installation steps
   ```

2. **PR Size**: Keep PRs focused and reasonably sized
   - XS: < 10 lines
   - S: < 50 lines
   - M: < 200 lines
   - L: < 500 lines
   - XL: > 500 lines

3. **Testing**: Ensure all CI checks pass before requesting review

4. **Documentation**: Update docs when adding features

### For Maintainers

1. **Release Process**:
   ```bash
   # Update version in package.json
   npm version patch|minor|major

   # Push tag
   git push origin --tags

   # Workflow will create release automatically
   ```

2. **Security Issues**: Use private security advisories

3. **Stale Management**: Review stale issues weekly

---

## 🔒 Security

- CodeQL runs on every push and PR
- Dependabot monitors dependencies
- Docker images scanned with Trivy
- Security advisories via GitHub Security

**Report vulnerabilities**: Use private security advisories, not public issues.

---

## 📊 Status Badges

Add these to your README:

```markdown
![CI](https://github.com/SoulofSorrow/discord-voicebot/workflows/CI/badge.svg)
![Docker](https://github.com/SoulofSorrow/discord-voicebot/workflows/Docker%20Build%20%26%20Publish/badge.svg)
![CodeQL](https://github.com/SoulofSorrow/discord-voicebot/workflows/CodeQL%20Security%20Analysis/badge.svg)
![License](https://img.shields.io/github/license/SoulofSorrow/discord-voicebot)
![Version](https://img.shields.io/github/v/release/SoulofSorrow/discord-voicebot)
```

---

## 🤝 Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed contribution guidelines.

---

*Last updated: 2025-11-02*
