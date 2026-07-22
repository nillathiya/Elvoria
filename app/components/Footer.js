"use client";

import Link from "next/link";
import { BRAND, SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY, whatsappHref } from "@/lib/config";
import { legalLinks } from "@/lib/legalDocs";
import WhatsAppIcon from "./WhatsAppIcon";
import styles from "./Footer.module.css";

// Site footer: legal disclaimer + links to the /legal/[slug] pages.
//
// `minimal` drops both and keeps only the copyright line. The admin panel uses
// it: the disclaimers speak to someone about to deposit ("send only the named
// asset… anything else may be permanently lost"), which is not what an
// operator configuring the system is doing. The client area keeps them, since
// that is where a person actually sends funds.
export default function Footer({ minimal = false }) {
  const links = legalLinks();

  if (minimal) {
    return (
      <footer className={`${styles.footer} ${styles.minimal}`}>
        <div className={styles.copy}>© 2008 – 2026. {BRAND}</div>
      </footer>
    );
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.legal}>
        {/* These three paragraphs used to say the interface showed "mock data
            for illustration" and that nothing entered here was "stored,
            transmitted, or shared". Both became false once the real backend
            landed: accounts, password hashes and deposit records are written to
            storage, and the deposit addresses are live wallets. Telling people
            their data is not stored while storing it is not a disclaimer worth
            keeping. */}
        <p>
          {BRAND} is not a licensed financial services provider. It is not affiliated with,
          endorsed by, or connected to any real brokerage.
        </p>
        <p>
          Deposit addresses shown here are real blockchain addresses. Cryptocurrency transfers
          are irreversible: send only the named asset, on the named network, to the address shown
          for your deposit. Anything else may be permanently lost.{" "}
          <Link href="/legal/risk-disclosure">Learn more</Link>
        </p>
        <p>
          Your account details are stored by this service. Transactions are verified against
          public blockchain data.
        </p>
      </div>

      <nav className={styles.links}>
        {links.map((l) => (
          <Link key={l.slug} href={`/legal/${l.slug}`} className={styles.link}>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className={styles.support}>
        <a
          className={styles.supportBtn}
          href={whatsappHref("Hi Elvoria, I need help with my account.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon size={16} />
          Chat on WhatsApp
        </a>
        <span className={styles.supportText}>
          Support {SUPPORT_WHATSAPP_DISPLAY} ·{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.link}>
            {SUPPORT_EMAIL}
          </a>
        </span>
      </div>

      <div className={styles.copy}>© 2008 – 2026. {BRAND}</div>
    </footer>
  );
}
