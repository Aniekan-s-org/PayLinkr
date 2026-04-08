# Security Policy

## Supported Versions

PayLinkr is currently in active development and deployed on Stellar Testnet. The following versions are actively maintained:

| Version | Status |
|---|---|
| `main` branch | ✅ Actively maintained |
| Testnet deployment | ✅ Supported |
| Mainnet deployment | 🔜 Not yet deployed |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in PayLinkr — whether in the smart contract, the frontend, or the SDK — please report it responsibly by emailing:

```
security@[your-domain]
```

Include the following in your report:

- A description of the vulnerability
- The component affected (contract, frontend, SDK)
- Steps to reproduce or a proof-of-concept
- The potential impact
- Any suggested mitigations (optional)

You will receive an acknowledgment within **48 hours** and a full response within **7 days** outlining the next steps.

We ask that you:
- Give us reasonable time to investigate and patch before public disclosure
- Not exploit the vulnerability beyond what is necessary to demonstrate it
- Not access or modify other users' data

---

## Smart Contract Security Model

### No Admin Key

The PayLinkr contract has no privileged admin address. There is no function that allows any party to:
- Drain funds from the contract
- Override a payment status
- Cancel or modify another user's payment request

### Auth Requirements

Every state-changing function requires explicit authorization:

- `create_request` — requires `creator.require_auth()`. Only the creator can register a request under their address.
- `pay` — requires `payer.require_auth()`. Only the payer can authorize a transfer from their account.

### No Fund Custody

PayLinkr does not hold funds. The contract never receives tokens. When `pay()` is called, the token transfer goes directly from the payer's account to the creator's account via the Soroban token interface. There is no intermediate escrow.

### Double-Pay Prevention

The contract enforces that a request can only be paid once. Attempting to pay an already-paid request will panic with `"already paid"`.

### Expiry Enforcement

Expiry is enforced using `env.ledger().timestamp()`, which is the canonical ledger time set by the Stellar network validators. It cannot be manipulated by the caller.

### Duplicate ID Prevention

The contract panics with `"request already exists"` if a caller attempts to register a payment request with an ID that is already in use. This prevents overwriting existing requests.

---

## Frontend Security Considerations

### Environment Variables

Never commit your `.env` file. The `.gitignore` is configured to exclude all `.env` variants. The `VITE_CONTRACT_ID` and RPC URL are public values, but treat your Stellar secret key with the same care as a private key — never expose it in frontend code or commit it to version control.

### Wallet Integration

When Freighter wallet integration is added, all transaction signing will happen inside the Freighter extension. The frontend will never have access to the user's secret key.

### Input Validation

The frontend validates user inputs (amount, expiry) before constructing contract calls. However, the contract is the source of truth — all rules are enforced on-chain regardless of what the frontend sends.

---

## Known Limitations

- **TTL / Ledger Rent**: Persistent storage entries can be evicted if their TTL expires. The current contract does not auto-extend TTL. For production use, TTL extension should be added to prevent data loss.
- **No Upgrade Mechanism**: The current contract does not include an upgrade function. Breaking changes require a new deployment.
- **localStorage Fallback**: The frontend's `localStorage` fallback is for development only. It provides no security guarantees and should never be used in production.

---

## Disclosure Policy

We follow a **coordinated disclosure** model:

1. Reporter submits vulnerability privately
2. We acknowledge within 48 hours
3. We investigate and develop a fix
4. We release the fix
5. We publicly disclose the vulnerability details (with credit to the reporter, if desired) after the fix is live

We do not offer a bug bounty program at this time, but we will publicly credit researchers who responsibly disclose valid vulnerabilities.
