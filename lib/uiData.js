// ============================================================
//  UI DATA — placeholder and catalog data for the trading pages.
//
//  Nothing below is real. No account, balance, order, signal or news item here
//  is backed by anything; it exists so the trading pages have something to
//  render.
//
//  Real values live in lib/config.js and real records come from the API. Keep
//  this file away from anything that touches money: the deposit flow verifies
//  against the blockchain and must never read from here.
// ============================================================

import { formatMoney } from "./config";

// Re-exported so these pages can take their formatter from the same place
// as their data, while config.js stays the one definition.
export { formatMoney };

// Real name, email, client id and member-since come from the session on the
// pages that render this; the fields below are the fallbacks shown when the
// session has not supplied them. They must never carry a real-looking stranger's
// identity ("John Doe", a US phone number) — a signed-in user would see it as
// their own. Left blank / "Not provided" so nothing false is asserted.
export const user = {
  firstName: "",
  lastName: "",
  name: "",
  initials: "",
  email: "",
  clientId: "",
  phone: "Not provided",
  country: "Not provided",
  dob: "Not provided",
  memberSince: "—",
  tier: "",
  verified: false,
};

// The Elvoria Wallet — a single funding hub separate from trading accounts.
export const wallet = {
  id: "WALLET",
  balance: 0,
  currency: "USD",
};

export const balances = [
  { key: "total", label: "Total Balance", value: 0, change: 0, positive: true },
  { key: "equity", label: "Equity", value: 0, change: 0, positive: true },
  { key: "margin", label: "Free Margin", value: 0, change: 0, positive: true },
];

// mode: "Real" | "Practice" | "Archived"
export const accounts = [];

export const transactions = [];

// Payment methods with per-context availability + processing details.
export const paymentMethods = [
  { id: "card", name: "Bank Card", sub: "Visa / Mastercard", time: "Instant", fee: "Free", min: 10, category: "Cards" },
  { id: "wire", name: "Wire Transfer", sub: "Bank to bank", time: "1–3 days", fee: "Free", min: 100, category: "Bank" },
  { id: "bitcoin", name: "Bitcoin", sub: "Crypto (BTC)", time: "~30 min", fee: "Free", min: 20, category: "Crypto" },
  { id: "tether", name: "Tether", sub: "Crypto (USDT)", time: "~15 min", fee: "Free", min: 10, category: "Crypto" },
  { id: "skrill", name: "Skrill", sub: "e-Wallet", time: "Instant", fee: "1%", min: 10, category: "e-Wallet" },
  { id: "perfectmoney", name: "Perfect Money", sub: "e-Wallet", time: "Instant", fee: "0.5%", min: 10, category: "e-Wallet" },
  { id: "applepay", name: "Apple Pay", sub: "Mobile wallet", time: "Instant", fee: "Free", min: 10, category: "Cards" },
];

// A new account has verified nothing. This read 3/4 complete, telling someone
// who had just signed up that their identity was already checked.
export const verificationSteps = [
  { key: "email", label: "Email", status: "Pending" },
  { key: "phone", label: "Phone", status: "Pending" },
  { key: "identity", label: "Identity", status: "Pending" },
  { key: "address", label: "Address", status: "Pending" },
];

// countries lives in lib/config.js — it is a real list, not placeholder data.

export const currencies = ["USD", "EUR", "GBP"];

// ---- Account type catalog for the multi-step "Open New Account" flow ----
export const accountTypes = [
  { id: "Standard", name: "Standard", tagline: "Balanced conditions for everyday trading", spread: "From 0.6 pips", commission: "None", minDeposit: "$100", color: "#448AFF" },
  { id: "Pro", name: "Pro", tagline: "Instant execution with tighter spreads", spread: "From 0.1 pips", commission: "None", minDeposit: "$500", color: "#B388FF" },
  { id: "Raw Spread", name: "Raw Spread", tagline: "Near-zero spreads, low commission", spread: "From 0.3 pips", commission: "$3.5 / lot", minDeposit: "$200", color: "#00C853" },
  { id: "Zero", name: "Zero", tagline: "Zero spread on key instruments", spread: "0.3 pips", commission: "$0.05 / lot", minDeposit: "$200", color: "#FFDE02" },
];

// ---- Performance analytics (mocked) ----
export const analytics = {
  summary: [
    { key: "netpnl", label: "Net P&L", value: 0, change: 0, positive: true, money: true },
    { key: "winrate", label: "Win Rate", value: 0, change: 0, positive: true, suffix: "%" },
    { key: "trades", label: "Total Trades", value: 0, change: 0, positive: true },
    { key: "volume", label: "Volume Traded", value: 0, change: 0, positive: true, suffix: " lots" },
  ],
  equityCurve: [],
  monthlyPnl: [],
  instruments: [],
};

// ============================================================
//  Trading — closed orders (History of orders / order summary)
// ============================================================

// Closed positions for the Orders History table (Exness ordersHistory).
export const closedOrders = [];

// Aggregate stats for the Order Summary page (Exness orderSummary).
export const ordersSummary = {
  totals: [
    { key: "netpnl", label: "Total net profit", value: 0, money: true, positive: true },
    { key: "trades", label: "Total trades", value: 0 },
    { key: "winrate", label: "Win rate", value: 0, suffix: "%", positive: true },
    { key: "volume", label: "Traded volume", value: 0, suffix: " lots" },
  ],
  breakdown: {
    profitTrades: 0,
    lossTrades: 0,
    grossProfit: 0,
    grossLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    bestSymbol: "—",
  },
  operations: [
    { key: "deposits", label: "Deposits", value: 0, positive: true },
    { key: "withdrawals", label: "Withdrawals", value: 0 },
    { key: "credit", label: "Credit / bonus", value: 0, positive: true },
    { key: "commission", label: "Commission paid", value: 0 },
    { key: "swap", label: "Swap", value: 0 },
  ],
  direction: { buy: 0, sell: 0 },
};

// ============================================================
//  Insights — signals, news, economic calendar
// ============================================================

// Trading signals (Exness analystViews / Trading Central).
export const tradingSignals = [];

// FX / market news feed. Empty until a real news feed is wired in — showing
// fabricated headlines dated "18 min ago" on a live site is a lie about what
// the desk is publishing. The News page renders its empty state instead.
export const fxNews = [];

// Economic calendar events (Exness economic-calendar).
export const economicEvents = [];

// ============================================================
//  Exness benefits — trading conditions (swap-free), savings, VPS
// ============================================================

export const swapFreeInstruments = [];

export const savings = {
  apy: 4.5,
  currency: "USD",
  freeFunds: 0,
  accrued: 0,
  paidOut: 0,
  minBalance: 100,
  history: [],
};

export const vpsPlans = [
  { id: "free", name: "Free VPS", price: 0, priceLabel: "Free", latency: "< 4 ms", ram: "1 GB", cpu: "1 vCPU", storage: "20 GB SSD", eligible: "Deposit $500+ & trade 5 lots/mo", features: ["MetaTrader 4 & 5 ready", "99.9% uptime", "24/7 monitoring"], popular: false },
  { id: "standard", name: "Standard", price: 15, priceLabel: "$15/mo", latency: "< 4 ms", ram: "2 GB", cpu: "2 vCPU", storage: "40 GB SSD", eligible: "Available to all clients", features: ["MetaTrader 4 & 5 ready", "99.9% uptime", "Priority support", "1-click setup"], popular: true },
  { id: "premium", name: "Premium", price: 30, priceLabel: "$30/mo", latency: "< 2 ms", ram: "4 GB", cpu: "4 vCPU", storage: "80 GB SSD", eligible: "Available to all clients", features: ["MetaTrader 4 & 5 ready", "99.99% uptime", "Priority support", "Dedicated resources", "DDoS protection"], popular: false },
];

// ============================================================
//  Copy trading (Exness socialtrading)
// ============================================================

export const copyStrategies = [];

// ============================================================
//  Support hub (Exness support_hub/help_center)
// ============================================================

export const helpCategories = [
  { id: "account", title: "Account", desc: "Registration, verification & settings", icon: "user", articles: 42 },
  { id: "deposits", title: "Deposits & withdrawals", desc: "Funding methods, limits & processing", icon: "wallet", articles: 58 },
  { id: "trading", title: "Trading terminal", desc: "MT4, MT5 & the web terminal", icon: "chart", articles: 71 },
  { id: "platforms", title: "Trading conditions", desc: "Spreads, leverage, swaps & margin", icon: "sliders", articles: 33 },
  { id: "security", title: "Security", desc: "2FA, passwords & account safety", icon: "shield", articles: 26 },
  { id: "partnership", title: "Partnership", desc: "Referrals, commissions & payouts", icon: "users", articles: 19 },
];

export const helpFaqs = [
  // The two money answers below are kept true on purpose. Deposit is the one
  // real flow in this build, so an FAQ promising a 24-hour withdrawal SLA for
  // a feature that does not exist, next to a page that takes real crypto,
  // would be a promise nothing here can keep.
  { q: "How long do withdrawals take to process?", a: "Withdrawals are not available yet. This feature is being finalised and will be enabled soon." },
  { q: "Why is my account verification pending?", a: "Verification is pending while our team reviews your submitted documents. This normally takes a few minutes to a few hours. Make sure your proof of identity and proof of address are clear, valid and unexpired." },
  { q: "How do I reset my trading account password?", a: "Go to Trading → Accounts, select the account, and choose 'Change password'. You can set a new master or investor password. The change applies immediately across MT4/MT5 and the web terminal." },
  { q: "What is the minimum deposit?", a: "Deposits are made in cryptocurrency. Each method shows its own minimum and the number of network confirmations required on the Deposit page. Send only the named asset, on the named network, to the address shown for your deposit — crypto transfers cannot be reversed." },
  { q: "How does swap-free trading work?", a: "Swap-free (Islamic) accounts do not incur overnight swap charges on eligible instruments. Instead, a fixed administration fee may apply after a grace period on positions held long term." },
  { q: "Can I trade on multiple devices at once?", a: "Yes. Your account works across the desktop apps, mobile apps and the web terminal simultaneously. Your positions and balance stay synced in real time." },
];

// ============================================================
//  Profile & security (Exness settings/profile, settings/security)
// ============================================================

// name and email are overwritten from the session by the profile page. The rest
// are fields this system never collects, so they start unset rather than
// carrying a stranger's phone number and date of birth.
//
// Nothing is marked verified: no verification has happened.
export const profileFields = [
  { key: "name", label: "Full name", value: "", editable: false },
  { key: "email", label: "Email", value: "", verified: false },
  { key: "phone", label: "Phone", value: "Not provided", verified: false },
  { key: "dob", label: "Date of birth", value: "Not provided", editable: false },
  { key: "country", label: "Country of residence", value: "Not provided", editable: false },
  { key: "address", label: "Residential address", value: "Not provided", verified: false },
];

// Was four invented devices — an iPhone in New York, a Mac in Boston, an
// Android in London — shown to someone who had only ever signed in once. On a
// security page that is worse than useless: it is exactly where a person looks
// to check whether anyone else is in their account, and it would have told them
// yes.
//
// The server does not track sessions per device, so there is nothing honest to
// list here.
export const securitySessions = [];

// Reflects what the system can actually attest to, not a flattering full-marks
// list. It previously claimed 2FA and phone were confirmed for everyone, with a
// stranger's email and phone number as proof — false and reassuring in exactly
// the place a user checks whether their account is safe. The email row's desc is
// replaced with the signed-in address by the page.
export const securityChecklist = [
  { key: "password", label: "Strong password", done: true, desc: "Set at registration" },
  { key: "2fa", label: "Two-factor authentication", done: false, desc: "Not enabled" },
  { key: "email", label: "Email confirmed", done: true, desc: "" },
  { key: "phone", label: "Phone confirmed", done: false, desc: "Not provided" },
  { key: "trusted", label: "Trusted devices", done: false, desc: "Not configured" },
];

// Payment channels for the Deposit / Withdrawal method-grid landing (Exness).
// `kind` maps to an icon badge in the page. Shown "Unavailable" until verified.
export const paymentChannels = [
  { id: "bnb", name: "BNB (BNB)", kind: "bnb", time: "Instant - 15 minutes", fee: "0%", limits: "10 - 200,000 USD" },
  { id: "card", name: "Bank Card", kind: "card", time: "Instant - 30 minutes", fee: "0%", limits: "10 - 10,000 USD" },
  { id: "btc", name: "Bitcoin (BTC)", kind: "btc", time: "Instant - 1 hour", fee: "0%", limits: "10 - 200,000 USD" },
  { id: "eth", name: "Ethereum (ETH)", kind: "eth", time: "Instant - 15 minutes", fee: "0%", limits: "10 - 200,000 USD" },
  { id: "skrill", name: "Skrill", kind: "skrill", time: "Instant - 30 minutes", fee: "0%", limits: "50 - 100,000 USD" },
  { id: "trx", name: "TRON (TRX)", kind: "trx", time: "Instant - 15 minutes", fee: "0%", limits: "10 - 200,000 USD" },
  { id: "usdtbep", name: "Tether (USDT BEP20)", kind: "usdt", time: "Instant - 15 minutes", fee: "0%", limits: "10 - 200,000 USD" },
  { id: "usdterc", name: "Tether (USDT ERC20)", kind: "usdt", time: "Instant - 15 minutes", fee: "0%", limits: "10 - 200,000 USD" },
  { id: "usdttrc", name: "Tether (USDT TRC20)", kind: "usdt", time: "Instant - 15 minutes", fee: "0%", limits: "10 - 200,000 USD" },
  { id: "usdcbep", name: "USD Coin (USDC BEP20)", kind: "usdc", time: "Instant - 15 minutes", fee: "0%", limits: "10 - 200,000 USD" },
  { id: "usdcerc", name: "USD Coin (USDC ERC20)", kind: "usdc", time: "Instant - 15 minutes", fee: "0%", limits: "10 - 200,000 USD" },
];

// formatMoney lives in lib/config.js and is re-exported at the top of this file.

export function accountTypeVariant(type) {
  if (type === "Standard") return "info";
  if (type === "Pro") return "warning";
  if (type === "Raw Spread") return "success";
  return "neutral";
}

// Not the same thing as config.js's statusVariant, despite the shape. That one
// maps real transaction statuses (verified / rejected / pending_confirmations);
// this maps the placeholder pages' invented ones. Named apart so a page cannot
// import the wrong one and quietly render a real status through the wrong colours.
export function uiStatusVariant(status) {
  if (status === "Completed") return "success";
  if (status === "Pending") return "warning";
  if (status === "Failed") return "error";
  return "neutral";
}

export const typeColor = {
  Standard: "#448AFF",
  Pro: "#B388FF",
  "Raw Spread": "#00C853",
  Zero: "#FFDE02",
};
