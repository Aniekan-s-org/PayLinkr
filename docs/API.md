# API Reference

This document covers the PayLinkr Soroban contract API and the TypeScript helpers used to interact with it from the frontend.

---

## Smart Contract Functions

The PayLinkr contract is deployed on the Stellar network. All functions are invoked via Soroban transactions.

### `create_request`

Creates a new payment request on-chain.

**Signature:**
```rust
pub fn create_request(
    env: Env,
    creator: Address,
    id: Symbol,
    token: Address,
    amount: i128,
    description: String,
    expiry: u64,
)
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `creator` | `Address` | The Stellar address that will receive the payment. Must sign the transaction. |
| `id` | `Symbol` | Unique identifier for this payment link (e.g. `"abc123"`). Max 32 chars. |
| `token` | `Address` | The SAC (Stellar Asset Contract) address of the token to accept. |
| `amount` | `i128` | Amount in the token's base unit (e.g. stroops for XLM, or 7-decimal units for USDC). |
| `description` | `String` | Human-readable note shown to the payer (e.g. `"Logo design"`). |
| `expiry` | `u64` | Unix timestamp after which the link is invalid. Pass `0` for no expiry. |

**Errors:**
- Panics with `"request already exists"` if the `id` is already in use.
- Panics if `creator` does not authorize the call.

**Example (TypeScript):**
```typescript
import { toSymbol, toAddress, toI128, toU64, toString, invokeContract } from "./lib/soroban";

await invokeContract("create_request", [
  toAddress(creatorPublicKey),
  toSymbol("abc123"),
  toAddress(usdcContractAddress),
  toI128(BigInt(10_000_000)), // 10 USDC (7 decimals)
  toString("Logo design"),
  toU64(BigInt(expiryTimestamp)),
], creatorKeypair);
```

---

### `pay`

Pays an existing payment request. Transfers tokens from the payer to the creator.

**Signature:**
```rust
pub fn pay(env: Env, payer: Address, id: Symbol)
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `payer` | `Address` | The Stellar address paying the request. Must sign the transaction. |
| `id` | `Symbol` | The payment link ID to pay. |

**Errors:**
- Panics with `"request not found"` if the ID does not exist.
- Panics with `"already paid"` if the request has already been paid.
- Panics with `"payment link expired"` if the current ledger timestamp exceeds the expiry.

**Example (TypeScript):**
```typescript
await invokeContract("pay", [
  toAddress(payerPublicKey),
  toSymbol("abc123"),
], payerKeypair);
```

---

### `is_paid`

Returns whether a payment request has been paid. Read-only — does not require signing.

**Signature:**
```rust
pub fn is_paid(env: Env, id: Symbol) -> bool
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `id` | `Symbol` | The payment link ID to check. |

**Returns:** `bool` — `true` if paid, `false` if unpaid or not found.

**Example (TypeScript):**
```typescript
import { simulateContract, toSymbol } from "./lib/soroban";

const paid = await simulateContract("is_paid", [
  toSymbol("abc123"),
], publicKey);

console.log(paid); // true or false
```

---

### `get_request`

Returns the full details of a payment request. Read-only.

**Signature:**
```rust
pub fn get_request(env: Env, id: Symbol) -> PaymentRequest
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `id` | `Symbol` | The payment link ID to fetch. |

**Returns:** `PaymentRequest` struct.

**Errors:**
- Panics with `"request not found"` if the ID does not exist.

**Return type:**
```rust
pub struct PaymentRequest {
    pub creator: Address,
    pub token: Address,
    pub amount: i128,
    pub description: String,
    pub expiry: u64,       // 0 = no expiry
    pub paid: bool,
    pub payer: Option<Address>, // None until paid
}
```

**Example (TypeScript):**
```typescript
const request = await simulateContract("get_request", [
  toSymbol("abc123"),
], publicKey);

console.log(request.amount);      // bigint
console.log(request.description); // string
console.log(request.paid);        // boolean
```

---

## TypeScript Helpers (`soroban.ts`)

Located at `frontend/paylinkr-ui/src/lib/soroban.ts`.

### Configuration

Set these in your `.env` file:

```env
VITE_CONTRACT_ID=YOUR_DEPLOYED_CONTRACT_ID
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

---

### `invokeContract`

Builds, simulates, signs, and submits a state-changing contract call.

```typescript
invokeContract(
  method: string,
  args: xdr.ScVal[],
  sourceKeypair: { publicKey(): string; secret(): string }
): Promise<GetTransactionResponse>
```

Use this for `create_request` and `pay`.

---

### `simulateContract`

Runs a read-only simulation. No signing or fees required.

```typescript
simulateContract(
  method: string,
  args: xdr.ScVal[],
  sourcePublicKey: string
): Promise<unknown>
```

Use this for `is_paid` and `get_request`.

---

### Encoding Helpers

These convert JavaScript values into the `xdr.ScVal` types that Soroban expects.

| Helper | Input | Soroban Type |
|---|---|---|
| `toAddress(addr: string)` | Stellar public key string | `Address` |
| `toSymbol(s: string)` | Short string (max 32 chars) | `Symbol` |
| `toI128(n: bigint)` | BigInt | `i128` |
| `toU64(n: bigint)` | BigInt | `u64` |
| `toString(s: string)` | Any string | `String` |

---

## Token Amounts

Soroban tokens use integer arithmetic. There are no floating point amounts on-chain.

| Token | Decimals | Example: 10 tokens |
|---|---|---|
| XLM (native) | 7 | `100_000_000` |
| USDC (Circle) | 7 | `100_000_000` |
| Custom SAC | varies | check token contract |

Always convert user-facing amounts before passing to the contract:

```typescript
// User enters "10" USDC
const amount = BigInt(Math.round(parseFloat(userInput) * 10_000_000));
toI128(amount);
```

---

## SDK (Coming Soon)

A publishable TypeScript SDK (`@paylinkr/sdk`) is planned that will wrap all of the above into a clean, documented package:

```typescript
import { PayLinkr } from "@paylinkr/sdk";

const client = new PayLinkr({ contractId, rpcUrl, networkPassphrase });

await client.createRequest({ creator, id, token, amount, description, expiry });
await client.pay({ payer, id });
const status = await client.isPaid(id);
```

Track progress in the GitHub issues.
