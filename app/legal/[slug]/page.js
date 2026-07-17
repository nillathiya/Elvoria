import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Logo from "../../components/Logo";
import { getLegalDoc, LEGAL_ORDER, legalLinks } from "@/lib/legalDocs";
import { BRAND } from "@/lib/config";
import styles from "./page.module.css";

export function generateStaticParams() {
  return LEGAL_ORDER.map((slug) => ({ slug }));
}

// params is a Promise since Next 15. Reading .slug off it without awaiting
// gave undefined, so getLegalDoc found nothing and every legal page 404'd —
// all twelve of them, including the ones the footer links to on every screen.
// The API routes were handled at the Next 16 upgrade; this page was not,
// because only the API was tested.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  return { title: doc ? `${doc.title} — ${BRAND}` : `Not found — ${BRAND}` };
}

export default async function LegalPage({ params }) {
  const { slug } = await params;

  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  const links = legalLinks();

  return (
    <div className={styles.wrap}>
      <header className={styles.topbar}>
        <div className={styles.topInner}>
          <Link href="/pa" className={styles.brand}>
            <Logo variant="mark" size={36} />
          </Link>
          <Link href="/pa" className={styles.back}>
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
                className={[styles.sideLink, l.slug === slug ? styles.sideLinkActive : ""]
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
