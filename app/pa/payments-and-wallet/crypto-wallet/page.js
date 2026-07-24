import { redirect } from "next/navigation";

// This page was a mockup: it rendered burn addresses (0x…dEaD) under a "Scan to
// deposit" QR and a withdraw form that only popped a toast. On a live site that
// is a way to lose real money, so the route now sends people to the real,
// on-chain-verified deposit flow instead. The old UI is in git history if a
// genuine crypto-wallet screen is ever built against real addresses.
export default function CryptoWalletPage() {
  redirect("/pa/deposit");
}
