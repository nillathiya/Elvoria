// ============================================================
//  Receiving-address normalization + comparison, per network family.
//
//  Address comparison decides whether a deposit is credited, so it must be
//  exact. Never compare raw user/chain strings directly — case and encoding
//  differ between sources for the same address.
// ============================================================

import { ValidationError } from "./errors.js";
import { familyForNetwork } from "./hash-normalizer.js";

const EVM_ADDRESS = /^0x[0-9a-f]{40}$/;
const TRON_ADDRESS = /^T[1-9A-HJ-NP-Za-km-z]{33}$/; // base58check, case-sensitive
const BTC_ADDRESS = /^(bc1[023456789acdefghjklmnpqrstuvwxyz]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,39})$/;

export function normalizeAddress(rawAddress, network) {
  const family = familyForNetwork(network);
  if (!family) throw new ValidationError(`Unsupported network: ${network}`);

  const trimmed = String(rawAddress ?? "").trim();
  if (!trimmed) throw new ValidationError("Address is required");

  if (family === "evm") {
    // EVM addresses are case-insensitive (mixed case is only an EIP-55
    // checksum), so lowercase is the safe canonical form to compare on.
    const lower = trimmed.toLowerCase();
    if (!EVM_ADDRESS.test(lower)) throw new ValidationError("Invalid EVM address");
    return lower;
  }

  if (family === "tron") {
    // Base58 IS case-sensitive — lowercasing a Tron address corrupts it.
    if (!TRON_ADDRESS.test(trimmed)) throw new ValidationError("Invalid TRON address");
    return trimmed;
  }

  // Bitcoin: bech32 is lowercase by convention; base58 legacy is case-sensitive.
  const candidate = trimmed.toLowerCase().startsWith("bc1") ? trimmed.toLowerCase() : trimmed;
  if (!BTC_ADDRESS.test(candidate)) throw new ValidationError("Invalid Bitcoin address");
  return candidate;
}

export function isValidAddress(rawAddress, network) {
  try {
    normalizeAddress(rawAddress, network);
    return true;
  } catch {
    return false;
  }
}

export function addressesEqual(a, b, network) {
  try {
    return normalizeAddress(a, network) === normalizeAddress(b, network);
  } catch {
    return false;
  }
}
