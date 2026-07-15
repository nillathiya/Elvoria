// ============================================================
//  Blockchain RPC/HTTP client.
//
//  Read-only: these calls fetch public chain data and never sign anything.
//  No private key is used or required (spec §26.22).
// ============================================================

import { RPC_TIMEOUT_MS } from "../config/blockchain-config.js";
import { AppError, REASONS } from "../utils/errors.js";

// A node that hangs must not hang the peer's request forever (spec §21).
// Distinguishing "the chain says no" from "we could not ask the chain" matters:
// the first is a rejection, the second is a retryable outage, and treating an
// outage as a rejection would let a real deposit be refused.
export class BlockchainUnavailableError extends AppError {
  constructor(message) {
    super(message, { status: 503, code: REASONS.BLOCKCHAIN_API_UNAVAILABLE });
    this.name = "BlockchainUnavailableError";
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = RPC_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new BlockchainUnavailableError(`Blockchain node did not respond within ${timeoutMs}ms`);
    }
    throw new BlockchainUnavailableError(`Could not reach the blockchain node: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }
}

export async function jsonRpc(url, method, params = [], { timeoutMs } = {}) {
  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    },
    timeoutMs
  );

  if (!res.ok) {
    throw new BlockchainUnavailableError(`Blockchain node returned HTTP ${res.status}`);
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new BlockchainUnavailableError("Blockchain node returned a malformed response");
  }

  if (body.error) {
    throw new BlockchainUnavailableError(`Blockchain node error: ${body.error.message || "unknown"}`);
  }

  // null is a legitimate answer here ("no such transaction"), so it is returned
  // rather than treated as a failure. Callers decide what a null means.
  return body.result;
}

export async function httpGetJson(url, { timeoutMs, headers } = {}) {
  const res = await fetchWithTimeout(url, { headers }, timeoutMs);

  // 404 means the explorer has no such object — a real answer, not an outage.
  if (res.status === 404) return null;

  if (!res.ok) {
    throw new BlockchainUnavailableError(`Blockchain API returned HTTP ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    throw new BlockchainUnavailableError("Blockchain API returned a malformed response");
  }
}

export async function httpPostJson(url, body, { timeoutMs, headers } = {}) {
  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    },
    timeoutMs
  );

  if (!res.ok) {
    throw new BlockchainUnavailableError(`Blockchain API returned HTTP ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    throw new BlockchainUnavailableError("Blockchain API returned a malformed response");
  }
}
