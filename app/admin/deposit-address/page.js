"use client";

import { useState, useEffect } from "react";
import { Save, Pencil, Wallet } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Badge from "../../components/Badge";
import { useApp } from "../../context/AppContext";
import {
  CRYPTO_CHANNELS,
  getDepositAddresses,
  setDepositAddress,
} from "@/lib/depositAddresses";
import styles from "./page.module.css";

export default function AdminDepositAddressPage() {
  const { showToast } = useApp();
  const [addresses, setAddresses] = useState({});
  const [channel, setChannel] = useState(CRYPTO_CHANNELS[0].id);
  const [address, setAddress] = useState("");

  useEffect(() => {
    setAddresses(getDepositAddresses());
  }, []);

  // Load the selected channel's current address into the input.
  useEffect(() => {
    setAddress(getDepositAddresses()[channel] || "");
  }, [channel]);

  const current = CRYPTO_CHANNELS.find((c) => c.id === channel);

  const save = () => {
    if (!address.trim()) {
      showToast("Enter an address first", "error");
      return;
    }
    const next = setDepositAddress(channel, address.trim());
    setAddresses(next);
    showToast(`${current.name} address saved`);
  };

  const edit = (id) => {
    setChannel(id);
    setAddress(getDepositAddresses()[id] || "");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Deposit addresses</h1>
          <p className={styles.sub}>
            Set the receiving wallet address for each currency. These appear on the client
            Deposit page — clicking a currency there shows its address and QR code.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <Card className={styles.formCard}>
          <h2 className={styles.sectionTitle}>
            <Wallet size={18} /> Set address
          </h2>

          <Input
            type="select"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            options={CRYPTO_CHANNELS.map((c) => ({ value: c.id, label: `${c.name} · ${c.network}` }))}
          />

          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder=" "
            helper={`Network: ${current?.network}`}
          />

          <Button size="lg" fullWidth icon={Save} onClick={save} className={styles.saveBtn}>
            Save address
          </Button>
        </Card>

        <Card padding="sm" className={styles.listCard}>
          <h2 className={styles.sectionTitle}>All addresses</h2>
          <div className={styles.list}>
            {CRYPTO_CHANNELS.map((c) => (
              <div key={c.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <span className={styles.rowName}>{c.name}</span>
                  <Badge variant="neutral" size="sm">{c.network}</Badge>
                </div>
                <span className={styles.addr} title={addresses[c.id]}>
                  {addresses[c.id] || "Not set"}
                </span>
                <Button variant="outline" size="sm" icon={Pencil} onClick={() => edit(c.id)}>
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
