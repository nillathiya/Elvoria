// ============================================================
//  Deposit addresses — shared store (frontend-only, localStorage)
//  Admin sets receiving addresses here; the public /pa/deposit page
//  reads them to show the address + QR when a currency is clicked.
// ============================================================

// Crypto channels the admin can set a receiving address for.
// `id` matches the paymentChannels ids used on the Deposit page.
export const CRYPTO_CHANNELS = [
  { id: "btc", name: "Bitcoin (BTC)", network: "Bitcoin", kind: "btc" },
  { id: "eth", name: "Ethereum (ETH)", network: "ERC20", kind: "eth" },
  { id: "bnb", name: "BNB (BNB)", network: "BEP20", kind: "bnb" },
  { id: "trx", name: "TRON (TRX)", network: "TRC20", kind: "trx" },
  { id: "usdttrc", name: "Tether (USDT TRC20)", network: "TRC20", kind: "usdt" },
  { id: "usdterc", name: "Tether (USDT ERC20)", network: "ERC20", kind: "usdt" },
  { id: "usdtbep", name: "Tether (USDT BEP20)", network: "BEP20", kind: "usdt" },
  { id: "usdcerc", name: "USD Coin (USDC ERC20)", network: "ERC20", kind: "usdc" },
  { id: "usdcbep", name: "USD Coin (USDC BEP20)", network: "BEP20", kind: "usdc" },
];

const STORE_KEY = "elvoria-deposit-addresses";
const LEGACY_STORE_KEY = "dash-deposit-addresses"; // pre-rebrand key, read once as a fallback
export const ADDRESSES_EVENT = "deposit-addresses-changed";

export const DEFAULT_ADDRESSES = {
  btc: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
  eth: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
  bnb: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
  trx: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  usdttrc: "TXFwSptqBGXvKcVwKNW1LMd8b3bLmZ4kQr",
  usdterc: "0x55d398326f99059ff775485246999027b3197955",
  usdtbep: "0x55d398326f99059ff775485246999027b3197955",
  usdcerc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  usdcbep: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
};

export function getDepositAddresses() {
  if (typeof window === "undefined") return { ...DEFAULT_ADDRESSES };
  try {
    const raw =
      window.localStorage.getItem(STORE_KEY) || window.localStorage.getItem(LEGACY_STORE_KEY);
    return { ...DEFAULT_ADDRESSES, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULT_ADDRESSES };
  }
}

export function setDepositAddress(id, address) {
  try {
    const next = { ...getDepositAddresses(), [id]: address };
    window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(ADDRESSES_EVENT));
    return next;
  } catch {
    return getDepositAddresses();
  }
}
