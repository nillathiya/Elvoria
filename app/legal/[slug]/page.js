import Link from "next/link";
import { Mail } from "lucide-react";
import BackLink from "../../components/BackLink";
import { notFound } from "next/navigation";
import Logo from "../../components/Logo";
import WhatsAppIcon from "../../components/WhatsAppIcon";
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
          {/* Was a fixed href to /admin, labelled "Back to Personal area" — it
              said one place and went to another. These pages are reached from
              the client area, from the admin panel and from bare links, so it
              goes back to wherever the reader actually came from. */}
          <BackLink className={styles.back} />
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

          {doc.channels && (
            <div className={styles.channels}>
              {doc.channels.map((c) => (
                <a
                  key={c.type}
                  href={c.href}
                  className={styles.channel}
                  target={c.external ? "_blank" : undefined}
                  rel={c.external ? "noopener noreferrer" : undefined}
                >
                  <span
                    className={[styles.channelIcon, styles[c.type]]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {c.type === "whatsapp" ? (
                      <WhatsAppIcon size={22} />
                    ) : (
                      <Mail size={20} />
                    )}
                  </span>
                  <span className={styles.channelText}>
                    <span className={styles.channelLabel}>{c.label}</span>
                    <span className={styles.channelValue}>{c.value}</span>
                  </span>
                </a>
              ))}
            </div>
          )}

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

          {doc.licence && (
            <section className={styles.licence}>
              <div className={styles.licenceHead}>
                <span className={styles.licenceTitle}>Licensing</span>
                <span className={styles.licenceBadge}>Demonstration only</span>
              </div>
              <dl className={styles.licenceGrid}>
                {doc.licence.rows.map((r) => (
                  <div key={r.k} className={styles.licenceRow}>
                    <dt className={styles.licenceKey}>{r.k}</dt>
                    <dd className={styles.licenceVal}>{r.v}</dd>
                  </div>
                ))}
              </dl>
              <p className={styles.licenceNote}>{doc.licence.note}</p>
            </section>
          )}
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
