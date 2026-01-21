# Contributing to VS Code Experimental Settings Tracker

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## How to Contribute

### Reporting Issues

- Check existing issues before creating a new one
- Use a clear, descriptive title
- Provide steps to reproduce the issue
- Include relevant details (Node.js version, OS, etc.)

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Test your changes locally with `npm start`
5. Commit with clear messages (`git commit -m 'Add feature X'`)
6. Push to your fork (`git push origin feature/my-feature`)
7. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/vscode-experimental-tracker.git
cd vscode-experimental-tracker

# Run the analysis (clones VS Code repos automatically)
npm start
```

### Code Style

- Use ES modules (`import`/`export`)
- Follow existing code patterns
- Add comments for complex logic
- Keep functions focused and modular

### Pull Request Guidelines

- Reference related issues in the PR description
- Keep changes focused and minimal
- Update documentation if needed
- Ensure the analysis pipeline runs successfully

## Questions?

Open an issue if you have questions about contributing.
