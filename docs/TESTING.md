# Testing Guide

This document covers the testing strategy for PayLinkr — how to run tests, what is covered, and how to write new tests.

---

## Overview

PayLinkr has two testing surfaces:

| Layer | Framework | Location |
|---|---|---|
| Smart Contract | Rust + Soroban test utilities | `contract/src/lib.rs` (`#[cfg(test)]`) |
| Frontend | Manual / browser testing | `frontend/paylinkr-ui/` |

---

## Smart Contract Tests

### Running Tests

```bash
cd contract
cargo test
```

To see output from passing tests (useful for debugging):

```bash
cargo test -- --nocapture
```

To run a specific test:

```bash
cargo test test_create_and_pay
```

### Test Coverage

The contract test suite covers the following scenarios:

| Test | Description |
|---|---|
| `test_create_and_pay` | Full happy path: create a request, pay it, verify balances |
| `test_double_pay_fails` | Paying an already-paid request must panic with `"already paid"` |
| `test_expired_link_fails` | Paying an expired link must panic with `"payment link expired"` |

### How the Tests Work

Soroban provides a mock environment (`Env::default()`) that simulates the ledger in memory. Tests use:

- `env.mock_all_auths()` — bypasses signature verification so tests focus on logic
- `env.register_stellar_asset_contract_v2()` — deploys a real token contract in the test environment
- `StellarAssetClient` — mints tokens to test accounts
- `env.ledger().with_mut()` — manipulates the ledger timestamp to test expiry

**Example: Happy Path Test**

```rust
#[test]
fn test_create_and_pay() {
    let (env, admin, creator, payer) = setup();

    // Deploy a test token and mint 100 units to payer
    let token_id = env.register_stellar_asset_contract_v2(admin.clone());
    let token_address = token_id.address();
    let token_admin = StellarAssetClient::new(&env, &token_address);
    let token = TokenClient::new(&env, &token_address);
    token_admin.mint(&payer, &100);

    // Deploy PayLinkr
    let contract_id = env.register(PayLinkr, ());
    let client = PayLinkrClient::new(&env, &contract_id);

    let id = Symbol::new(&env, "abc123");
    let desc = String::from_str(&env, "Logo design");

    // Create request for 10 tokens
    client.create_request(&creator, &id, &token_address, &10, &desc, &0);
    assert!(!client.is_paid(&id));

    // Pay it
    client.pay(&payer, &id);

    // Verify balances and status
    assert!(client.is_paid(&id));
    assert_eq!(token.balance(&creator), 10);
    assert_eq!(token.balance(&payer), 90);
}
```

**Example: Expiry Test**

```rust
#[test]
#[should_panic(expected = "payment link expired")]
fn test_expired_link_fails() {
    // Set ledger time to 1000
    env.ledger().with_mut(|l| l.timestamp = 1000);

    // Create request with expiry at timestamp 500 (already in the past)
    client.create_request(&creator, &id, &token_address, &10, &desc, &500);

    // This should panic
    client.pay(&payer, &id);
}
```

### Writing New Tests

When adding a new feature to the contract, add a corresponding test. Follow this pattern:

```rust
#[test]
fn test_your_feature() {
    let (env, admin, creator, payer) = setup();

    // 1. Set up token
    let token_id = env.register_stellar_asset_contract_v2(admin.clone());
    let token_address = token_id.address();
    StellarAssetClient::new(&env, &token_address).mint(&payer, &1000);

    // 2. Deploy contract
    let contract_id = env.register(PayLinkr, ());
    let client = PayLinkrClient::new(&env, &contract_id);

    // 3. Your test logic here
    // ...

    // 4. Assert expected outcomes
    assert!(/* your condition */);
}
```

For tests that expect a panic, use `#[should_panic(expected = "your error message")]`.

---

## Frontend Testing

### Manual Test Flow

The frontend uses `localStorage` as a fallback when no contract is deployed. You can test the full UI flow without a live contract:

**Create Link Flow:**
1. Run `npm run dev` in `frontend/paylinkr-ui/`
2. Open `http://localhost:5173`
3. Enter an amount (e.g. `10`), a description (e.g. `Logo design`), and an optional expiry
4. Click "Generate Link →"
5. Verify a link is shown (e.g. `http://localhost:5173/pay/abc123`)
6. Click "Copy" and verify it copies to clipboard
7. Click "Check Status" and verify it navigates to `/status/abc123` showing "Unpaid"

**Pay Flow:**
1. Open the generated link (e.g. `http://localhost:5173/pay/abc123`)
2. Verify the amount and description are displayed correctly
3. Click "Pay Now →"
4. Verify it redirects to `/status/abc123` showing "Paid ✅"

**Expiry Flow:**
1. Create a link with an expiry date in the past (edit `localStorage` manually)
2. Open the pay link
3. Verify it shows "This payment link has expired."

**Not Found Flow:**
1. Open `http://localhost:5173/pay/doesnotexist`
2. Verify it shows "Payment link not found."

### Build Check

```bash
cd frontend/paylinkr-ui
npm run build
```

This must complete without TypeScript errors or build failures.

### Lint Check

```bash
cd frontend/paylinkr-ui
npm run lint
```

No lint errors should be present before submitting a PR.

---

## CI / Continuous Integration

A GitHub Actions workflow is planned to run on every PR:

```yaml
# .github/workflows/test.yml (planned)
- cargo test          # contract tests
- cargo clippy        # lint
- cargo fmt --check   # formatting
- npm run build       # frontend build
- npm run lint        # frontend lint
```

Until the workflow is live, run these checks manually before opening a PR.

---

## Checklist Before Opening a PR

- [ ] `cargo test` passes with no failures
- [ ] `cargo clippy -- -D warnings` passes with no warnings
- [ ] `cargo fmt --check` passes
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
- [ ] Manual UI flow tested in browser
- [ ] New features have corresponding contract tests
