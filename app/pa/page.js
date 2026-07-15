"use client";

import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import styles from "./page.module.css";

// Spec §2.3: the user panel exists to reach the deposit flow. The previous
// dashboard showed a mock balance, equity, free margin, four fake trading
// accounts and a fabricated order history — none of it backed by anything.
export default function PersonalAreaPage() {
  const { user, userLoading } = useApp();

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <h1 className={styles.title}>
          {userLoading ? "Welcome" : `Welcome, ${user?.username ?? ""}`}
        </h1>
        <p className={styles.sub}>Fund your account using any of the available methods.</p>
      </header>

      <Card>
        <div className={styles.cta}>
          <span className={styles.ctaIcon}>
            <Wallet size={22} />
          </span>
          <div className={styles.ctaBody}>
            <h2 className={styles.ctaTitle}>Make a deposit</h2>
            <p className={styles.ctaText}>
              Choose a method and we will show you the receiving address to send funds to.
            </p>
          </div>
          <Link href="/pa/deposit">
            <Button icon={ArrowRight}>Deposit</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
