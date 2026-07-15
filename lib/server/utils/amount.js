// ============================================================
//  Crypto amount handling (spec §18, §26.14).
//
//  Raw chain values are integers of arbitrary size — an 18-decimal token
//  balance overflows IEEE-754 long before it overflows uint256. Everything
//  here is BigInt in and string out; a Number never touches a value.
// ============================================================

import { ValidationError } from "./errors.js";

export function hexToBigInt(hex) {
  if (typeof hex !== "string" || !/^0x[0-9a-fA-F]*$/.test(hex)) {
    throw new ValidationError(`Not a hex quantity: ${hex}`);
  }
  return hex === "0x" ? 0n : BigInt(hex);
}

export function hexToNumber(hex) {
  const value = hexToBigInt(hex);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new ValidationError("Value too large for a safe integer");
  }
  return Number(value);
}

// Raw units -> human string. "1500000000000000000" @ 18 -> "1.5"
export function formatUnits(raw, decimals) {
  const value = typeof raw === "bigint" ? raw : BigInt(String(raw));
  const d = Number(decimals);

  if (!Number.isInteger(d) || d < 0 || d > 36) {
    throw new ValidationError(`Invalid decimals: ${decimals}`);
  }
  if (d === 0) return value.toString();

  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(d);

  const whole = abs / base;
  const fraction = abs % base;

  // Pad to the full width first, then trim: 5n @ 18 is 0.000…005, and
  // stringifying the remainder alone would render it as "5".
  const fractionStr = fraction.toString().padStart(d, "0").replace(/0+$/, "");

  return `${negative ? "-" : ""}${whole}${fractionStr ? `.${fractionStr}` : ""}`;
}

// Human string -> raw units, for comparing a configured minimum against a
// chain value without either side becoming a float.
export function parseUnits(value, decimals) {
  const str = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(str)) throw new ValidationError(`Invalid amount: ${value}`);

  const d = Number(decimals);
  const [whole, fraction = ""] = str.split(".");

  if (fraction.length > d) {
    throw new ValidationError(`Amount has more than ${d} decimal places`);
  }

  return BigInt(whole + fraction.padEnd(d, "0"));
}
