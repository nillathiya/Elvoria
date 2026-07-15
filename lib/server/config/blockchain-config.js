// ============================================================
//  Blockchain config (spec §21 — RPC URLs and API keys from the environment,
//  never hardcoded).
//
//  No private keys appear here or anywhere else: verification only ever reads
//  public chain data (spec §26.22).
// ============================================================

export const NETWORKS = {
  BSC: {
    id: "BSC",
    name: "BNB Smart Chain",
    family: "evm",
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
  },
  ETH: {
    id: "ETH",
    name: "Ethereum",
    family: "evm",
    chainId: 1,
    rpcUrl: process.env.ETH_RPC_URL || "https://ethereum-rpc.publicnode.com",
  },
  TRON: {
    id: "TRON",
    name: "TRON",
    family: "tron",
    rpcUrl: process.env.TRON_API_URL || "https://api.trongrid.io",
    apiKey: process.env.TRON_API_KEY || null,
  },
  BTC: {
    id: "BTC",
    name: "Bitcoin",
    family: "bitcoin",
    rpcUrl: process.env.BTC_API_URL || "https://blockstream.info/api",
  },
};

// Spec §13/§26.17: one independent verifier per network+asset type. A method
// must name one of these — a generic "trust the frontend" verifier does not
// exist by design.
export const VERIFIERS = {
  "bsc-native-verifier": { network: "BSC", assetType: "native" },
  "bsc-token-verifier": { network: "BSC", assetType: "token" },
  "eth-native-verifier": { network: "ETH", assetType: "native" },
  "eth-token-verifier": { network: "ETH", assetType: "token" },
  "tron-native-verifier": { network: "TRON", assetType: "native" },
  "tron-token-verifier": { network: "TRON", assetType: "token" },
  "btc-verifier": { network: "BTC", assetType: "native" },
};

export const ASSET_TYPES = ["native", "token"];

// Spec §21: RPC calls must not hang a request forever.
export const RPC_TIMEOUT_MS = Number(process.env.RPC_TIMEOUT_MS || 10_000);

export function networkFor(id) {
  return NETWORKS[String(id || "").toUpperCase()] || null;
}

export function verifierFor(id) {
  return VERIFIERS[id] || null;
}
