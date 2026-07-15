// ============================================================
//  TX hash normalization + format validation, per network family.
//
//  Normalization must happen before the duplicate check, or the same
//  transaction submitted as "0xABC..." and "0xabc..." would look like two
//  different hashes and could be claimed twice.
// ============================================================

import { ValidationError } from "./errors.js";

const HEX64 = /^[0-9a-f]{64}$/;

export const NETWORK_FAMILY = {
  BSC: "evm",
  ETH: "evm",
  ETHEREUM: "evm",
  TRON: "tron",
  BTC: "bitcoin",
  BITCOIN: "bitcoin",
};

export function familyForNetwork(network) {
  return NETWORK_FAMILY[String(network || "").toUpperCase()] || null;
}

// Canonical form used as the global registry key. Networks render the same
// 32-byte hash differently (EVM prefixes 0x, Tron and Bitcoin do not), so the
// key is namespaced by network to keep them from colliding.
export function normalizeTxHash(rawHash, network) {
  const family = familyForNetwork(network);
  if (!family) throw new ValidationError(`Unsupported network: ${network}`);

  const trimmed = String(rawHash ?? "").trim().toLowerCase();
  if (!trimmed) throw new ValidationError("TX hash is required");

  const bare = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (!HEX64.test(bare)) {
    throw new ValidationError("TX hash must be 64 hexadecimal characters");
  }

  // The form each chain's RPC expects.
  const canonical = family === "evm" ? `0x${bare}` : bare;
  return { canonical, bare, family, registryKey: `${String(network).toUpperCase()}:${bare}` };
}

export function isValidTxHashFormat(rawHash, network) {
  try {
    normalizeTxHash(rawHash, network);
    return true;
  } catch {
    return false;
  }
}
