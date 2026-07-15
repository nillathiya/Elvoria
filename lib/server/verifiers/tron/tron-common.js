// ============================================================
//  Shared TRON primitives (spec §13).
//
//  TRON is not EVM-shaped: transactions and their results live behind two
//  different endpoints, success is a string rather than a status bit, and
//  addresses come back hex-encoded.
// ============================================================

import { httpPostJson, httpGetJson, BlockchainUnavailableError } from "../rpc-client.js";
import { verified, pendingConfirmations, rejected } from "../result.js";
import { REASONS } from "../../utils/errors.js";
import { hexToBigInt, formatUnits, parseUnits } from "../../utils/amount.js";
import { tronHexToBase58 } from "../../utils/base58.js";

const TRANSFER_TOPIC = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function headers(network) {
  return network.apiKey ? { "TRON-PRO-API-KEY": network.apiKey } : {};
}

function addressFromTopic(topic) {
  // Indexed addresses are left-padded to 32 bytes; take the low 20.
  return tronHexToBase58(String(topic).slice(-40));
}

async function currentBlock(network) {
  const block = await httpGetJson(`${network.rpcUrl}/wallet/getnowblock`, { headers: headers(network) });
  const number = block?.block_header?.raw_data?.number;

  if (typeof number !== "number") {
    throw new BlockchainUnavailableError("TRON node returned no block height");
  }
  return number;
}

async function fetchTx(network, txHash) {
  const opts = { headers: headers(network) };
  const [tx, info] = await Promise.all([
    httpPostJson(`${network.rpcUrl}/wallet/gettransactionbyid`, { value: txHash }, opts),
    httpPostJson(`${network.rpcUrl}/wallet/gettransactioninfobyid`, { value: txHash }, opts),
  ]);

  // TronGrid answers an unknown hash with {} rather than a 404.
  const exists = tx && Object.keys(tx).length > 0;
  return { tx: exists ? tx : null, info: info && Object.keys(info).length ? info : null };
}

async function precheck(network, txHash) {
  const { tx, info } = await fetchTx(network, txHash);

  if (!tx) return { result: rejected(REASONS.TX_NOT_FOUND) };

  // Unconfirmed transactions have no info record yet.
  if (!info || typeof info.blockNumber !== "number") {
    return { result: pendingConfirmations({ confirmations: 0, blockNumber: null }) };
  }

  // contractRet is the contract-level outcome; anything but SUCCESS means the
  // transfer did not happen even though the transaction is on-chain.
  const ret = tx.ret?.[0]?.contractRet;
  if (ret && ret !== "SUCCESS") {
    return { result: rejected(REASONS.TRANSACTION_FAILED, { blockNumber: info.blockNumber, note: ret }) };
  }

  // For TRC-20, the energy receipt carries its own result.
  if (info.receipt?.result && info.receipt.result !== "SUCCESS") {
    return {
      result: rejected(REASONS.TRANSACTION_FAILED, { blockNumber: info.blockNumber, note: info.receipt.result }),
    };
  }

  return { tx, info };
}

function finish({ network, method, data, blockNumber, amountRaw, tip }) {
  if (amountRaw === 0n) {
    return rejected(REASONS.INVALID_TRANSFER, { ...data, note: "Zero-value transfer" });
  }

  if (method.minAmount) {
    const min = parseUnits(method.minAmount, method.decimals ?? 6);
    if (amountRaw < min) {
      return rejected(REASONS.INVALID_TRANSFER, { ...data, note: `Below the ${method.minAmount} minimum` });
    }
  }

  const confirmations = tip < blockNumber ? 0 : tip - blockNumber + 1;
  if (confirmations < method.requiredConfirmations) {
    return pendingConfirmations({ ...data, confirmations });
  }

  return verified({ ...data, confirmations });
}

// ---- native TRX --------------------------------------------

export async function verifyTronNative({ network, method, txHash, addresses }) {
  const pre = await precheck(network, txHash);
  if (pre.result) return pre.result;

  const { tx, info } = pre;

  const contract = tx.raw_data?.contract?.[0];
  const value = contract?.parameter?.value;

  // A TRC-20 transfer is a TriggerSmartContract, not a TransferContract — the
  // native verifier must not accept one (spec §26.17).
  if (contract?.type !== "TransferContract" || !value) {
    return rejected(REASONS.INVALID_TRANSFER, {
      blockNumber: info.blockNumber,
      note: `Not a native TRX transfer (${contract?.type || "unknown"})`,
    });
  }

  const recipient = tronHexToBase58(value.to_address);
  const amountRaw = BigInt(value.amount ?? 0);

  const data = {
    network: network.id,
    asset: method.symbol,
    tokenContract: null,
    sender: tronHexToBase58(value.owner_address),
    recipient,
    amountRaw: amountRaw.toString(),
    amount: formatUnits(amountRaw, method.decimals ?? 6), // TRX is 6 decimals (sun)
    blockNumber: info.blockNumber,
  };

  if (!addresses.includes(recipient)) return rejected(REASONS.WRONG_RECIPIENT, data);

  const tip = await currentBlock(network);
  return finish({ network, method, data, blockNumber: info.blockNumber, amountRaw, tip });
}

// ---- TRC-20 tokens -----------------------------------------

export async function verifyTronToken({ network, method, txHash, addresses }) {
  const pre = await precheck(network, txHash);
  if (pre.result) return pre.result;

  const { info } = pre;

  const contract = method.contractAddress; // stored base58, validated on save
  const base = {
    network: network.id,
    asset: method.symbol,
    tokenContract: contract,
    blockNumber: info.blockNumber,
  };

  // Same reasoning as EVM (§16): the transaction is aimed at the token
  // contract, so only the Transfer event names the wallet actually paid.
  const logs = (info.log || []).filter(
    (log) => log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC && log.topics.length >= 3
  );

  if (!logs.length) return rejected(REASONS.INVALID_TRANSFER, base);

  // log.address is hex without the 41 prefix.
  const fromContract = logs.filter((log) => {
    try {
      return tronHexToBase58(log.address) === contract;
    } catch {
      return false;
    }
  });

  if (!fromContract.length) return rejected(REASONS.WRONG_TOKEN_CONTRACT, base);

  const match = fromContract.find((log) => addresses.includes(addressFromTopic(log.topics[2])));

  if (!match) {
    const first = fromContract[0];
    return rejected(REASONS.WRONG_RECIPIENT, {
      ...base,
      sender: addressFromTopic(first.topics[1]),
      recipient: addressFromTopic(first.topics[2]),
    });
  }

  const amountRaw = hexToBigInt(`0x${match.data}`);
  const data = {
    ...base,
    sender: addressFromTopic(match.topics[1]),
    recipient: addressFromTopic(match.topics[2]),
    amountRaw: amountRaw.toString(),
    amount: formatUnits(amountRaw, method.decimals),
  };

  const tip = await currentBlock(network);
  return finish({ network, method, data, blockNumber: info.blockNumber, amountRaw, tip });
}
