import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Logo from "../../components/Logo";
import { getLegalDoc, LEGAL_ORDER, legalLinks } from "@/lib/legalDocs";
import { BRAND } from "@/lib/mockData";
import styles from "./page.module.css";

export function generateStaticParams() {
  return LEGAL_ORDER.map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const doc = getLegalDoc(params.slug);
  return { title: doc ? `${doc.title} — ${BRAND}` : `Not found — ${BRAND}` };
}

export default function LegalPage({ params }) {
  const doc = getLegalDoc(params.slug);
  if (!doc) notFound();

  const links = legalLinks();

  return (
    <div className={styles.wrap}>
      <header className={styles.topbar}>
        <div className={styles.topInner}>
          <Link href="/pa/trading/accounts" className={styles.brand}>
            <Logo variant="mark" size={36} />
          </Link>
          <Link href="/pa/trading/accounts" className={styles.back}>
            <ArrowLeft size={16} /> Back to Personal area
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <article className={styles.doc}>
          <p className={styles.crumbs}>Legal · {doc.title}</p>
          <h1 className={styles.title}>{doc.title}</h1>
          <p className={styles.updated}>Last updated: {doc.updated}</p>

          <div className={styles.note}>
            This is demonstration content for a portfolio project. It is not a real legal
            agreement and does not create any binding obligations.
          </div>

          <p className={styles.intro}>{doc.intro}</p>

          {doc.sections.map((s, i) => (
            <section key={i} className={styles.section}>
              <h2 className={styles.h2}>{s.h}</h2>
              {s.p.map((para, j) => (
                <p key={j} className={styles.para}>
                  {para}
                </p>
              ))}
            </section>
          ))}
        </article>

        <aside className={styles.side}>
          <p className={styles.sideTitle}>Legal documents</p>
          <nav className={styles.sideNav}>
            {links.map((l) => (
              <Link
                key={l.slug}
                href={`/legal/${l.slug}`}
                className={[styles.sideLink, l.slug === params.slug ? styles.sideLinkActive : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
      </main>

      <footer className={styles.foot}>
        © 2026. {BRAND}. Demonstration platform — not a real brokerage.
      </footer>
    </div>
  );
}
