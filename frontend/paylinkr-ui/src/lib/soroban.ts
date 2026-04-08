/**
 * soroban.ts
 * Thin wrapper around @stellar/stellar-sdk for PayLinkr contract calls.
 * Replace CONTRACT_ID and NETWORK_PASSPHRASE with your deployed values.
 */

import {
  Contract,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID ?? "";
export const RPC_URL =
  import.meta.env.VITE_RPC_URL ?? "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE =
  import.meta.env.VITE_NETWORK_PASSPHRASE ?? Networks.TESTNET;

export const server = new SorobanRpc.Server(RPC_URL);

/** Build + simulate + submit a contract call */
export async function invokeContract(
  method: string,
  args: xdr.ScVal[],
  sourceKeypair: { publicKey(): string; secret(): string }
) {
  const { Keypair } = await import("@stellar/stellar-sdk");
  const kp = Keypair.fromSecret(sourceKeypair.secret());
  const account = await server.getAccount(kp.publicKey());

  const contract = new Contract(CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(simResult.error);
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(kp);

  const sendResult = await server.sendTransaction(preparedTx);
  if (sendResult.status === "ERROR") {
    throw new Error(JSON.stringify(sendResult.errorResult));
  }

  // poll for confirmation
  let getResult = await server.getTransaction(sendResult.hash);
  while (getResult.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await server.getTransaction(sendResult.hash);
  }

  if (getResult.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
    throw new Error("Transaction failed");
  }

  return getResult;
}

/** Read-only simulation (no signing needed) */
export async function simulateContract(
  method: string,
  args: xdr.ScVal[],
  sourcePublicKey: string
) {
  const account = await server.getAccount(sourcePublicKey);
  const contract = new Contract(CONTRACT_ID);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(simResult.error);
  }

  const returnVal = (simResult as SorobanRpc.Api.SimulateTransactionSuccessResult)
    .result?.retval;
  return returnVal ? scValToNative(returnVal) : null;
}

/** Helpers to encode args */
export const toSymbol = (env: unknown, s: string) =>
  nativeToScVal(s, { type: "symbol" });

export const toAddress = (addr: string) =>
  nativeToScVal(addr, { type: "address" });

export const toI128 = (n: bigint) => nativeToScVal(n, { type: "i128" });

export const toU64 = (n: bigint) => nativeToScVal(n, { type: "u64" });

export const toString = (s: string) => nativeToScVal(s, { type: "string" });
