// ============================================================
//  Base58check — needed to compare TRON addresses.
//
//  TRON presents addresses as base58check ("T…") but returns them from the
//  API as hex ("41…"). Comparing the two forms directly would never match, so
//  a deposit would be rejected as WRONG_RECIPIENT even when it was correct.
//  Written by hand to keep the dependency list at zero.
// ============================================================

import { createHash } from "crypto";
import { ValidationError } from "./errors.js";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE = 58n;

// TRON mainnet addresses are 0x41 + 20 bytes.
const TRON_PREFIX = 0x41;

export function base58Encode(bytes) {
  let value = 0n;
  for (const byte of bytes) value = value * 256n + BigInt(byte);

  let out = "";
  while (value > 0n) {
    out = ALPHABET[Number(value % BASE)] + out;
    value /= BASE;
  }

  // Leading zero bytes carry no magnitude, so the BigInt loop drops them —
  // each must reappear as a literal "1" or the address is a byte short.
  for (const byte of bytes) {
    if (byte !== 0) break;
    out = "1" + out;
  }

  return out;
}

export function base58Decode(str) {
  let value = 0n;
  for (const char of str) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new ValidationError(`Invalid base58 character: ${char}`);
    value = value * BASE + BigInt(index);
  }

  const bytes = [];
  while (value > 0n) {
    bytes.unshift(Number(value % 256n));
    value /= 256n;
  }

  for (const char of str) {
    if (char !== "1") break;
    bytes.unshift(0);
  }

  return Uint8Array.from(bytes);
}

function checksum(payload) {
  const first = createHash("sha256").update(payload).digest();
  return createHash("sha256").update(first).digest().subarray(0, 4);
}

export function base58CheckEncode(payload) {
  const buf = Buffer.from(payload);
  return base58Encode(Buffer.concat([buf, checksum(buf)]));
}

export function base58CheckDecode(str) {
  const raw = Buffer.from(base58Decode(str));
  if (raw.length < 5) throw new ValidationError("Base58check string is too short");

  const payload = raw.subarray(0, raw.length - 4);
  const provided = raw.subarray(raw.length - 4);

  // The checksum is the whole point: without it a typo'd address decodes to
  // valid-looking bytes and funds go nowhere recoverable.
  if (!checksum(payload).equals(provided)) {
    throw new ValidationError("Base58check checksum mismatch");
  }

  return payload;
}

// "41ab…" (or a bare 40-char log address) -> "T…"
export function tronHexToBase58(hex) {
  let clean = String(hex).replace(/^0x/i, "").toLowerCase();

  // TRC-20 log topics carry the bare 20-byte address without the 41 prefix.
  if (clean.length === 40) clean = "41" + clean;

  if (clean.length !== 42 || !/^[0-9a-f]+$/.test(clean)) {
    throw new ValidationError(`Not a TRON hex address: ${hex}`);
  }

  return base58CheckEncode(Buffer.from(clean, "hex"));
}

// "T…" -> "41ab…"
export function tronBase58ToHex(address) {
  const payload = base58CheckDecode(String(address));

  if (payload.length !== 21 || payload[0] !== TRON_PREFIX) {
    throw new ValidationError(`Not a TRON address: ${address}`);
  }

  return payload.toString("hex");
}
