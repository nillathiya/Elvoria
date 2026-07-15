"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Copy,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import Card from "@/app/components/Card";
import Button from "@/app/components/Button";
import Badge from "@/app/components/Badge";
import Input from "@/app/components/Input";
import { useApp } from "@/app/context/AppContext";
import { formatMoney } from "@/lib/mockData";
import styles from "./page.module.css";

const coinColors = {
  BTC: "#f7931a",
  USDT: "#26a17b",
  ETH: "#627eea",
};

const assets = [
  { sym: "BTC", name: "Bitcoin", balance: 0.0642, usd: 3730.11, change: +2.4 },
  { sym: "USDT", name: "Tether", balance: 412.0, usd: 412.0, change: 0.0 },
  { sym: "ETH", name: "Ethereum", balance: 0.011, usd: 40.44, change: -1.1 },
];

const networks = [
  { value: "btc", label: "Bitcoin", min: "0.0005 BTC", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
  { value: "usdt-trc20", label: "Tether TRC20", min: "10 USDT", address: "TQn9Y2khDD95J42FQtQTdwVVR93Nv6Xr8c" },
  { value: "usdt-erc20", label: "Tether ERC20", min: "20 USDT", address: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE" },
  { value: "eth", label: "Ethereum", min: "0.005 ETH", address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
];

const recentTx = [
  { id: "cx1", sym: "BTC", type: "Deposit", amount: "+0.0120 BTC", status: "Completed", time: "2 hours ago" },
  { id: "cx2", sym: "USDT", type: "Withdraw", amount: "-150.00 USDT", status: "Pending", time: "Yesterday" },
  { id: "cx3", sym: "ETH", type: "Deposit", amount: "+0.0050 ETH", status: "Completed", time: "3 days ago" },
  { id: "cx4", sym: "USDT", type: "Deposit", amount: "+412.00 USDT", status: "Completed", time: "Jul 05" },
];

const totalCryptoUsd = assets.reduce((sum, a) => sum + a.usd, 0);

function CoinBadge({ sym, size = 40 }) {
  return (
    <span
      className={styles.coin}
      style={{ background: coinColors[sym] ?? "var(--bg-elevated)", width: size, height: size, fontSize: size * 0.32 }}
    >
      {sym.slice(0, sym === "USDT" ? 4 : 3)}
    </span>
  );
}

function ChangeBadge({ change }) {
  if (change === 0) return <Badge variant="neutral">0.0%</Badge>;
  const up = change > 0;
  return (
    <Badge variant={up ? "success" : "error"} icon={up ? TrendingUp : TrendingDown}>
      {up ? "+" : ""}
      {change.toFixed(1)}%
    </Badge>
  );
}

export default function CryptoWalletPage() {
  const { showToast } = useApp();
  const [tab, setTab] = useState("deposit");

  // Deposit tab
  const [network, setNetwork] = useState(networks[0].value);
  const selectedNetwork = networks.find((n) => n.value === network) ?? networks[0];

  // Withdraw tab
  const [wNetwork, setWNetwork] = useState(networks[0].value);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const wSelected = networks.find((n) => n.value === wNetwork) ?? networks[0];

  const copyAddress = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(selectedNetwork.address).catch(() => {});
    }
    showToast("Address copied");
  };

  const handleWithdraw = () => {
    if (!address.trim()) return showToast("Enter a destination address", "error");
    if (!(parseFloat(amount) > 0)) return showToast("Enter a valid amount", "error");
    showToast(`Withdrawal of ${amount} via ${wSelected.label} requested`);
    setAddress("");
    setAmount("");
  };

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Crypto wallet</h1>
          <p className={styles.sub}>Deposit and withdraw crypto directly</p>
        </div>
      </header>

      <Card variant="highlighted" padding="lg">
        <div className={styles.totalBox}>
          <div>
            <div className={styles.totalLabel}>
              <Wallet size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
              Total crypto balance
            </div>
            <div className={styles.totalValue}>{formatMoney(totalCryptoUsd)}</div>
          </div>
          <Badge variant="success" icon={TrendingUp} size="md">
            +1.8% · 24h
          </Badge>
        </div>
      </Card>

      <section>
        <h2 className={styles.sectionTitle}>Your assets</h2>
        <div className={`${styles.assets} stagger`}>
          {assets.map((a) => (
            <Card key={a.sym} hoverable className={styles.assetCard}>
              <div className={styles.assetTop}>
                <CoinBadge sym={a.sym} />
                <div className={styles.assetName}>
                  <span className={styles.assetSym}>{a.sym}</span>
                  <span className={styles.assetFull}>{a.name}</span>
                </div>
                <ChangeBadge change={a.change} />
              </div>
              <div className={styles.assetBalances}>
                <span className={styles.assetCrypto}>
                  {a.balance} {a.sym}
                </span>
                <span className={styles.assetUsd}>{formatMoney(a.usd)}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className={styles.layout}>
        <Card className={styles.receiveCard}>
          <div className={styles.tabs}>
            <button
              className={[styles.tab, tab === "deposit" ? styles.tabActive : ""].filter(Boolean).join(" ")}
              onClick={() => setTab("deposit")}
            >
              <ArrowDownLeft size={16} /> Deposit
            </button>
            <button
              className={[styles.tab, tab === "withdraw" ? styles.tabActive : ""].filter(Boolean).join(" ")}
              onClick={() => setTab("withdraw")}
            >
              <ArrowUpRight size={16} /> Withdraw
            </button>
          </div>

          {tab === "deposit" ? (
            <div className={styles.depositBody}>
              <Input
                type="select"
                label="Network"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                options={networks.map((n) => ({ value: n.value, label: n.label }))}
              />

              <div className={styles.qrWrap}>
                <div className={styles.qr} aria-label="QR code placeholder" />
                <p className={styles.qrHint}>Scan to deposit {selectedNetwork.label}</p>
              </div>

              <div className={styles.addressField}>
                <span className={styles.addressText}>{selectedNetwork.address}</span>
                <button className={styles.copyBtn} onClick={copyAddress} aria-label="Copy address">
                  <Copy size={16} />
                </button>
              </div>

              <p className={styles.note}>
                Minimum deposit: <strong>{selectedNetwork.min}</strong>. Send only over the
                selected network — other assets may be lost.
              </p>
            </div>
          ) : (
            <div className={styles.withdrawBody}>
              <Input
                type="select"
                label="Network"
                value={wNetwork}
                onChange={(e) => setWNetwork(e.target.value)}
                options={networks.map((n) => ({ value: n.value, label: n.label }))}
              />
              <Input
                type="text"
                label="Destination address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input
                type="number"
                label="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                helper={`Minimum withdrawal: ${wSelected.min}`}
                min="0"
              />
              <Button size="lg" fullWidth onClick={handleWithdraw} icon={ArrowUpRight}>
                Withdraw
              </Button>
              <p className={styles.note}>
                Network fees are deducted from the withdrawal amount. Double-check the address
                before confirming.
              </p>
            </div>
          )}
        </Card>

        <Card variant="glass" className={styles.recentCard}>
          <h2 className={styles.sectionTitle}>Recent crypto transactions</h2>
          <ul className={styles.txList}>
            {recentTx.map((t) => {
              const inbound = t.type === "Deposit";
              return (
                <li key={t.id} className={styles.txRow}>
                  <CoinBadge sym={t.sym} size={34} />
                  <div className={styles.txInfo}>
                    <span className={styles.txType}>
                      {inbound ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                      {t.type}
                    </span>
                    <span className={styles.txTime}>{t.time}</span>
                  </div>
                  <div className={styles.txRight}>
                    <span
                      className={styles.txAmount}
                      style={{ color: inbound ? "var(--success)" : "var(--error)" }}
                    >
                      {t.amount}
                    </span>
                    <Badge
                      variant={t.status === "Completed" ? "success" : "warning"}
                      size="sm"
                    >
                      {t.status}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
