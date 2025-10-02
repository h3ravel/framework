# Contribution Guide

This guide serves to facilitate effective collaboration within the H3ravel ecosystem. By following these conventions, we ensure the codebase stays clear and organized, streamlining reviews and development for all contributors.

## Required Skillset

While a working knowlege of Serverside programing and JavaScript is enough to contribute effectively to H3ravel, we also recommend that you should either:

- <icon name="fas fa-square-check" /> Be familiar with [TypeScript](https://www.typescriptlang.org), [Node.js](https://nodejs.org), and the [H3](https://h3.dev) framework,
- <icon name="fas fa-square-check" /> Have working knowledge of [Laravel’s](https://laravel.com) architecture and patterns,
- <icon name="fas fa-square-check" /> Or be open-minded and willing to quickly learn the Laravel-inspired approach this project uses.

Understanding the fundamentals of dependency injection, middleware pipelines, and modern service container patterns will be a big plus.

## AI Contribution

We recognize that AI has come to stay and is gradually becoming a permanent part of our development landscape, this changes our approach to work and the way we collaborate. We have 100% tollerance for AI generated contributions provided they meet the following criteria:

- **Declares it's origin**: AI generated contributions must indicate that they were AI generated.
- **35/65 PR Rule**: AI generated contributions must not account for more than 35% of a particular pull request.
- **Efficiently addresses the problem**: Contributions must directly and efficiently address the stated issue or task.
- **Remain concise**: Code and documentation should be clear, focused, and free of unnecessary bloat.
- **Thoroughly reviewed by a human**: A human developer must carefully review all AI generated code for accuracy, code quality, and adherence to project standards.
- **Free of malware**: Contributions must not introduce security risks, malicious code, or vulnerabilities.
- **Follow project conventions**: AI generated code must align with our coding style, naming conventions, and commit guidelines.
- **Include tests where applicable**: For new features or bug fixes, include or update tests to ensure functionality and maintainability.

### Example Workflow for AI Contributions

1. Use AI tools to generate code or documentation.
2. Review and refine the output to ensure it meets project standards.
3. Test the changes locally to verify functionality.
4. Commit changes with a clear message, e.g., `feat: (Contains AI Code) add authentication middleware`.
5. Submit a pull request for team review, noting that AI was used.

### Why This Matters

Embracing AI enhances productivity, but human oversight ensures quality and security. By adhering to these guidelines, we maintain a robust, collaborative, and safe codebase.

## Basics

- Use `lowercase` for branch names and commit messages for consistency.
- Write concise, clear commit messages; split complex changes into smaller commits if needed.
- Keep commit titles under 72 characters, adding details in the extended description if necessary.
- Address one concern per commit, grouping related changes together and separating unrelated ones.

## Branch Naming

Adopt this branch naming convention for clarity and instant recognition of purpose:

### Format:

`<prefix>/<short-description>`

### Main Prefixes:

- `feat/`: New feature development.
- `fix/`: Bug fixes and corrections.
- `remove/`: Removing files or features.
- `docs/`: Documentation changes.
- `style/`: Visual or formatting updates (no logic changes).
- `refactor/`: Code restructuring without functional changes.
- `perf/`: Performance enhancements.
- `test/`: Test additions or updates.
- `build/`: Build system or dependency modifications.
- `ci/`: Continuous integration updates.
- `chore/`: Routine maintenance tasks.

### Example Branch Names:

- `feat/auth-middleware`
- `fix/translation-error`
- `docs/api-endpoints`
- `style/user-contract-interface`

## Crafting Clear Commits

Write concise, meaningful commit messages to clarify changes for collaborators.

### Commit Format:

`<type>: <what you did>`

### Commit Types:

- `feat`: New feature additions.
- `fix`: Bug fixes and corrections.
- `docs`: Documentation updates.
- `style`: Formatting or visual tweaks.
- `refactor`: Code restructuring, no functional changes.
- `perf`: Performance improvements.
- `test`: Test additions or updates.
- `build`: Dependency or build tool changes.
- `ci`: CI/CD modifications.
- `chore`: Routine maintenance tasks.
- `update`: Minor non-functional improvements.

## Commit Rules

- **Be clear and direct**: Write commits that precisely describe the changes.
- **Use present tense**: E.g., "add email validation" not "added email validation".
- **Avoid vague or temporary commits**: Keep unfinished work in local branches or draft PRs.

### Example Commit Messages

- `feat: implement authentication middleware`
- `fix: fix route resolution issue`
- `docs: update API documentation`
- `style: add typings for user contract interface`

### Why It Matters

A clear commit history streamlines code reviews, collaboration, and debugging, maintaining project organization and quality.

## Join the Community

- [General Discussions](https://github.com/orgs/h3ravel/discussions/10)
- [Lend your ideas](https://github.com/orgs/h3ravel/discussions/11)
- [Discord Server](https://discord.gg/hsG2A8PuGb)

### Thank You for Contributing

Following these recommendation ensures the project’s clarity and success. Share suggestions to improve this guide!
