// ============================================================
//  Input validation (spec §21). Everything crossing the API boundary is
//  untrusted — validate here, never in a route handler.
// ============================================================

import { ValidationError } from "./errors.js";

const PIN_EXACT_6 = /^[0-9]{6}$/;
const PEER_CODE = /^[A-Z0-9_-]{3,32}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-zA-Z0-9_.-]{3,32}$/;

// Spec §3.1/§3.2: exactly 6, numbers only. Tested against 5-digit, 7-digit,
// and non-numeric input. String-typed throughout — Number(...) would accept
// "1e5", " 123456 ", and 0x-forms, and would strip a leading zero.
export function assertPin(pin, label = "PIN") {
  if (typeof pin !== "string" || !PIN_EXACT_6.test(pin)) {
    throw new ValidationError(`${label} must be exactly 6 digits, numbers only`);
  }
  return pin;
}

export function assertPeerCode(code) {
  const value = String(code ?? "").trim().toUpperCase();
  if (!PEER_CODE.test(value)) {
    throw new ValidationError("Peer ID must be 3-32 characters (A-Z, 0-9, _ or -)");
  }
  return value;
}

export function assertEmail(email) {
  const value = String(email ?? "").trim().toLowerCase();
  if (!EMAIL.test(value) || value.length > 254) {
    throw new ValidationError("A valid email address is required");
  }
  return value;
}

export function assertUsername(username) {
  const value = String(username ?? "").trim();
  if (!USERNAME.test(value)) {
    throw new ValidationError("Username must be 3-32 characters (letters, numbers, . _ -)");
  }
  return value;
}

export function assertPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }
  if (password.length > 200) {
    // scrypt cost scales with input; an unbounded password is a DoS vector.
    throw new ValidationError("Password must be at most 200 characters");
  }
  return password;
}

export function assertNonEmpty(value, label) {
  const out = String(value ?? "").trim();
  if (!out) throw new ValidationError(`${label} is required`);
  return out;
}

export function assertOneOf(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw new ValidationError(`${label} must be one of: ${allowed.join(", ")}`);
  }
  return value;
}
