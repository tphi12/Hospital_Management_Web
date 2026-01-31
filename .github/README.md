# Hospital Management CI/CD

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

- **backend-ci.yml**: CI pipeline for Backend (Node.js + Express)
- **frontend-ci.yml**: CI pipeline for Frontend (React + Vite)

## Quick Links

- [Branch Protection Setup Guide](./BRANCH_PROTECTION_GUIDE.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Workflow Triggers

Both workflows are triggered on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when respective directories (BE/ or FE/) are modified

## Status Badges

Add these to your main README.md:

```markdown
[![Backend CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/backend-ci.yml)

[![Frontend CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/frontend-ci.yml)
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual values.
