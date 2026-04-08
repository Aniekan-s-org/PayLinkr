# PayLinkr — Micro-Invoice & Payment Link Generator

<div align="center">

<img src="https://img.shields.io/badge/Stellar-Soroban-purple" alt="Stellar Soroban" />
<img src="https://img.shields.io/badge/Language-Rust-orange" alt="Rust" />
<img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue" alt="React TypeScript" />
<img src="https://img.shields.io/badge/Status-Testnet-green" alt="Status" />
<img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" />

</div>

> **PayLinkr** is a Stripe-like payment link protocol for crypto users — built natively on Stellar and Soroban smart contracts. Freelancers, creators, and small vendors can generate a shareable payment link in seconds and get paid on-chain without any manual wallet coordination.

Think of it as **"Web3 Stripe for Stellar"** — practical, minimal, and built for real people.

---

## 🧩 The Problem

Crypto payments are still too manual. A freelancer who wants to request payment has to:

- Share their wallet address
- Tell the client which token to send
- Specify the exact amount
- Hope the client doesn't make a typo

There is no equivalent of a Stripe payment link in Web3 — until now.

---

## 💡 The Solution

PayLinkr lets anyone generate a payment link like:

```
paylinkr.app/pay/abc123
```

Share it via WhatsApp, Twitter, email, or a DM. The recipient opens it, sees the amount and description, clicks **Pay Now**, and the Soroban contract handles the rest.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Payment Links** | Generate a unique, shareable link for any payment request |
| **Fixed Amounts** | Set an exact amount the payer must send |
| **Expiry Dates** | Links can expire after a set time — enforced on-chain |
| **Descriptions** | Add a note like "Logo design" or "Invoice #004" |
| **Status Tracking** | Check paid / unpaid status at any time |
| **Multi-token Support** | Accept any Stellar Asset Contract (SAC) token — USDC, XLM, or custom |
| **On-chain Enforcement** | All logic lives in the Soroban contract — no trusted backend |
| **Open SDK** | Developers can embed payment links into their own apps |

---

## 🏗️ Architecture Overview

PayLinkr is split into three parts:

```
paylinkr/
├── contract/              # Rust — Soroban smart contract
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── frontend/
│   └── paylinkr-ui/       # React + TypeScript (Vite)
│       ├── src/
│       │   ├── pages/     # CreateLink, PayPage, StatusPage
│       │   └── lib/       # soroban.ts — contract interaction helpers
│       └── .env.example
└── docs/                  # Full documentation
```

For a deep dive into the system design, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
For folder-by-folder breakdown, see [docs/STRUCTURE.md](docs/STRUCTURE.md).

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Rust | 1.70+ | `curl https://sh.rustup.rs -sSf \| sh` |
| WASM target | — | `rustup target add wasm32-unknown-unknown` |
| Stellar CLI | latest | `cargo install --locked stellar-cli` |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Freighter Wallet | latest | [freighter.app](https://www.freighter.app/) |

---

### 1. Clone the Repository

```bash
git clone https://github.com/Aniekan-s-org/PayLinkr.git
cd paylinkr
```

---

### 2. Smart Contract (Rust)

```bash
cd contract

# Build the WASM binary
cargo build --target wasm32-unknown-unknown --release

# Run tests
cargo test
```

#### Deploy to Testnet

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/paylinkr.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet
```

Copy the returned contract ID — you'll need it for the frontend `.env`.

For full deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

### 3. Frontend (React + TypeScript)

```bash
cd frontend/paylinkr-ui

# Copy environment config
cp .env.example .env
# → Fill in VITE_CONTRACT_ID with your deployed contract address

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:5173` to view the app.

---

## 🔌 Contract API

| Function | Parameters | Description |
|---|---|---|
| `create_request` | `creator, id, token, amount, description, expiry` | Create a new payment request on-chain |
| `pay` | `payer, id` | Pay a request — transfers tokens from payer to creator |
| `is_paid` | `id` | Returns `bool` — whether the request has been paid |
| `get_request` | `id` | Returns the full `PaymentRequest` struct |

Full API reference: [docs/API.md](docs/API.md)

---

## 🖥️ Frontend Pages

| Route | Description |
|---|---|
| `/` | Create a payment link |
| `/pay/:id` | Payment page — shared with clients |
| `/status/:id` | Check paid / unpaid status |

---

## 🔗 Connecting the Contract

The frontend ships with a `localStorage` fallback so you can run the UI without a deployed contract. Once you deploy:

1. Set `VITE_CONTRACT_ID` in your `.env`
2. Replace `localStorage` calls in each page with the helpers in `src/lib/soroban.ts`
3. Integrate [Freighter wallet](https://www.freighter.app/) for transaction signing

---

## 📦 SDK

PayLinkr exposes a TypeScript SDK so developers can embed payment links into their own apps.

```bash
# Coming soon
npm install @paylinkr/sdk
```

See [docs/API.md](docs/API.md) for the full SDK reference.

---

## 🧪 Testing

```bash
# Smart contract tests
cd contract
cargo test

# Frontend (dev server must be running)
cd frontend/paylinkr-ui
npm run dev
```

Full testing guide: [docs/TESTING.md](docs/TESTING.md)

---

## 🗺️ Roadmap

- [x] Soroban payment request contract (create, pay, status)
- [x] React frontend with create / pay / status pages
- [x] Expiry date enforcement on-chain
- [x] Multi-token support via SAC
- [ ] Freighter wallet integration
- [ ] TypeScript SDK (`@paylinkr/sdk`)
- [ ] On-chain invoice history dashboard
- [ ] Flexible / partial payment amounts
- [ ] Email / webhook notifications (backend)
- [ ] Mainnet deployment

---

## 🤝 Contributing

We welcome contributions of all kinds — bug fixes, new features, documentation, and SDK work.

- Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started
- Browse open issues for good first tasks
- Join the discussion in GitHub Discussions

---

## 🔒 Security

Found a vulnerability? Please do **not** open a public issue.
Read our responsible disclosure policy: [docs/SECURITY.md](docs/SECURITY.md)

---

## 📄 License

PayLinkr is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ on <a href="https://stellar.org">Stellar</a> + <a href="https://soroban.stellar.org">Soroban</a>
</div>
