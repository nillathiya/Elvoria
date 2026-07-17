"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MoreVertical,
  BarChart3,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  KeyRound,
  Sliders,
  Archive,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  ArrowUpDown,
  List,
  LayoutGrid,
} from "lucide-react";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import Modal from "../../../components/Modal";
import { useApp } from "../../../context/AppContext";
import { typeColor, accountTypes } from "@/lib/demoData";
import styles from "./page.module.css";

const WIZARD_STEPS = ["Mode", "Type", "Configure"];
const DEFAULT_ACCT = {
  mode: "Real",
  type: "Standard",
  platform: "MT5",
  currency: "USD",
  leverage: "1:2000",
};

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "balance", label: "Balance: high to low" },
];

const cx = (...c) => c.filter(Boolean).join(" ");

// Exness-style balance: large integer, smaller decimals + currency code.
function splitBalance(value, currency = "USD") {
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const [intp, dec] = abs.split(".");
  return { intp: `${value < 0 ? "-" : ""}${intp}`, dec, currency };
}

export default function AccountsPage() {
  const router = useRouter();
  const { accounts, addAccount, archiveAccount, showToast } = useApp();
  const [tab, setTab] = useState("Real");
  const [view, setView] = useState("list");
  const [sort, setSort] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [newAcct, setNewAcct] = useState(DEFAULT_ACCT);
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const list = accounts.filter((a) => a.mode === tab);
    if (sort === "oldest") return [...list].reverse();
    if (sort === "balance") return [...list].sort((a, b) => b.balance - a.balance);
    return list;
  }, [accounts, tab, sort]);

  const tabs = [
    { key: "Real", label: "Real" },
    { key: "Demo", label: "Demo" },
  ];

  const openWizard = () => {
    setNewAcct(DEFAULT_ACCT);
    setStep(0);
    setModalOpen(true);
  };

  const handleCreate = () => {
    const acct = addAccount(newAcct);
    setModalOpen(false);
    setTab(newAcct.mode === "Demo" ? "Demo" : "Real");
    showToast(`Account #${acct.id} created successfully`);
  };

  const copyId = (id) => {
    if (navigator?.clipboard) navigator.clipboard.writeText(id).catch(() => {});
    showToast(`Account #${id} copied`);
  };

  const handleArchive = (id) => {
    archiveAccount(id);
    setOpenMenu(null);
    showToast(`Account #${id} archived`);
  };

  const set = (key) => (val) => setNewAcct((s) => ({ ...s, [key]: val }));
  const sortLabel = SORTS.find((s) => s.key === sort)?.label || "Newest";

  return (
    <div className={`${styles.page} animate-in`}>
      {/* The partner banner promised "up to 40% of our revenue" for inviting a
          friend. There is no partner programme, no referral tracking and no
          payout behind it — an earnings offer with nothing under it, on the
          page a new user lands on. The same promise was already removed from
          the sidebar for the same reason. */}

      {/* Header */}
      <header className={styles.head}>
        <h1 className={styles.title}>My accounts</h1>
        <Button variant="secondary" icon={Plus} onClick={openWizard}>
          Open account
        </Button>
      </header>

      {/* Controls: Real/Demo toggle + sort + view */}
      <div className={styles.controls}>
        <div className={styles.segToggle}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={cx(styles.seg, tab === t.key && styles.segActive)}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.controlsRight}>
          <div className={styles.sortWrap} ref={sortRef}>
            <button className={styles.sortBtn} onClick={() => setSortOpen((o) => !o)}>
              <ArrowUpDown size={15} />
              <span>{sortLabel}</span>
              <ChevronDown size={15} className={cx(styles.sortCaret, sortOpen && styles.sortCaretOpen)} />
            </button>
            {sortOpen && (
              <div className={styles.sortMenu}>
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    className={cx(styles.sortItem, sort === s.key && styles.sortItemActive)}
                    onClick={() => {
                      setSort(s.key);
                      setSortOpen(false);
                    }}
                  >
                    {s.label}
                    {sort === s.key && <Check size={15} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.viewToggle}>
            <button
              className={cx(styles.viewBtn, view === "list" && styles.viewActive)}
              onClick={() => setView("list")}
              aria-label="List view"
            >
              <List size={17} />
            </button>
            <button
              className={cx(styles.viewBtn, view === "grid" && styles.viewActive)}
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Accounts */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <Archive size={26} />
          </span>
          <p className={styles.emptyTitle}>No {tab.toLowerCase()} accounts</p>
          <p className={styles.emptySub}>Open your first {tab.toLowerCase()} account to get started.</p>
          <Button icon={Plus} onClick={openWizard}>
            Open account
          </Button>
        </div>
      ) : (
        <div className={cx(view === "list" ? styles.list : styles.grid, "stagger")}>
          {filtered.map((a) => (
            <AccountItem
              key={a.id}
              a={a}
              view={view}
              expanded={expanded === a.id}
              onToggleExpand={() => setExpanded(expanded === a.id ? null : a.id)}
              openMenu={openMenu === a.id}
              onMenu={() => setOpenMenu(openMenu === a.id ? null : a.id)}
              menuRef={openMenu === a.id ? menuRef : null}
              onCopy={() => copyId(a.id)}
              onArchive={() => handleArchive(a.id)}
              onDeposit={() => router.push("/pa/deposit")}
              onWithdraw={() => router.push("/pa/withdraw")}
              onTransfer={() => showToast("Transfer — coming soon", "info")}
              onTrade={() => showToast("Launching web terminal…")}
              onClosePwd={() => {
                setOpenMenu(null);
                showToast("Change password — coming soon", "info");
              }}
              onCloseLev={() => {
                setOpenMenu(null);
                showToast("Change leverage — coming soon", "info");
              }}
            />
          ))}
        </div>
      )}

      {/* Multi-step New Account Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Open account"
        footer={
          <div className={styles.wizardFooter}>
            {step > 0 ? (
              <Button variant="ghost" icon={ChevronLeft} onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
            )}
            {step < WIZARD_STEPS.length - 1 ? (
              <Button icon={ChevronRight} iconRight onClick={() => setStep((s) => s + 1)}>
                Continue
              </Button>
            ) : (
              <Button icon={Check} onClick={handleCreate}>
                Create Account
              </Button>
            )}
          </div>
        }
      >
        {/* Stepper */}
        <div className={styles.stepper}>
          {WIZARD_STEPS.map((label, i) => (
            <div key={label} className={styles.stepItem}>
              <span className={cx(styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone)}>
                {i < step ? <Check size={13} /> : i + 1}
              </span>
              <span className={cx(styles.stepLabel, i === step && styles.stepLabelActive)}>{label}</span>
              {i < WIZARD_STEPS.length - 1 && <span className={styles.stepBar} />}
            </div>
          ))}
        </div>

        {/* Step 1: Mode */}
        {step === 0 && (
          <div className={styles.optionGrid}>
            {[
              { id: "Real", title: "Real Account", desc: "Trade with real funds and withdraw profits." },
              { id: "Demo", title: "Demo Account", desc: "Practice risk-free with $10,000 virtual funds." },
            ].map((o) => (
              <button
                key={o.id}
                className={cx(styles.optionCard, newAcct.mode === o.id && styles.optionActive)}
                onClick={() => set("mode")(o.id)}
              >
                {newAcct.mode === o.id && <span className={styles.optionCheck}><Check size={14} /></span>}
                <span className={styles.optionTitle}>{o.title}</span>
                <span className={styles.optionDesc}>{o.desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Type */}
        {step === 1 && (
          <div className={styles.typeGrid}>
            {accountTypes.map((t) => (
              <button
                key={t.id}
                className={cx(styles.typeCard, newAcct.type === t.id && styles.optionActive)}
                onClick={() => set("type")(t.id)}
              >
                {newAcct.type === t.id && <span className={styles.optionCheck}><Check size={14} /></span>}
                <span className={styles.typeCardName}>
                  <span className={styles.typeCardDot} style={{ background: t.color }} />
                  {t.name}
                </span>
                <span className={styles.typeCardTagline}>{t.tagline}</span>
                <span className={styles.typeSpecs}>
                  <span><b>{t.spread}</b> spread</span>
                  <span><b>{t.commission}</b> commission</span>
                  <span>Min <b>{t.minDeposit}</b></span>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Configure + review */}
        {step === 2 && (
          <div className={styles.configWrap}>
            <div className={styles.segmentField}>
              <span className={styles.fieldLabel}>Platform</span>
              <div className={styles.segment}>
                {["MT5", "MT4"].map((p) => (
                  <button
                    key={p}
                    className={cx(styles.segmentBtn, newAcct.platform === p && styles.segmentActive)}
                    onClick={() => set("platform")(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.configRow}>
              <Input
                type="select"
                label="Currency"
                value={newAcct.currency}
                onChange={(e) => set("currency")(e.target.value)}
                options={["USD", "EUR", "GBP"]}
              />
              <Input
                type="select"
                label="Leverage"
                value={newAcct.leverage}
                onChange={(e) => set("leverage")(e.target.value)}
                options={["1:500", "1:1000", "1:2000", "1:Unlimited"]}
              />
            </div>

            <div className={styles.review}>
              <div className={styles.reviewHead}>
                <ShieldCheck size={16} /> Review
              </div>
              <ReviewRow label="Mode" value={newAcct.mode} />
              <ReviewRow label="Type" value={newAcct.type} />
              <ReviewRow label="Platform" value={newAcct.platform} />
              <ReviewRow label="Currency" value={newAcct.currency} />
              <ReviewRow label="Leverage" value={newAcct.leverage} />
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

function AccountItem({
  a,
  view,
  expanded,
  onToggleExpand,
  openMenu,
  onMenu,
  menuRef,
  onCopy,
  onArchive,
  onDeposit,
  onWithdraw,
  onTransfer,
  onTrade,
  onClosePwd,
  onCloseLev,
}) {
  const color = typeColor[a.type] || "#4d8dff";
  const bal = splitBalance(a.balance, a.currency);
  const isGrid = view === "grid";

  const moreMenu = openMenu && (
    <div className={styles.menu}>
      <button className={styles.menuItem} onClick={onClosePwd}>
        <KeyRound size={16} /> Change Password
      </button>
      <button className={styles.menuItem} onClick={onCloseLev}>
        <Sliders size={16} /> Change Leverage
      </button>
      <button className={cx(styles.menuItem, styles.menuDanger)} onClick={onArchive}>
        <Archive size={16} /> Archive
      </button>
    </div>
  );

  return (
    <div className={cx(styles.card, isGrid && styles.cardGrid)}>
      <div className={styles.cardTop}>
        <div className={styles.cardInfo}>
          <div className={styles.pills}>
            <span className={styles.pill}>{a.mode}</span>
            <span className={styles.pill}>{a.platform}</span>
            <span className={styles.pill} style={{ borderColor: color, color }}>
              {a.type}
            </span>
            <button className={styles.acctId} onClick={onCopy} title="Copy account number">
              # {a.id}
              <Copy size={13} />
            </button>
          </div>

          <div className={styles.balance}>
            <span className={styles.balanceMain}>{bal.intp}</span>
            <span className={styles.balanceDec}>
              .{bal.dec} {bal.currency}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button size="sm" icon={BarChart3} onClick={onTrade}>
            Trade
          </Button>
          <Button size="sm" variant="secondary" icon={ArrowDownToLine} onClick={onDeposit}>
            Deposit
          </Button>
          <Button size="sm" variant="secondary" icon={ArrowUpFromLine} onClick={onWithdraw}>
            Withdraw
          </Button>
          <Button size="sm" variant="secondary" icon={ArrowLeftRight} onClick={onTransfer}>
            Transfer
          </Button>
          <div className={styles.menuWrap} ref={menuRef}>
            <button className={styles.menuBtn} onClick={onMenu} aria-label="Account options">
              <MoreVertical size={18} />
            </button>
            {moreMenu}
          </div>
          <button
            className={cx(styles.expandBtn, expanded && styles.expandOpen)}
            onClick={onToggleExpand}
            aria-label="Toggle details"
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className={styles.details}>
          <Detail label="Leverage" value={a.leverage} />
          <Detail label="Currency" value={a.currency} />
          <Detail label="Server" value={a.server} />
          <Detail label="Equity" value={splitLabel(a.equity, a.currency)} />
          <Detail label="Opened" value={a.created} />
        </div>
      )}
    </div>
  );
}

function splitLabel(value, currency) {
  const b = splitBalance(value, currency);
  return `${b.intp}.${b.dec} ${b.currency}`;
}

function Detail({ label, value }) {
  return (
    <div className={styles.detail}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className={styles.reviewRow}>
      <span className={styles.reviewLabel}>{label}</span>
      <span className={styles.reviewValue}>{value}</span>
    </div>
  );
}
