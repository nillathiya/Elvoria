"use client";

import Link from "next/link";
import { BRAND } from "@/lib/config";
import { legalLinks } from "@/lib/legalDocs";
import styles from "./Footer.module.css";

// Site footer: legal disclaimer + links to the /legal/[slug] pages.
export default function Footer() {
  const links = legalLinks();

  return (
    <footer className={styles.footer}>
      <div className={styles.legal}>
        <p>
          {BRAND} is a demonstration trading platform built for portfolio and educational
          purposes only. It is not a licensed financial services provider, holds no client funds,
          and does not execute real trades or process real payments.
        </p>
        <p>
          The information shown in this interface is mock data for illustration. General Risk
          Warning: CFDs are complex leveraged products that carry a high level of risk. They may
          not be suitable for every investor, and you could lose more than your initial deposit.
          Make sure you fully understand the risks involved before trading.{" "}
          <Link href="/legal/risk-disclosure">Learn more</Link>
        </p>
        <p>
          No personal or financial information entered here is stored, transmitted, or shared. This
          project is not affiliated with, endorsed by, or connected to any real brokerage.
        </p>
      </div>

      <nav className={styles.links}>
        {links.map((l) => (
          <Link key={l.slug} href={`/legal/${l.slug}`} className={styles.link}>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className={styles.copy}>© 2008 – 2026. {BRAND}</div>
    </footer>
  );
}
