// ============================================================
//  A fake EVM node, installed over global fetch.
//
//  The verifier's real code path runs against this — JSON-RPC shape, receipt
//  status, log filtering, topic decoding and confirmation maths are all
//  exercised. Only the network is faked.
// ============================================================

export const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export const pad32 = (hex) => "0x" + hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");
export const toHex = (n) => "0x" + BigInt(n).toString(16);

// An indexed address topic: 12 zero bytes then the 20 address bytes.
export const addressTopic = (address) => pad32(address.replace(/^0x/, ""));

export function transferLog({ contract, from, to, amount }) {
  return {
    address: contract,
    topics: [TRANSFER_TOPIC, addressTopic(from), addressTopic(to)],
    data: pad32(BigInt(amount).toString(16)),
  };
}

export function makeChain({ tip = 100, transactions = {} } = {}) {
  return { tip, transactions };
}

// Installs the mock and returns a restore function.
export function installFakeChain(chain) {
  const realFetch = globalThis.fetch;

  globalThis.fetch = async (url, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : {};
    const { method, params = [] } = body;

    const respond = (result) => ({
      ok: true,
      status: 200,
      json: async () => ({ jsonrpc: "2.0", id: 1, result }),
    });

    if (method === "eth_blockNumber") return respond(toHex(chain.tip));

    if (method === "eth_getTransactionByHash") {
      const entry = chain.transactions[String(params[0]).toLowerCase()];
      return respond(entry?.tx ?? null);
    }

    if (method === "eth_getTransactionReceipt") {
      const entry = chain.transactions[String(params[0]).toLowerCase()];
      return respond(entry?.receipt ?? null);
    }

    if (method) return respond(null);

    // Anything non-JSON-RPC reaching here is a test bug, not a network call.
    throw new Error(`fake-chain: unexpected request to ${url}`);
  };

  return () => {
    globalThis.fetch = realFetch;
  };
}

// Simulates the node being down, to prove an outage is not treated as a
// rejection (spec §17 BLOCKCHAIN_API_UNAVAILABLE).
export function installDeadChain() {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("ECONNREFUSED");
  };
  return () => {
    globalThis.fetch = realFetch;
  };
}
