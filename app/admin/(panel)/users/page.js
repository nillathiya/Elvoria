"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, UserRound } from "lucide-react";
import Card from "../../../components/Card";
import Input from "../../../components/Input";
import Badge from "../../../components/Badge";
import { useApp } from "../../../context/AppContext";
import { api } from "@/lib/api";
import styles from "../peers/page.module.css";

// Spec §2.1: "view normal registered users". Viewing is the whole feature —
// there is deliberately no create, edit, disable or delete here. Users exist
// only by registering themselves (§2.3), and no screen or API returns a
// password hash (§3.3).
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

export default function AdminUsersPage() {
  const { showToast } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/users")
      .then((d) => setUsers(d.users))
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  // Filtering client-side: the list is small, and unlike transactions there is
  // no server-side search endpoint to keep in step.
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)
    );
  }, [users, q]);

  return (
    <div className={`${styles.page} animate-in`}>
      <header className={styles.head}>
        <h1 className={styles.title}>Users</h1>
        <p className={styles.sub}>
          Everyone who has registered. This view is read-only — users are not created or
          managed here, and a peer is a separate kind of account entirely.
        </p>
      </header>

      <Card className={styles.formCard} style={{ marginBottom: 20 }}>
        <Input
          placeholder="Search username or email"
          icon={Search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Card>

      <Card padding="sm">
        <h2 className={styles.sectionTitle}>
          <UserRound size={18} /> Registered users{" "}
          <Badge variant="neutral" size="sm">{shown.length}</Badge>
        </h2>

        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : !users.length ? (
          <p className={styles.empty}>Nobody has registered yet.</p>
        ) : !shown.length ? (
          <p className={styles.empty}>No users match “{q}”.</p>
        ) : (
          <div className={styles.list}>
            {shown.map((u) => (
              <div key={u.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <span className={styles.rowName}>{u.username}</span>
                  <span className={styles.rowSub}>{u.email}</span>
                  <span className={styles.rowSub}>
                    Joined {fmtDate(u.createdAt)} · {u.depositRequests}{" "}
                    {u.depositRequests === 1 ? "deposit request" : "deposit requests"}
                  </span>
                </div>
                <Badge variant={u.status === "active" ? "success" : "neutral"} size="sm">
                  {u.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
