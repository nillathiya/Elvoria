// ============================================================
//  Bitcoin verifier (spec §13).
//
//  Bitcoin has no accounts and no transaction "status" — a transaction either
//  exists in a block or it does not, and value is carried by outputs. So the
//  question is not "did it succeed" but "which outputs paid us, and how deep
//  is the block".
// ============================================================

import { NETWORKS } from "../../config/blockchain-config.js";
import { httpGetJson, BlockchainUnavailableError } from "../rpc-client.js";
import { verified, pendingConfirmations, rejected } from "../result.js";
import { REASONS } from "../../utils/errors.js";
import { formatUnits, parseUnits } from "../../utils/amount.js";

export const id = "btc-verifier";

const SATOSHI_DECIMALS = 8;

export async function verify({ method, txHash, addresses }) {
  const network = NETWORKS.BTC;

  const tx = await httpGetJson(`${network.rpcUrl}/tx/${txHash}`);
  if (!tx) return rejected(REASONS.TX_NOT_FOUND);

  const base = { network: network.id, asset: method.symbol, tokenContract: null };

  // In the mempool but not mined: real, but zero confirmations.
  if (!tx.status?.confirmed) {
    return pendingConfirmations({ ...base, confirmations: 0, blockNumber: null });
  }

  const blockNumber = tx.status.block_height;

  // A transaction can pay several of our addresses in one go; sum every output
  // that landed on one of them rather than crediting only the first.
  const ours = (tx.vout || []).filter((out) => addresses.includes(out.scriptpubkey_address));

  if (!ours.length) {
    return rejected(REASONS.WRONG_RECIPIENT, {
      ...base,
      blockNumber,
      recipient: tx.vout?.[0]?.scriptpubkey_address ?? null,
    });
  }

  const amountRaw = ours.reduce((sum, out) => sum + BigInt(out.value), 0n);

  // Bitcoin inputs have no single "sender". The previous output's address is
  // the closest honest answer; it is recorded for the audit trail and is not
  // used to decide anything.
  const sender = tx.vin?.[0]?.prevout?.scriptpubkey_address ?? null;

  const data = {
    ...base,
    sender,
    recipient: ours[0].scriptpubkey_address,
    amountRaw: amountRaw.toString(),
    amount: formatUnits(amountRaw, SATOSHI_DECIMALS),
    blockNumber,
  };

  if (amountRaw === 0n) {
    return rejected(REASONS.INVALID_TRANSFER, { ...data, note: "Zero-value output" });
  }

  if (method.minAmount) {
    const min = parseUnits(method.minAmount, SATOSHI_DECIMALS);
    if (amountRaw < min) {
      return rejected(REASONS.INVALID_TRANSFER, { ...data, note: `Below the ${method.minAmount} minimum` });
    }
  }

  const tip = await httpGetJson(`${network.rpcUrl}/blocks/tip/height`);
  if (typeof tip !== "number") {
    throw new BlockchainUnavailableError("Bitcoin API returned no chain tip");
  }

  const confirmations = tip < blockNumber ? 0 : tip - blockNumber + 1;
  if (confirmations < method.requiredConfirmations) {
    return pendingConfirmations({ ...data, confirmations });
  }

  return verified({ ...data, confirmations });
}
