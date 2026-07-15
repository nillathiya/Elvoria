// ============================================================
//  Shared EVM primitives for the BSC and Ethereum verifiers.
//
//  Each network keeps its own verifier module (spec §26.17); this holds the
//  parts of the EVM transaction model that are genuinely identical between
//  them, so a fix to the log-parsing rules cannot land on one chain and be
//  forgotten on the other.
// ============================================================

import { jsonRpc } from "../rpc-client.js";
import { verified, pendingConfirmations, rejected } from "../result.js";
import { REASONS } from "../../utils/errors.js";
import { hexToBigInt, hexToNumber, formatUnits, parseUnits } from "../../utils/amount.js";
import { normalizeAddress } from "../../utils/address-normalizer.js";

// keccak256("Transfer(address,address,uint256)") — the topic every ERC-20
// Transfer log is indexed by.
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

// An indexed address is right-padded into a 32-byte topic; the address is the
// low 20 bytes.
function addressFromTopic(topic) {
  return `0x${String(topic).slice(-40)}`.toLowerCase();
}

async function fetchTx(rpcUrl, txHash) {
  const [tx, receipt] = await Promise.all([
    jsonRpc(rpcUrl, "eth_getTransactionByHash", [txHash]),
    jsonRpc(rpcUrl, "eth_getTransactionReceipt", [txHash]),
  ]);
  return { tx, receipt };
}

async function confirmationsFor(rpcUrl, blockNumberHex) {
  const tipHex = await jsonRpc(rpcUrl, "eth_blockNumber", []);
  const tip = hexToBigInt(tipHex);
  const block = hexToBigInt(blockNumberHex);

  // The including block counts as the first confirmation.
  if (tip < block) return 0;
  return Number(tip - block) + 1;
}

// Shared preamble: the transaction must exist, be mined, and have succeeded.
// Returns a rejection result, or null to continue.
async function precheck(rpcUrl, txHash) {
  const { tx, receipt } = await fetchTx(rpcUrl, txHash);

  // Spec §14: the hash must exist on the chain the method names. A hash that
  // is real on another chain is still TX_NOT_FOUND here — which is exactly how
  // a wrong-network submission surfaces.
  if (!tx) return { result: rejected(REASONS.TX_NOT_FOUND) };

  // Present but unmined: no receipt, so nothing is confirmed yet.
  if (!receipt || tx.blockNumber === null) {
    return { result: pendingConfirmations({ confirmations: 0, blockNumber: null }) };
  }

  // status 0x0 means the transaction reverted. It is on the chain and it cost
  // gas, but it moved no funds — accepting it would credit a failed transfer.
  if (receipt.status !== "0x1") {
    return { result: rejected(REASONS.TRANSACTION_FAILED, { blockNumber: hexToNumber(receipt.blockNumber) }) };
  }

  return { tx, receipt };
}

function checkConfirmations(confirmations, required, data) {
  if (confirmations < required) return pendingConfirmations({ ...data, confirmations });
  return verified({ ...data, confirmations });
}

function checkMinimum(method, amountRaw, data) {
  if (!method.minAmount) return null;

  const min = parseUnits(method.minAmount, method.decimals ?? 18);
  if (amountRaw < min) {
    return rejected(REASONS.INVALID_TRANSFER, { ...data, note: `Below the ${method.minAmount} minimum` });
  }
  return null;
}

// ---- native coin (BNB, ETH) --------------------------------

export async function verifyEvmNative({ network, method, txHash, addresses }) {
  const pre = await precheck(network.rpcUrl, txHash);
  if (pre.result) return pre.result;

  const { tx, receipt } = pre;

  const recipient = tx.to ? normalizeAddress(tx.to, network.id) : null;
  const sender = normalizeAddress(tx.from, network.id);
  const amountRaw = hexToBigInt(tx.value);
  const blockNumber = hexToNumber(receipt.blockNumber);

  const data = {
    network: network.id,
    asset: method.symbol,
    tokenContract: null,
    sender,
    recipient,
    amountRaw: amountRaw.toString(),
    amount: formatUnits(amountRaw, method.decimals ?? 18),
    blockNumber,
  };

  // Spec §15: the recipient must be an address the admin configured for THIS
  // method. Anything else — including a valid address belonging to a different
  // method — is rejected.
  if (!recipient || !addresses.includes(recipient)) {
    return rejected(REASONS.WRONG_RECIPIENT, data);
  }

  // A native verifier must not accept a token transfer. Those carry zero value
  // and move funds through a contract call, so value > 0 is what separates a
  // real coin transfer from a contract interaction that happens to be aimed at
  // our address.
  if (amountRaw === 0n) {
    return rejected(REASONS.INVALID_TRANSFER, { ...data, note: "No native value transferred" });
  }

  const belowMin = checkMinimum(method, amountRaw, data);
  if (belowMin) return belowMin;

  const confirmations = await confirmationsFor(network.rpcUrl, receipt.blockNumber);
  return checkConfirmations(confirmations, method.requiredConfirmations, data);
}

// ---- ERC-20 / BEP-20 token ---------------------------------

export async function verifyEvmToken({ network, method, txHash, addresses }) {
  const pre = await precheck(network.rpcUrl, txHash);
  if (pre.result) return pre.result;

  const { receipt } = pre;

  const contract = normalizeAddress(method.contractAddress, network.id);
  const blockNumber = hexToNumber(receipt.blockNumber);
  const base = { network: network.id, asset: method.symbol, tokenContract: contract, blockNumber };

  // Spec §16: this is the critical part. The transaction's top-level `to` is
  // the TOKEN CONTRACT, not the wallet being paid — checking it would either
  // reject every real token deposit or, worse, accept a transfer to someone
  // else that merely went through the right contract. The truth is in the
  // Transfer event the contract emitted.
  const transfers = (receipt.logs || []).filter(
    (log) =>
      log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC &&
      log.address?.toLowerCase() === contract &&
      log.topics.length >= 3
  );

  if (!transfers.length) {
    // Either it emitted no Transfer at all, or every Transfer came from a
    // different contract — i.e. the wrong token (§14, §15).
    const otherContract = (receipt.logs || []).some(
      (log) => log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC
    );
    return rejected(otherContract ? REASONS.WRONG_TOKEN_CONTRACT : REASONS.INVALID_TRANSFER, base);
  }

  // One transaction can emit many Transfers (batches, routers, fee splits).
  // Credit only a leg that actually paid one of our addresses.
  const match = transfers.find((log) => addresses.includes(addressFromTopic(log.topics[2])));

  if (!match) {
    const first = transfers[0];
    return rejected(REASONS.WRONG_RECIPIENT, {
      ...base,
      sender: addressFromTopic(first.topics[1]),
      recipient: addressFromTopic(first.topics[2]),
    });
  }

  const amountRaw = hexToBigInt(match.data);
  const data = {
    ...base,
    sender: addressFromTopic(match.topics[1]),
    recipient: addressFromTopic(match.topics[2]),
    amountRaw: amountRaw.toString(),
    amount: formatUnits(amountRaw, method.decimals),
  };

  if (amountRaw === 0n) {
    return rejected(REASONS.INVALID_TRANSFER, { ...data, note: "Zero-value transfer" });
  }

  const belowMin = checkMinimum(method, amountRaw, data);
  if (belowMin) return belowMin;

  const confirmations = await confirmationsFor(network.rpcUrl, receipt.blockNumber);
  return checkConfirmations(confirmations, method.requiredConfirmations, data);
}
