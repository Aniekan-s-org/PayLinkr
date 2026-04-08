# Architecture

This document describes the system design of PayLinkr — how the components fit together, how data flows through the system, and the key design decisions made during development.

---

## Overview

PayLinkr is a three-layer system:

```
┌─────────────────────────────────────────┐
│              User / Browser             │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│         Frontend (React + Vite)         │
│   CreateLink  │  PayPage  │ StatusPage  │
└────────────────────┬────────────────────┘
                     │  Stellar SDK (soroban.ts)
┌────────────────────▼────────────────────┐
│       Soroban Smart Contract (Rust)     │
│  create_request │ pay │ is_paid │ get   │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│         Stellar Ledger (Testnet)        │
└─────────────────────────────────────────┘
```

There is no trusted backend. All business logic lives in the Soroban contract. The frontend is a pure client-side app that talks directly to the Stellar RPC node.

---

## Layer 1: Smart Contract

**Location:** `contract/src/lib.rs`
**Language:** Rust
**Platform:** Soroban (Stellar's native smart contract platform)

### Responsibilities

- Store payment requests on-chain
- Enforce payment rules (expiry, double-pay prevention)
- Execute token transfers between payer and creator
- Expose read functions for status checks

### Data Model

```rust
pub struct PaymentRequest {
    pub creator: Address,    // who receives the payment
    pub token: Address,      // SAC token address (e.g. USDC)
    pub amount: i128,        // amount in base units
    pub description: String, // human-readable note
    pub expiry: u64,         // Unix timestamp; 0 = no expiry
    pub paid: bool,          // payment status
    pub payer: Option<Address>, // set after payment
}
```

### Storage Strategy

PayLinkr uses **Persistent Storage** for all payment requests. This means:

- Data survives ledger eviction as long as TTL is extended
- Each request is keyed by its unique `Symbol` ID
- The contract does not use Instance or Temporary storage for requests, keeping the design simple and predictable

```rust
pub enum DataKey {
    Request(Symbol), // keyed by payment link ID
}
```

### Security Properties

- `creator.require_auth()` — only the creator can register a request under their address
- `payer.require_auth()` — only the payer can authorize a payment from their account
- Double-pay prevention — the contract panics if `paid == true`
- Expiry enforcement — the contract checks `env.ledger().timestamp()` against the stored expiry
- No admin key — there is no privileged account that can override or drain funds

### Token Transfers

PayLinkr does not hold funds. When `pay()` is called, the contract uses the Soroban token interface to transfer directly from the payer's account to the creator's account:

```rust
let token_client = token::Client::new(&env, &request.token);
token_client.transfer(&payer, &request.creator, &request.amount);
```

This means the payer must have pre-approved the contract to spend the token amount, or the transfer is done via the standard Soroban auth flow.

---

## Layer 2: Frontend

**Location:** `frontend/paylinkr-ui/`
**Stack:** React 18, TypeScript, Vite

### Pages

| Page | Route | Responsibility |
|---|---|---|
| `CreateLink.tsx` | `/` | Form to generate a payment request and produce a shareable link |
| `PayPage.tsx` | `/pay/:id` | Displays the payment request and triggers the `pay()` contract call |
| `StatusPage.tsx` | `/status/:id` | Reads `is_paid()` and `get_request()` to show current status |

### Contract Interaction (`soroban.ts`)

`src/lib/soroban.ts` is the single integration point between the UI and the Soroban contract. It provides:

- `invokeContract(method, args, keypair)` — builds, simulates, signs, and submits a transaction
- `simulateContract(method, args, publicKey)` — read-only simulation, no signing required
- Encoding helpers: `toSymbol`, `toAddress`, `toI128`, `toU64`, `toString`

### Wallet Integration

The frontend is designed to integrate with [Freighter](https://www.freighter.app/), the standard Stellar browser wallet. The `invokeContract` function accepts a keypair interface that Freighter satisfies — swapping in Freighter requires only replacing the signing step.

### localStorage Fallback

During development, before a contract is deployed, the frontend uses `localStorage` to simulate on-chain state. This allows the full UI flow to be tested without a live contract. Each page has a clearly marked `// TODO: replace with contract call` comment showing exactly where the real integration goes.

---

## Data Flow: Creating a Payment Link

```
1. User fills in amount, description, expiry on CreateLink page
2. Frontend generates a random 8-char ID (e.g. "abc123")
3. Frontend calls contract create_request(creator, id, token, amount, description, expiry)
4. Contract stores the PaymentRequest in persistent storage
5. Frontend constructs the link: paylinkr.app/pay/abc123
6. User copies and shares the link
```

## Data Flow: Paying a Link

```
1. Payer opens paylinkr.app/pay/abc123
2. Frontend calls contract get_request("abc123") to load details
3. Frontend displays amount and description
4. Payer clicks "Pay Now"
5. Freighter wallet prompts for authorization
6. Frontend calls contract pay(payer, "abc123")
7. Contract verifies: not expired, not already paid
8. Contract calls token.transfer(payer → creator, amount)
9. Contract marks request as paid
10. Frontend redirects to /status/abc123
```

---

## Design Decisions

### Why no backend?

A backend would introduce a trusted intermediary. By keeping all logic on-chain, PayLinkr is:
- Censorship-resistant — no server can block a payment
- Trustless — neither party needs to trust PayLinkr the company
- Permissionless — anyone can deploy their own instance

A backend is listed as optional in the roadmap for features like email notifications and indexing, but it will never be in the critical payment path.

### Why Persistent storage over Instance?

Payment requests are per-ID data that must survive indefinitely until paid or expired. Instance storage is shared across all contract invocations and is better suited for global config. Persistent storage with a per-ID key is the correct model here.

### Why Symbol for the ID?

Soroban `Symbol` is a compact, gas-efficient type for short string keys. Payment link IDs are short alphanumeric strings, making `Symbol` the right choice over `String` for storage keys.

---

## Future Architecture

As PayLinkr grows, the following additions are planned:

- **TypeScript SDK** (`@paylinkr/sdk`) — wraps `soroban.ts` into a publishable npm package
- **Optional backend** — for notifications, indexing, and webhook support
- **Invoice history** — an on-chain or indexed view of all requests by creator address
- **Partial payments** — allow flexible amounts with a minimum threshold
