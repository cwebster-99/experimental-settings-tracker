# Security Policy

## Scope

This project analyzes publicly available source code from Microsoft's VS Code repositories. It does not handle sensitive data, authentication, or user information.

## Reporting a Vulnerability

If you discover a security issue, please report it by opening a GitHub issue. Since this project only processes public repository data, most security concerns would be related to:

- Malicious code injection in scripts
- Unexpected network requests
- Issues with the GitHub Actions workflow

## Best Practices

When running this tool locally:

- Review the code before running
- The tool clones repositories from `github.com/microsoft/*`
- No credentials or tokens are required for basic operation

## Updates

Keep Node.js updated to the latest LTS version for security patches.
