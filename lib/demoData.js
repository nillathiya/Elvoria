// ============================================================
//  DEMO DATA — invented, for the demonstration UI only.
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

// Re-exported so the demo pages can take their formatter from the same place
// as their data, while config.js stays the one definition.
export { formatMoney };

export const user = {
  firstName: "John",
  lastName: "Doe",
  name: "John Doe",
  initials: "JD",
  email: "john.doe@email.com",
  clientId: "98765432",
  phone: "+1 (555) 123-4567",
  country: "United States",
  dob: "Jan 15, 1990",
  memberSince: "Jan 2023",
  tier: "Gold",
  verified: true,
};

// The Elvoria Wallet — a single funding hub separate from trading accounts.
export const wallet = {
  id: "WALLET",
  balance: 3250.75,
  currency: "USD",
};

export const balances = [
  { key: "total", label: "Total Balance", value: 12458.32, change: 2.4, positive: true },
  { key: "equity", label: "Equity", value: 11203.1, change: -0.8, positive: false },
  { key: "margin", label: "Free Margin", value: 8947.55, change: 1.2, positive: true },
];

// mode: "Real" | "Demo" | "Archived"
export const accounts = [
  { id: "12345678", type: "Standard", platform: "MT5", balance: 8432.1, equity: 8501.44, leverage: "1:2000", currency: "USD", mode: "Real", server: "Real-15", created: "Jan 2023" },
  { id: "23456789", type: "Pro", platform: "MT5", balance: 24120.5, equity: 24980.12, leverage: "1:2000", currency: "USD", mode: "Real", server: "Real-15", created: "Mar 2023" },
  { id: "34567890", type: "Raw Spread", platform: "MT4", balance: 3150.0, equity: 3092.6, leverage: "1:500", currency: "EUR", mode: "Real", server: "Real-8", created: "Aug 2023" },
  { id: "45678901", type: "Zero", platform: "MT5", balance: 6720.0, equity: 6812.9, leverage: "1:1000", currency: "USD", mode: "Real", server: "Real-15", created: "Feb 2024" },
  { id: "87654321", type: "Standard", platform: "MT5", balance: 10000.0, equity: 10450.0, leverage: "1:Unlimited", currency: "USD", mode: "Demo", server: "Demo-3", created: "Jan 2023" },
  { id: "76543210", type: "Pro", platform: "MT5", balance: 50000.0, equity: 49120.0, leverage: "1:2000", currency: "USD", mode: "Demo", server: "Demo-3", created: "May 2024" },
  { id: "65432109", type: "Standard", platform: "MT4", balance: 0.0, equity: 0.0, leverage: "1:500", currency: "USD", mode: "Archived", server: "Real-8", created: "Nov 2022" },
  { id: "54321098", type: "Raw Spread", platform: "MT5", balance: 0.0, equity: 0.0, leverage: "1:1000", currency: "EUR", mode: "Archived", server: "Real-15", created: "Jun 2022" },
];

export const transactions = [
  { id: "TX10021", date: "Jul 10, 2025", rawDate: "2025-07-10", type: "Deposit", account: "12345678", amount: 500, status: "Completed", method: "Bank Card" },
  { id: "TX10020", date: "Jul 08, 2025", rawDate: "2025-07-08", type: "Withdraw", account: "12345678", amount: -200, status: "Completed", method: "Bank Card" },
  { id: "TX10019", date: "Jul 05, 2025", rawDate: "2025-07-05", type: "Deposit", account: "23456789", amount: 1000, status: "Completed", method: "Wire Transfer" },
  { id: "TX10018", date: "Jul 01, 2025", rawDate: "2025-07-01", type: "Withdraw", account: "12345678", amount: -150, status: "Pending", method: "Skrill" },
  { id: "TX10017", date: "Jun 28, 2025", rawDate: "2025-06-28", type: "Deposit", account: "34567890", amount: 750, status: "Completed", method: "Bitcoin" },
  { id: "TX10016", date: "Jun 25, 2025", rawDate: "2025-06-25", type: "Deposit", account: "12345678", amount: 2000, status: "Completed", method: "Bank Card" },
  { id: "TX10015", date: "Jun 20, 2025", rawDate: "2025-06-20", type: "Withdraw", account: "23456789", amount: -500, status: "Failed", method: "Skrill" },
  { id: "TX10014", date: "Jun 15, 2025", rawDate: "2025-06-15", type: "Deposit", account: "12345678", amount: 300, status: "Completed", method: "Bank Card" },
  { id: "TX10013", date: "Jun 10, 2025", rawDate: "2025-06-10", type: "Internal", account: "12345678", amount: -100, status: "Completed", method: "Transfer" },
  { id: "TX10012", date: "Jun 05, 2025", rawDate: "2025-06-05", type: "Deposit", account: "34567890", amount: 5000, status: "Completed", method: "Wire Transfer" },
  { id: "TX10011", date: "Jun 01, 2025", rawDate: "2025-06-01", type: "Deposit", account: "23456789", amount: 1200, status: "Completed", method: "Bitcoin" },
  { id: "TX10010", date: "May 28, 2025", rawDate: "2025-05-28", type: "Withdraw", account: "12345678", amount: -800, status: "Completed", method: "Bank Card" },
  { id: "TX10009", date: "May 24, 2025", rawDate: "2025-05-24", type: "Internal", account: "34567890", amount: 250, status: "Completed", method: "Transfer" },
  { id: "TX10008", date: "May 20, 2025", rawDate: "2025-05-20", type: "Deposit", account: "12345678", amount: 400, status: "Pending", method: "Perfect Money" },
  { id: "TX10007", date: "May 15, 2025", rawDate: "2025-05-15", type: "Withdraw", account: "23456789", amount: -1000, status: "Completed", method: "Wire Transfer" },
  { id: "TX10006", date: "May 10, 2025", rawDate: "2025-05-10", type: "Deposit", account: "12345678", amount: 3000, status: "Completed", method: "Bank Card" },
  { id: "TX10005", date: "May 05, 2025", rawDate: "2025-05-05", type: "Withdraw", account: "34567890", amount: -350, status: "Failed", method: "Skrill" },
  { id: "TX10004", date: "May 01, 2025", rawDate: "2025-05-01", type: "Deposit", account: "23456789", amount: 900, status: "Completed", method: "Bitcoin" },
  { id: "TX10003", date: "Apr 26, 2025", rawDate: "2025-04-26", type: "Deposit", account: "12345678", amount: 150, status: "Completed", method: "Bank Card" },
  { id: "TX10002", date: "Apr 22, 2025", rawDate: "2025-04-22", type: "Internal", account: "23456789", amount: -600, status: "Completed", method: "Transfer" },
  { id: "TX10001", date: "Apr 18, 2025", rawDate: "2025-04-18", type: "Deposit", account: "12345678", amount: 2500, status: "Completed", method: "Wire Transfer" },
  { id: "TX10000", date: "Apr 14, 2025", rawDate: "2025-04-14", type: "Withdraw", account: "34567890", amount: -450, status: "Completed", method: "Bank Card" },
];

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

export const verificationSteps = [
  { key: "email", label: "Email", status: "Verified" },
  { key: "phone", label: "Phone", status: "Verified" },
  { key: "identity", label: "Identity", status: "Verified" },
  { key: "address", label: "Address", status: "Pending" },
];

// countries lives in lib/config.js — it is a real list, not demo data.

export const currencies = ["USD", "EUR", "GBP"];

// ---- Account type catalog for the multi-step "Open New Account" flow ----
export const accountTypes = [
  { id: "Standard", name: "Standard", tagline: "Balanced conditions for everyday trading", spread: "From 0.6 pips", commission: "None", minDeposit: "$10", color: "#448AFF" },
  { id: "Pro", name: "Pro", tagline: "Instant execution with tighter spreads", spread: "From 0.1 pips", commission: "None", minDeposit: "$500", color: "#B388FF" },
  { id: "Raw Spread", name: "Raw Spread", tagline: "Near-zero spreads, low commission", spread: "From 0.0 pips", commission: "$3.5 / lot", minDeposit: "$200", color: "#00C853" },
  { id: "Zero", name: "Zero", tagline: "Zero spread on key instruments", spread: "0.0 pips", commission: "$0.05 / lot", minDeposit: "$200", color: "#FFDE02" },
];

// ---- Performance analytics (mocked) ----
export const analytics = {
  summary: [
    { key: "netpnl", label: "Net P&L", value: 4287.56, change: 12.4, positive: true, money: true },
    { key: "winrate", label: "Win Rate", value: 68.2, change: 3.1, positive: true, suffix: "%" },
    { key: "trades", label: "Total Trades", value: 342, change: 8.0, positive: true },
    { key: "volume", label: "Volume Traded", value: 128.4, change: -2.3, positive: false, suffix: " lots" },
  ],
  // 12-point equity curve
  equityCurve: [
    { label: "Aug", value: 8200 },
    { label: "Sep", value: 8650 },
    { label: "Oct", value: 8420 },
    { label: "Nov", value: 9100 },
    { label: "Dec", value: 9780 },
    { label: "Jan", value: 9550 },
    { label: "Feb", value: 10240 },
    { label: "Mar", value: 10890 },
    { label: "Apr", value: 10620 },
    { label: "May", value: 11340 },
    { label: "Jun", value: 12010 },
    { label: "Jul", value: 12458 },
  ],
  // monthly P&L bars (positive/negative)
  monthlyPnl: [
    { label: "Feb", value: 690 },
    { label: "Mar", value: 650 },
    { label: "Apr", value: -270 },
    { label: "May", value: 720 },
    { label: "Jun", value: 670 },
    { label: "Jul", value: 448 },
  ],
  instruments: [
    { name: "EUR/USD", trades: 96, pnl: 1420.5, positive: true, share: 28 },
    { name: "XAU/USD", trades: 74, pnl: 1180.2, positive: true, share: 22 },
    { name: "BTC/USD", trades: 58, pnl: -340.8, positive: false, share: 17 },
    { name: "GBP/USD", trades: 46, pnl: 610.4, positive: true, share: 13 },
    { name: "US30", trades: 40, pnl: 890.1, positive: true, share: 12 },
    { name: "USD/JPY", trades: 28, pnl: 527.2, positive: true, share: 8 },
  ],
};

// ============================================================
//  Trading — closed orders (History of orders / order summary)
// ============================================================

// Closed positions for the Orders History table (Exness ordersHistory).
export const closedOrders = [
  { ticket: "2183940021", symbol: "EURUSD", side: "Buy", volume: 0.50, openPrice: 1.08421, closePrice: 1.08790, sl: 1.08100, tp: 1.08900, openTime: "2025-07-11 08:32:14", closeTime: "2025-07-11 12:04:51", commission: -3.50, swap: -0.42, profit: 184.50 },
  { ticket: "2183939884", symbol: "XAUUSD", side: "Sell", volume: 0.20, openPrice: 2412.85, closePrice: 2398.10, sl: 2425.00, tp: 2395.00, openTime: "2025-07-11 06:11:02", closeTime: "2025-07-11 10:47:33", commission: -2.00, swap: -1.10, profit: 295.00 },
  { ticket: "2183938120", symbol: "GBPUSD", side: "Buy", volume: 0.30, openPrice: 1.28910, closePrice: 1.28640, sl: 1.28600, tp: 1.29400, openTime: "2025-07-10 14:22:40", closeTime: "2025-07-10 18:55:09", commission: -2.10, swap: -0.30, profit: -81.00 },
  { ticket: "2183936775", symbol: "BTCUSD", side: "Buy", volume: 0.10, openPrice: 58120.0, closePrice: 59340.0, sl: 57000.0, tp: 60000.0, openTime: "2025-07-10 09:04:18", closeTime: "2025-07-10 21:38:44", commission: -5.00, swap: 0.00, profit: 122.00 },
  { ticket: "2183935001", symbol: "USDJPY", side: "Sell", volume: 0.40, openPrice: 161.240, closePrice: 160.880, sl: 161.600, tp: 160.500, openTime: "2025-07-09 11:47:55", closeTime: "2025-07-09 16:20:12", commission: -2.80, swap: 0.90, profit: 89.40 },
  { ticket: "2183933442", symbol: "US30", side: "Buy", volume: 0.50, openPrice: 39820.0, closePrice: 40010.0, sl: 39600.0, tp: 40200.0, openTime: "2025-07-09 08:01:33", closeTime: "2025-07-09 15:12:47", commission: -3.50, swap: -1.75, profit: 95.00 },
  { ticket: "2183931890", symbol: "EURUSD", side: "Sell", volume: 0.60, openPrice: 1.08650, closePrice: 1.08810, sl: 1.08900, tp: 1.08200, openTime: "2025-07-08 13:19:20", closeTime: "2025-07-08 17:45:01", commission: -4.20, swap: -0.55, profit: -96.00 },
  { ticket: "2183930215", symbol: "XAUUSD", side: "Buy", volume: 0.15, openPrice: 2388.40, closePrice: 2405.90, sl: 2375.00, tp: 2410.00, openTime: "2025-07-08 07:55:44", closeTime: "2025-07-08 13:02:38", commission: -1.50, swap: -0.80, profit: 262.50 },
  { ticket: "2183928660", symbol: "GBPUSD", side: "Buy", volume: 0.25, openPrice: 1.28450, closePrice: 1.28720, sl: 1.28200, tp: 1.28800, openTime: "2025-07-07 10:12:09", closeTime: "2025-07-07 14:38:55", commission: -1.75, swap: -0.20, profit: 67.50 },
  { ticket: "2183927003", symbol: "BTCUSD", side: "Sell", volume: 0.08, openPrice: 59980.0, closePrice: 58720.0, sl: 61000.0, tp: 58000.0, openTime: "2025-07-07 06:44:31", closeTime: "2025-07-07 19:11:26", commission: -4.00, swap: 0.00, profit: 100.80 },
  { ticket: "2183925441", symbol: "USDJPY", side: "Buy", volume: 0.35, openPrice: 160.410, closePrice: 160.180, sl: 160.100, tp: 161.000, openTime: "2025-07-04 09:28:17", closeTime: "2025-07-04 15:51:40", commission: -2.45, swap: -0.60, profit: -49.90 },
  { ticket: "2183923880", symbol: "US30", side: "Buy", volume: 0.30, openPrice: 39610.0, closePrice: 39905.0, sl: 39400.0, tp: 40000.0, openTime: "2025-07-04 07:15:52", closeTime: "2025-07-04 13:44:19", commission: -2.10, swap: -1.05, profit: 88.50 },
  { ticket: "2183922114", symbol: "EURUSD", side: "Buy", volume: 0.45, openPrice: 1.08210, closePrice: 1.08470, sl: 1.08000, tp: 1.08600, openTime: "2025-07-03 12:03:41", closeTime: "2025-07-03 16:29:58", commission: -3.15, swap: -0.38, profit: 117.00 },
  { ticket: "2183920557", symbol: "XAUUSD", side: "Sell", volume: 0.10, openPrice: 2401.20, closePrice: 2409.60, sl: 2412.00, tp: 2385.00, openTime: "2025-07-03 08:37:26", closeTime: "2025-07-03 11:58:03", commission: -1.00, swap: -0.45, profit: -84.00 },
  { ticket: "2183918990", symbol: "GBPUSD", side: "Sell", volume: 0.20, openPrice: 1.28990, closePrice: 1.28610, sl: 1.29300, tp: 1.28500, openTime: "2025-07-02 10:51:14", closeTime: "2025-07-02 15:17:37", commission: -1.40, swap: -0.25, profit: 76.00 },
  { ticket: "2183917322", symbol: "BTCUSD", side: "Buy", volume: 0.12, openPrice: 57340.0, closePrice: 58210.0, sl: 56000.0, tp: 59000.0, openTime: "2025-07-02 06:20:48", closeTime: "2025-07-02 22:04:12", commission: -6.00, swap: 0.00, profit: 104.40 },
  { ticket: "2183915780", symbol: "USDJPY", side: "Sell", volume: 0.50, openPrice: 161.010, closePrice: 160.640, sl: 161.400, tp: 160.200, openTime: "2025-07-01 09:14:03", closeTime: "2025-07-01 17:40:55", commission: -3.50, swap: 1.20, profit: 114.90 },
  { ticket: "2183914118", symbol: "EURUSD", side: "Sell", volume: 0.30, openPrice: 1.08880, closePrice: 1.09010, sl: 1.09200, tp: 1.08400, openTime: "2025-07-01 07:02:29", closeTime: "2025-07-01 12:33:48", commission: -2.10, swap: -0.30, profit: -39.00 },
  { ticket: "2183912550", symbol: "US30", side: "Buy", volume: 0.40, openPrice: 39410.0, closePrice: 39680.0, sl: 39200.0, tp: 39800.0, openTime: "2025-06-30 08:44:16", closeTime: "2025-06-30 14:22:07", commission: -2.80, swap: -1.40, profit: 108.00 },
  { ticket: "2183910983", symbol: "XAUUSD", side: "Buy", volume: 0.25, openPrice: 2379.60, closePrice: 2396.30, sl: 2365.00, tp: 2400.00, openTime: "2025-06-30 06:33:50", closeTime: "2025-06-30 12:09:41", commission: -2.50, swap: -1.30, profit: 417.50 },
];

// Aggregate stats for the Order Summary page (Exness orderSummary).
export const ordersSummary = {
  // headline tiles
  totals: [
    { key: "netpnl", label: "Total net profit", value: 4287.56, money: true, positive: true },
    { key: "trades", label: "Total trades", value: 342 },
    { key: "winrate", label: "Win rate", value: 68.2, suffix: "%", positive: true },
    { key: "volume", label: "Traded volume", value: 128.4, suffix: " lots" },
  ],
  // profit vs loss split
  breakdown: {
    profitTrades: 233,
    lossTrades: 109,
    grossProfit: 8940.20,
    grossLoss: -4652.64,
    largestWin: 417.50,
    largestLoss: -96.00,
    avgWin: 38.37,
    avgLoss: -42.68,
    profitFactor: 1.92,
    bestSymbol: "EURUSD",
  },
  // balance operations
  operations: [
    { key: "deposits", label: "Deposits", value: 18450.00, positive: true },
    { key: "withdrawals", label: "Withdrawals", value: -6200.00 },
    { key: "credit", label: "Credit / bonus", value: 250.00, positive: true },
    { key: "commission", label: "Commission paid", value: -1184.30 },
    { key: "swap", label: "Swap", value: -212.45 },
  ],
  // buy/sell distribution for a donut
  direction: { buy: 61, sell: 39 },
};

// ============================================================
//  Insights — signals, news, economic calendar
// ============================================================

// Trading signals (Exness analystViews / Trading Central).
export const tradingSignals = [
  { id: "sig1", symbol: "EUR/USD", side: "Buy", timeframe: "Intraday", entry: 1.0842, target: 1.0910, stop: 1.0805, strength: 4, updated: "12 min ago", note: "Bullish pivot above 1.0840 pivot; momentum turning up." },
  { id: "sig2", symbol: "XAU/USD", side: "Sell", timeframe: "Short term", entry: 2412.0, target: 2380.0, stop: 2428.0, strength: 3, updated: "34 min ago", note: "Rejection at resistance, RSI diverging lower." },
  { id: "sig3", symbol: "GBP/USD", side: "Buy", timeframe: "Intraday", entry: 1.2890, target: 1.2960, stop: 1.2855, strength: 5, updated: "1 hr ago", note: "Break of consolidation, strong volume confirmation." },
  { id: "sig4", symbol: "BTC/USD", side: "Buy", timeframe: "Swing", entry: 58200, target: 61500, stop: 56400, strength: 4, updated: "2 hr ago", note: "Higher low formed; trend structure intact." },
  { id: "sig5", symbol: "USD/JPY", side: "Sell", timeframe: "Short term", entry: 161.20, target: 160.10, stop: 161.80, strength: 2, updated: "3 hr ago", note: "Intervention risk near multi-year highs." },
  { id: "sig6", symbol: "US30", side: "Buy", timeframe: "Intraday", entry: 39810, target: 40150, stop: 39620, strength: 3, updated: "4 hr ago", note: "Holding above 20-EMA, buyers defending dips." },
];

// FX / market news feed (Exness fxnews).
export const fxNews = [
  { id: "n1", title: "Dollar softens as traders raise September rate-cut bets", source: "Reuters", category: "Forex", time: "18 min ago", impact: "High", summary: "The greenback slipped against major peers after cooler inflation data reinforced expectations that the Fed could begin easing policy in September.", symbols: ["EUR/USD", "USD/JPY"] },
  { id: "n2", title: "Gold holds near record as safe-haven demand persists", source: "Bloomberg", category: "Commodities", time: "42 min ago", impact: "Medium", summary: "Bullion steadied close to all-time highs amid geopolitical tension and a weaker dollar, with analysts eyeing the next psychological level.", symbols: ["XAU/USD"] },
  { id: "n3", title: "Sterling climbs after upbeat UK GDP surprise", source: "Financial Times", category: "Forex", time: "1 hr ago", impact: "High", summary: "The pound advanced as the UK economy grew faster than forecast, easing recession fears and lifting gilt yields.", symbols: ["GBP/USD"] },
  { id: "n4", title: "Bitcoin rebounds above $58K on ETF inflows", source: "CoinDesk", category: "Crypto", time: "2 hr ago", impact: "Medium", summary: "Spot Bitcoin ETFs recorded their strongest daily inflow in weeks, helping the token recover from a mid-week dip.", symbols: ["BTC/USD"] },
  { id: "n5", title: "Oil edges lower as demand outlook clouds", source: "Reuters", category: "Commodities", time: "3 hr ago", impact: "Low", summary: "Crude prices eased after mixed inventory data and concerns over the pace of the global demand recovery.", symbols: ["USOIL"] },
  { id: "n6", title: "Yen wobbles as intervention watch intensifies", source: "Nikkei", category: "Forex", time: "4 hr ago", impact: "High", summary: "Japanese authorities repeated warnings against excessive currency moves as the yen traded near multi-decade lows.", symbols: ["USD/JPY"] },
  { id: "n7", title: "Wall Street futures steady ahead of earnings deluge", source: "CNBC", category: "Indices", time: "5 hr ago", impact: "Low", summary: "Equity index futures were little changed as investors braced for a busy week of corporate results from megacap names.", symbols: ["US30", "US500"] },
  { id: "n8", title: "Euro area inflation cools, backing ECB cut path", source: "Bloomberg", category: "Forex", time: "6 hr ago", impact: "Medium", summary: "Headline inflation across the bloc slowed for a second month, keeping the door open to further ECB rate reductions.", symbols: ["EUR/USD"] },
];

// Economic calendar events (Exness economic-calendar).
export const economicEvents = [
  { id: "e1", time: "08:30", country: "US", flag: "🇺🇸", currency: "USD", event: "Core CPI (MoM)", impact: "High", actual: "0.2%", forecast: "0.3%", previous: "0.3%" },
  { id: "e2", time: "09:00", country: "EU", flag: "🇪🇺", currency: "EUR", event: "ECB President Speech", impact: "High", actual: "—", forecast: "—", previous: "—" },
  { id: "e3", time: "10:00", country: "GB", flag: "🇬🇧", currency: "GBP", event: "GDP Growth Rate (QoQ)", impact: "Medium", actual: "0.7%", forecast: "0.5%", previous: "0.3%" },
  { id: "e4", time: "12:30", country: "US", flag: "🇺🇸", currency: "USD", event: "Initial Jobless Claims", impact: "Medium", actual: "221K", forecast: "230K", previous: "227K" },
  { id: "e5", time: "14:00", country: "US", flag: "🇺🇸", currency: "USD", event: "Fed Chair Testimony", impact: "High", actual: "—", forecast: "—", previous: "—" },
  { id: "e6", time: "18:00", country: "US", flag: "🇺🇸", currency: "USD", event: "Crude Oil Inventories", impact: "Low", actual: "-1.2M", forecast: "-0.8M", previous: "1.9M" },
  { id: "e7", time: "23:50", country: "JP", flag: "🇯🇵", currency: "JPY", event: "BoJ Monetary Policy Minutes", impact: "Medium", actual: "—", forecast: "—", previous: "—" },
  { id: "e8", time: "02:00", country: "CN", flag: "🇨🇳", currency: "CNY", event: "Trade Balance", impact: "Medium", actual: "$99.05B", forecast: "$85.0B", previous: "$82.6B" },
  { id: "e9", time: "06:00", country: "DE", flag: "🇩🇪", currency: "EUR", event: "Harmonised Inflation (YoY)", impact: "Low", actual: "2.5%", forecast: "2.5%", previous: "2.8%" },
  { id: "e10", time: "07:45", country: "FR", flag: "🇫🇷", currency: "EUR", event: "Industrial Production (MoM)", impact: "Low", actual: "-0.4%", forecast: "0.1%", previous: "-2.1%" },
];

// ============================================================
//  Exness benefits — trading conditions (swap-free), savings, VPS
// ============================================================

export const swapFreeInstruments = [
  { symbol: "XAUUSD", name: "Gold", spread: "From 11", swapFree: true },
  { symbol: "EURUSD", name: "Euro / US Dollar", spread: "From 0.0", swapFree: true },
  { symbol: "GBPUSD", name: "Pound / US Dollar", spread: "From 0.3", swapFree: true },
  { symbol: "USDJPY", name: "US Dollar / Yen", spread: "From 0.4", swapFree: true },
  { symbol: "BTCUSD", name: "Bitcoin", spread: "From 25", swapFree: true },
  { symbol: "US30", name: "Dow Jones 30", spread: "From 1.5", swapFree: true },
];

export const savings = {
  apy: 4.5,
  currency: "USD",
  freeFunds: 3250.75,
  accrued: 42.18,
  paidOut: 318.64,
  minBalance: 100,
  history: [
    { date: "Jul 13, 2025", amount: 0.40 },
    { date: "Jul 12, 2025", amount: 0.40 },
    { date: "Jul 11, 2025", amount: 0.39 },
    { date: "Jul 10, 2025", amount: 0.41 },
    { date: "Jul 09, 2025", amount: 0.40 },
    { date: "Jul 08, 2025", amount: 0.38 },
  ],
};

export const vpsPlans = [
  { id: "free", name: "Free VPS", price: 0, priceLabel: "Free", latency: "< 4 ms", ram: "1 GB", cpu: "1 vCPU", storage: "20 GB SSD", eligible: "Deposit $500+ & trade 5 lots/mo", features: ["MetaTrader 4 & 5 ready", "99.9% uptime", "24/7 monitoring"], popular: false },
  { id: "standard", name: "Standard", price: 15, priceLabel: "$15/mo", latency: "< 4 ms", ram: "2 GB", cpu: "2 vCPU", storage: "40 GB SSD", eligible: "Available to all clients", features: ["MetaTrader 4 & 5 ready", "99.9% uptime", "Priority support", "1-click setup"], popular: true },
  { id: "premium", name: "Premium", price: 30, priceLabel: "$30/mo", latency: "< 2 ms", ram: "4 GB", cpu: "4 vCPU", storage: "80 GB SSD", eligible: "Available to all clients", features: ["MetaTrader 4 & 5 ready", "99.99% uptime", "Priority support", "Dedicated resources", "DDoS protection"], popular: false },
];

// ============================================================
//  Copy trading (Exness socialtrading)
// ============================================================

export const copyStrategies = [
  { id: "cp1", name: "Momentum Alpha", trader: "A. Rahman", country: "🇦🇪", return: 142.5, months: 18, risk: "Medium", copiers: 2840, minInvest: 100, commission: 25, equity: 1200000, gainSeries: [4,8,6,12,15,13,18,22,20,26,30,34] },
  { id: "cp2", name: "Steady Gold", trader: "M. Chen", country: "🇸🇬", return: 68.3, months: 24, risk: "Low", copiers: 5120, minInvest: 50, commission: 20, equity: 3400000, gainSeries: [2,3,5,6,8,9,11,12,14,16,18,20] },
  { id: "cp3", name: "FX Breakout Pro", trader: "L. Novak", country: "🇬🇧", return: 214.7, months: 12, risk: "High", copiers: 1460, minInvest: 200, commission: 30, equity: 780000, gainSeries: [10,6,18,12,28,22,40,30,55,44,70,62] },
  { id: "cp4", name: "Index Rider", trader: "S. Okafor", country: "🇳🇬", return: 51.9, months: 15, risk: "Medium", copiers: 980, minInvest: 100, commission: 22, equity: 420000, gainSeries: [3,5,4,7,9,8,11,10,13,15,14,17] },
  { id: "cp5", name: "Crypto Swing", trader: "D. Ivanov", country: "🇷🇺", return: 188.2, months: 10, risk: "High", copiers: 2210, minInvest: 150, commission: 28, equity: 640000, gainSeries: [8,14,10,24,18,34,28,46,40,60,52,72] },
  { id: "cp6", name: "Balanced Yield", trader: "P. Sharma", country: "🇮🇳", return: 44.6, months: 20, risk: "Low", copiers: 3670, minInvest: 50, commission: 18, equity: 1900000, gainSeries: [2,3,4,5,6,8,9,10,12,13,15,16] },
];

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
  { q: "How long do withdrawals take to process?", a: "Most withdrawals are processed automatically within 24 hours. The time to reach your account depends on the payment method — e-wallets and cards are usually instant once approved, while bank transfers can take 1–3 business days." },
  { q: "Why is my account verification pending?", a: "Verification is pending while our team reviews your submitted documents. This normally takes a few minutes to a few hours. Make sure your proof of identity and proof of address are clear, valid and unexpired." },
  { q: "How do I reset my trading account password?", a: "Go to Trading → Accounts, select the account, and choose 'Change password'. You can set a new master or investor password. The change applies immediately across MT4/MT5 and the web terminal." },
  { q: "What is the minimum deposit?", a: "The minimum deposit is $10 for most payment methods. Some methods such as wire transfer may have a higher minimum. The exact figure is shown on the Deposit page for each method." },
  { q: "How does swap-free trading work?", a: "Swap-free (Islamic) accounts do not incur overnight swap charges on eligible instruments. Instead, a fixed administration fee may apply after a grace period on positions held long term." },
  { q: "Can I trade on multiple devices at once?", a: "Yes. Your account works across the desktop apps, mobile apps and the web terminal simultaneously. Your positions and balance stay synced in real time." },
];

// ============================================================
//  Profile & security (Exness settings/profile, settings/security)
// ============================================================

export const profileFields = [
  { key: "name", label: "Full name", value: "John Doe", editable: false },
  { key: "email", label: "Email", value: "john.doe@email.com", verified: true },
  { key: "phone", label: "Phone", value: "+1 (555) 123-4567", verified: true },
  { key: "dob", label: "Date of birth", value: "Jan 15, 1990", editable: false },
  { key: "country", label: "Country of residence", value: "United States", editable: false },
  { key: "address", label: "Residential address", value: "Not provided", verified: false },
];

export const securitySessions = [
  { id: "s1", device: "Chrome · Windows", location: "New York, US", ip: "192.0.2.14", lastActive: "Active now", current: true },
  { id: "s2", device: "Elvoria App · iPhone", location: "New York, US", ip: "198.51.100.7", lastActive: "2 hours ago", current: false },
  { id: "s3", device: "Safari · macOS", location: "Boston, US", ip: "203.0.113.42", lastActive: "Yesterday", current: false },
  { id: "s4", device: "Chrome · Android", location: "London, UK", ip: "203.0.113.88", lastActive: "3 days ago", current: false },
];

export const securityChecklist = [
  { key: "password", label: "Strong password", done: true, desc: "Last changed 2 months ago" },
  { key: "2fa", label: "Two-factor authentication", done: true, desc: "Authenticator app enabled" },
  { key: "email", label: "Email confirmed", done: true, desc: "john.doe@email.com" },
  { key: "phone", label: "Phone confirmed", done: true, desc: "+1 (555) 123-4567" },
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
// this maps the demo pages' invented ones. Named apart so a page cannot import
// the wrong one and quietly render a real status through demo colours.
export function demoStatusVariant(status) {
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
