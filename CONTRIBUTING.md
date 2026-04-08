# Contributing to PayLinkr

Thank you for your interest in contributing to PayLinkr. This project is open source and community-driven — every contribution, no matter how small, helps move the Web3 payments ecosystem forward on Stellar.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Smart Contract Contributions](#smart-contract-contributions)
- [Frontend Contributions](#frontend-contributions)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

By participating in this project, you agree to uphold a respectful and inclusive environment. We follow the [Contributor Covenant](https://www.contributor-covenant.org/). Harassment, discrimination, or hostile behavior of any kind will not be tolerated.

---

## Ways to Contribute

You do not need to write code to contribute. Here are all the ways you can help:

- **Bug reports** — found something broken? Open an issue with steps to reproduce
- **Feature requests** — have an idea? Open a discussion or issue
- **Code** — fix bugs, implement roadmap items, improve performance
- **Documentation** — improve clarity, fix typos, add examples
- **SDK development** — help build `@paylinkr/sdk`
- **Testing** — write unit tests, integration tests, or manual test reports
- **Design** — UI/UX improvements to the frontend

---

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/paylinkr.git
cd paylinkr
```

### 2. Set Up the Contract

```bash
# Install Rust if you haven't
curl https://sh.rustup.rs -sSf | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli

# Build the contract
cd contract
cargo build --target wasm32-unknown-unknown --release

# Run tests
cargo test
```

### 3. Set Up the Frontend

```bash
cd frontend/paylinkr-ui
cp .env.example .env
npm install
npm run dev
```

---

## Development Workflow

1. Create a branch from `main`:

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-description
```

2. Make your changes
3. Test your changes (see [docs/TESTING.md](docs/TESTING.md))
4. Commit using the convention below
5. Push and open a Pull Request

---

## Smart Contract Contributions

The contract lives in `contract/src/lib.rs` and is written in Rust using the Soroban SDK.

**Before submitting a contract PR:**

- Run `cargo test` — all tests must pass
- Run `cargo clippy` — no warnings allowed
- Run `cargo fmt` — code must be formatted
- If you add a new function, add a corresponding test in the `#[cfg(test)]` block
- If you change storage layout, document the migration path

```bash
cd contract
cargo test
cargo clippy -- -D warnings
cargo fmt --check
```

---

## Frontend Contributions

The frontend is a React + TypeScript app using Vite.

**Before submitting a frontend PR:**

- Run `npm run build` — must compile without errors
- Run `npm run lint` — no lint errors
- Keep components small and focused
- Do not introduce new dependencies without discussion

```bash
cd frontend/paylinkr-ui
npm run build
npm run lint
```

---

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that is not a fix or feature |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, dependencies |

**Examples:**

```
feat(contract): add flexible amount support to create_request
fix(frontend): handle expired link edge case on PayPage
docs: update DEPLOYMENT.md with mainnet instructions
test(contract): add test for double-pay prevention
```

---

## Pull Request Process

1. Ensure your branch is up to date with `main` before opening a PR
2. Fill out the PR template completely
3. Link any related issues using `Closes #<issue-number>`
4. Request a review from a maintainer
5. Address all review comments before merging
6. PRs are squash-merged into `main`

**PR checklist:**

- [ ] Tests pass (`cargo test` / `npm run build`)
- [ ] No lint warnings
- [ ] Documentation updated if needed
- [ ] Commit messages follow the convention

---

## Reporting Bugs

Open a GitHub issue and include:

- A clear title describing the bug
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Rust version, Node version, browser)
- Any relevant error messages or screenshots

---

## Suggesting Features

Open a GitHub issue with the label `enhancement` and describe:

- The problem you are trying to solve
- Your proposed solution
- Any alternatives you considered
- Why this would benefit other users

---

Thank you for helping build PayLinkr. Every contribution matters.
