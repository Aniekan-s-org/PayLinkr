# Deployment Guide

This guide covers deploying the PayLinkr smart contract to Stellar Testnet and Mainnet, and deploying the frontend.

---

## Prerequisites

Make sure you have the following installed:

```bash
# Rust + WASM target
curl https://sh.rustup.rs -sSf | sh
rustup target add wasm32-unknown-unknown

# Stellar CLI
cargo install --locked stellar-cli

# Verify
stellar --version
```

---

## Part 1: Deploy the Smart Contract

### Step 1: Build the WASM Binary

```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
```

The compiled binary will be at:
```
contract/target/wasm32-unknown-unknown/release/paylinkr.wasm
```

### Step 2: Set Up a Stellar Account

You need a funded Stellar account to deploy. For testnet, you can generate and fund one with the CLI:

```bash
# Generate a new keypair
stellar keys generate --global deployer --network testnet

# Fund it via Friendbot (testnet only)
stellar keys fund deployer --network testnet

# Check the address
stellar keys address deployer
```

For mainnet, use an existing funded account and never share the secret key.

### Step 3: Deploy to Testnet

```bash
stellar contract deploy \
  --wasm contract/target/wasm32-unknown-unknown/release/paylinkr.wasm \
  --source deployer \
  --network testnet
```

The CLI will return a contract ID that looks like:

```
CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Save this — you will need it for the frontend.

### Step 4: Deploy to Mainnet

```bash
stellar contract deploy \
  --wasm contract/target/wasm32-unknown-unknown/release/paylinkr.wasm \
  --source YOUR_MAINNET_KEY_NAME \
  --network mainnet
```

> ⚠️ Mainnet deployments cost real XLM. Ensure your account has sufficient balance for the contract deployment and ledger rent.

### Step 5: Verify the Deployment

Test that the contract is live by calling a read function:

```bash
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- is_paid \
  --id abc123
```

Expected output: `false` (the request doesn't exist yet, so it returns false).

---

## Part 2: Deploy the Frontend

### Option A: Local / Development

```bash
cd frontend/paylinkr-ui
cp .env.example .env
```

Edit `.env`:
```env
VITE_CONTRACT_ID=YOUR_DEPLOYED_CONTRACT_ID
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
```

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Option B: Production Build

```bash
cd frontend/paylinkr-ui
npm run build
```

The output is in `frontend/paylinkr-ui/dist/`. Deploy this folder to any static host.

### Option C: Vercel

```bash
npm install -g vercel
cd frontend/paylinkr-ui
vercel
```

Set environment variables in the Vercel dashboard:
- `VITE_CONTRACT_ID`
- `VITE_RPC_URL`
- `VITE_NETWORK_PASSPHRASE`

### Option D: Netlify

```bash
npm install -g netlify-cli
cd frontend/paylinkr-ui
netlify deploy --prod --dir=dist
```

Set environment variables in the Netlify dashboard under Site Settings → Environment Variables.

---

## Network Configuration

| Network | RPC URL | Passphrase |
|---|---|---|
| Testnet | `https://soroban-testnet.stellar.org` | `Test SDF Network ; September 2015` |
| Mainnet | `https://mainnet.sorobanrpc.com` | `Public Global Stellar Network ; September 2015` |
| Futurenet | `https://rpc-futurenet.stellar.org` | `Test SDF Future Network ; October 2022` |

---

## Upgrading the Contract

Soroban contracts support WASM upgrades. To upgrade:

```bash
# Build the new version
cargo build --target wasm32-unknown-unknown --release

# Upload the new WASM (get the hash)
stellar contract upload \
  --wasm contract/target/wasm32-unknown-unknown/release/paylinkr.wasm \
  --source deployer \
  --network testnet

# Upgrade the existing contract
stellar contract invoke \
  --id YOUR_CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- upgrade \
  --new_wasm_hash NEW_WASM_HASH
```

> Note: The current PayLinkr contract does not include an `upgrade` function. This is a planned addition. For now, breaking changes require a new deployment.

---

## Ledger Rent

Soroban uses a rent model for persistent storage. Payment requests stored on-chain will be evicted if their TTL (time-to-live) expires and rent is not extended.

- The contract currently does not auto-extend TTL on reads
- For production use, consider adding TTL extension logic in `get_request` and `pay`
- Monitor your contract's storage entries via the Stellar Laboratory or a block explorer

---

## Troubleshooting

**`Error: account not found`**
Your deployer account is not funded. Run `stellar keys fund deployer --network testnet`.

**`Error: insufficient balance`**
The account does not have enough XLM to cover the deployment fee and ledger rent.

**`Error: contract already exists`**
You are trying to deploy to an address that already has a contract. Use a new keypair or use the upgrade path.

**Frontend shows blank page after deploy**
Check that `VITE_CONTRACT_ID` is set correctly in your environment variables. The `VITE_` prefix is required for Vite to expose the variable to the browser.
