"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, XCircle, Clock, AlertTriangle } from "lucide-react";
import Input from "../../../components/Input";
import Button from "../../../components/Button";
import Logo from "../../../components/Logo";
import { api } from "@/lib/api";
import styles from "./page.module.css";

// Spec §19: the peer panel contains ONLY peer identity, logout, method select,
// TX hash input, submit, and the result. No statistics, no history, no
// settings — §26.9 makes that the whole feature set.

// Every §17 outcome mapped to something a peer can act on.
const RESULTS = {
  verified: { tone: "ok", icon: ShieldCheck, title: "Transaction verified successfully" },
  pending_confirmations: { tone: "wait", icon: Clock, title: "Waiting for confirmations" },
  already_used: { tone: "warn", icon: AlertTriangle, title: "Transaction already used" },
  rejected: { tone: "bad", icon: XCircle, title: "Transaction rejected" },
  failed: { tone: "bad", icon: XCircle, title: "Verification failed" },
  // "Rejected" is a verdict about the transaction. These two are not — the
  // chain was never asked — but they are still different from each other, and
  // conflating them gives the peer the wrong instruction:
  //
  //   bad_input   the hash itself is wrong. Fix it. Retrying changes nothing.
  //   not_checked our side could not ask. The hash may be fine — keep it.
  bad_input: { tone: "bad", icon: XCircle, title: "That is not a valid TX hash" },
  not_checked: { tone: "warn", icon: AlertTriangle, title: "Could not check this transaction" },
};

// Errors that mean "we could not ask the chain", as opposed to "your input is
// wrong". Anything else that throws is treated as bad input.
const NOT_OUR_FAULT = new Set([
  "NO_ACTIVE_ADDRESS",
  "BLOCKCHAIN_API_UNAVAILABLE",
  "RATE_LIMITED",
  "LOCK_TIMEOUT",
  "INTERNAL_ERROR",
  "STORAGE_CORRUPT",
]);

const REASON_TEXT = {
  TX_NOT_FOUND: "This transaction was not found on the blockchain. Check the hash and the network.",
  TX_ALREADY_USED: "This TX hash has already been verified and cannot be submitted again.",
  WRONG_NETWORK: "This transaction is not on the selected network.",
  WRONG_RECIPIENT: "The funds were not sent to one of our receiving addresses.",
  WRONG_TOKEN_CONTRACT: "This is a different token to the one this method expects.",
  TRANSACTION_FAILED: "This transaction failed on-chain and moved no funds.",
  INSUFFICIENT_CONFIRMATIONS: "The transaction is on-chain but needs more confirmations.",
  INVALID_TRANSFER: "This transaction is not a valid deposit for this method.",
  BLOCKCHAIN_API_UNAVAILABLE:
    "The blockchain verification service is temporarily unavailable. Please try again shortly.",
};

export default function PeerVerifyPage() {
  const router = useRouter();
  const [peer, setPeer] = useState(null);
  const [methods, setMethods] = useState([]);
  const [methodId, setMethodId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/peer/me").then((d) => setPeer(d.peer)).catch(() => {});
    api
      .get("/api/peer/methods")
      .then((d) => {
        setMethods(d.methods);
        if (d.methods.length) setMethodId(d.methods[0].id);
      })
      .catch(() => {});
  }, []);

  const signOut = async () => {
    await api.post("/api/peer/logout").catch(() => {});
    router.replace("/peer");
    router.refresh();
  };

  const submit = async (e) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    try {
      // Only the method and the hash are sent. Amount, sender and recipient are
      // never submitted from here — the server reads them from the chain
      // (§26.14), so there is nothing for this form to get wrong or forge.
      const res = await api.post("/api/peer/verify-tx", { methodId, txHash: txHash.trim() });
      setResult(res);
      if (res.status === "verified") setTxHash("");
    } catch (err) {
      // Nothing that throws here is a verdict on the transaction — the server
      // either could not reach the chain or never got as far as asking it. Only
      // a 200 response carries a real rejection.
      setResult({
        status: NOT_OUR_FAULT.has(err.code) ? "not_checked" : "bad_input",
        reason: err.code,
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const view = result ? RESULTS[result.status] ?? RESULTS.rejected : null;
  const Icon = view?.icon;

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <header className={styles.head}>
          <Logo variant="mark" size={32} />
          <div className={styles.who}>
            <span className={styles.hello}>Welcome</span>
            <span className={styles.name}>{peer?.peerCode ?? "…"}</span>
          </div>
          <Button variant="ghost" size="sm" icon={LogOut} onClick={signOut}>
            Log out
          </Button>
        </header>

        <form className={styles.form} onSubmit={submit}>
          {/* A method is only listed once it has an active receiving address, so
              "no methods are active" was the wrong reason to give — they may
              well be active and simply have nowhere to receive. */}
          {!methods.length ? (
            <p className={styles.note}>
              No deposit method has a receiving address configured yet, so there is nothing to
              verify against. An administrator needs to add one.
            </p>
          ) : (
            <>
              <Input
                type="select"
                label="Transaction method"
                value={methodId}
                onChange={(e) => setMethodId(e.target.value)}
                options={methods.map((m) => ({
                  value: m.id,
                  label: `${m.displayName} · ${m.network}`,
                }))}
              />

              <Input
                label="TX hash"
                value={txHash}
                placeholder="0x…"
                spellCheck={false}
                onChange={(e) => setTxHash(e.target.value)}
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loading}
                disabled={!txHash.trim() || !methodId}
              >
                Submit &amp; Verify
              </Button>
            </>
          )}
        </form>

        {result && (
          <div className={[styles.result, styles[view.tone]].join(" ")}>
            <span className={styles.resultIcon}>
              <Icon size={20} />
            </span>
            <div className={styles.resultBody}>
              <span className={styles.resultTitle}>{view.title}</span>

              {result.status === "pending_confirmations" && (
                <span className={styles.resultText}>
                  {result.confirmations} of {result.requiredConfirmations} confirmations. Submit
                  again shortly.
                </span>
              )}

              {result.status === "verified" && (
                <span className={styles.resultText}>
                  {result.transaction.amount} {result.transaction.asset} from{" "}
                  <code>{result.transaction.sender}</code> · block{" "}
                  {result.transaction.blockNumber}
                </span>
              )}

              {result.status === "already_used" && (
                <span className={styles.resultText}>
                  {result.claimedByYou
                    ? "You have already verified this transaction."
                    : "This transaction has already been verified."}
                </span>
              )}

              {(result.status === "rejected" || result.status === "failed") && (
                <span className={styles.resultText}>
                  {REASON_TEXT[result.reason] ?? result.message ?? "This transaction was rejected."}
                </span>
              )}

              {result.status === "bad_input" && (
                <span className={styles.resultText}>
                  {result.message} A TX hash is 64 hexadecimal characters, usually shown as
                  0x followed by 64 characters. Copy it from the transaction in your wallet or on a
                  block explorer.
                </span>
              )}

              {result.status === "not_checked" && (
                <span className={styles.resultText}>
                  {result.message} Your TX hash has not been rejected — keep it and try again once
                  this is resolved.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
