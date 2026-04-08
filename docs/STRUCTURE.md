# Project Structure

This document describes the folder and file layout of the PayLinkr repository.

---

## Top-Level Layout

```
paylinkr/
├── contract/              # Rust — Soroban smart contract
├── frontend/              # React + TypeScript UI
├── docs/                  # Project documentation
├── .gitignore             # Git ignore rules
├── CONTRIBUTING.md        # Contribution guidelines
├── LICENSE                # MIT License
└── README.md              # Project overview
```

---

## `contract/`

The Soroban smart contract written in Rust.

```
contract/
├── Cargo.toml             # Rust package manifest and dependencies
└── src/
    └── lib.rs             # Contract logic, data types, and tests
```

### Key Files

**`Cargo.toml`**
Defines the package name, version, and dependencies. The key dependency is `soroban-sdk`. The `[lib]` section sets `crate-type = ["cdylib"]` which is required for WASM compilation.

**`src/lib.rs`**
The entire contract lives here. It contains:
- `DataKey` enum — storage key definitions
- `PaymentRequest` struct — the on-chain data model
- `PayLinkr` contract struct and `#[contractimpl]` block with all public functions
- `#[cfg(test)]` module with unit tests

---

## `frontend/`

The React + TypeScript frontend application.

```
frontend/
└── paylinkr-ui/
    ├── .env.example           # Environment variable template
    ├── .gitignore             # Frontend-specific ignores
    ├── index.html             # Vite HTML entry point
    ├── package.json           # Node dependencies and scripts
    ├── tsconfig.json          # TypeScript config (root)
    ├── tsconfig.app.json      # TypeScript config (app)
    ├── tsconfig.node.json     # TypeScript config (Vite/Node)
    ├── vite.config.ts         # Vite build configuration
    ├── eslint.config.js       # ESLint configuration
    ├── public/
    │   ├── favicon.svg        # App favicon
    │   └── icons.svg          # Icon sprite
    └── src/
        ├── main.tsx           # React entry point (renders App)
        ├── App.tsx            # Router setup (React Router)
        ├── App.css            # Global app styles
        ├── index.css          # Base CSS reset and variables
        ├── assets/            # Static assets (images, SVGs)
        ├── lib/
        │   └── soroban.ts     # Stellar SDK wrapper and contract helpers
        └── pages/
            ├── CreateLink.tsx # Page: generate a payment link
            ├── PayPage.tsx    # Page: pay a request
            └── StatusPage.tsx # Page: check paid/unpaid status
```

### Key Files

**`src/main.tsx`**
Entry point. Wraps the app in `BrowserRouter` from React Router and renders `<App />`.

**`src/App.tsx`**
Defines the three routes:
- `/` → `CreateLink`
- `/pay/:id` → `PayPage`
- `/status/:id` → `StatusPage`

**`src/lib/soroban.ts`**
The integration layer between the UI and the Soroban contract. Contains:
- `invokeContract` — for state-changing calls (create, pay)
- `simulateContract` — for read-only calls (is_paid, get_request)
- Encoding helpers for Soroban types

**`src/pages/CreateLink.tsx`**
The main landing page. Users enter amount, description, and expiry, then generate a shareable link. Currently uses `localStorage` as a fallback; replace with `invokeContract("create_request", ...)` for live contract integration.

**`src/pages/PayPage.tsx`**
The page a payer sees when they open a payment link. Loads the request details and triggers the payment. Replace `localStorage` reads with `simulateContract("get_request", ...)` and the pay button with `invokeContract("pay", ...)`.

**`src/pages/StatusPage.tsx`**
Shows the current status of a payment request. Replace `localStorage` reads with `simulateContract("is_paid", ...)` and `simulateContract("get_request", ...)`.

**`.env.example`**
Template for environment variables. Copy to `.env` and fill in your deployed contract ID:
```env
VITE_CONTRACT_ID=YOUR_DEPLOYED_CONTRACT_ID
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

---

## `docs/`

Project documentation.

```
docs/
├── API.md           # Contract function reference and TypeScript helpers
├── ARCHITECTURE.md  # System design and data flow
├── DEPLOYMENT.md    # How to build, deploy, and host
├── SECURITY.md      # Vulnerability disclosure policy
├── STRUCTURE.md     # This file
└── TESTING.md       # How to run and write tests
```

---

## Root Files

| File | Purpose |
|---|---|
| `README.md` | Project overview, quick start, feature list |
| `CONTRIBUTING.md` | How to contribute — setup, workflow, PR process |
| `LICENSE` | MIT License |
| `.gitignore` | Ignores `target/`, `node_modules/`, `.env`, secrets, etc. |
