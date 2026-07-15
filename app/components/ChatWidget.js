"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, ThumbsUp, Send, ChevronDown } from "lucide-react";
import { BRAND } from "@/lib/mockData";
import styles from "./ChatWidget.module.css";

const MAX = 400;

function nowTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// Simple canned assistant — keyword matched, demo only.
function botReply(text) {
  const t = text.toLowerCase();
  if (/\b(hi|hello|hey|namaste|salam)\b/.test(t)) return "Hello! 👋 How can I help you today?";
  if (/deposit|fund|add money|top ?up/.test(t))
    return "You can fund your account from Payments & wallet → Deposit. Cards, crypto and e-wallets are supported, most of them instant.";
  if (/withdraw/.test(t))
    return "To withdraw, open Payments & wallet → Withdrawal. Funds go back to your original payment method.";
  if (/transfer/.test(t))
    return "Use Payments & wallet → Transfer to move funds between your own accounts instantly.";
  if (/account|open|standard|pro/.test(t))
    return "Open a new account from My accounts → Open account. Pick Real or Demo, choose a type, and you're ready.";
  if (/terminal|trade|chart|mt5|mt4/.test(t))
    return "Launch the Exness Terminal from the apps menu or the sidebar to trade with live charts and one-click orders.";
  if (/partner|refer|commission|affiliate/.test(t))
    return "Join our partner program and earn up to 40% revenue share — see the “Become a partner” banner on My accounts.";
  if (/verif|kyc|document/.test(t))
    return "You can complete verification from Profile → Verification. Have your ID and proof of address ready.";
  return "Thanks for your message! A support specialist will follow up shortly. Meanwhile you can explore Deposit, Withdrawal or the Terminal from the sidebar.";
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef(null);
  const replyTimer = useRef(null);

  // Seed the greeting the first time the panel opens.
  useEffect(() => {
    if (open && messages.length === 0) {
      setStarted(nowTime());
      setMessages([
        {
          id: 1,
          from: "bot",
          text: `Welcome to ${BRAND} 👋 Great to see you here! How can I help you today?`,
        },
      ]);
    }
  }, [open, messages.length]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing, open]);

  useEffect(() => () => clearTimeout(replyTimer.current), []);

  const send = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: Date.now(), from: "user", text }]);
    setInput("");
    setTyping(true);
    replyTimer.current = setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, from: "bot", text: botReply(text) }]);
      setTyping(false);
    }, 900);
  };

  return (
    <div className={styles.root}>
      {open && (
        <div className={styles.panel} role="dialog" aria-label={`${BRAND} Assistant`}>
          <header className={styles.head}>
            <span className={styles.title}>{BRAND} Assistant</span>
            <div className={styles.headActions}>
              <button className={styles.headBtn} aria-label="Helpful"><ThumbsUp size={17} /></button>
              <button className={styles.headBtn} aria-label="Close chat" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </header>

          <div className={styles.body} ref={bodyRef}>
            {started && <div className={styles.divider}><span>Chat started at {started}</span></div>}

            {messages.map((m) =>
              m.from === "bot" ? (
                <div key={m.id} className={styles.botRow}>
                  <span className={styles.avatar} aria-hidden="true">🤖</span>
                  <div>
                    <div className={styles.botBubble}>{m.text}</div>
                    <div className={styles.meta}>Bot · just now</div>
                  </div>
                </div>
              ) : (
                <div key={m.id} className={styles.userRow}>
                  <div className={styles.userBubble}>{m.text}</div>
                </div>
              )
            )}

            {typing && (
              <div className={styles.botRow}>
                <span className={styles.avatar} aria-hidden="true">🤖</span>
                <div className={styles.typing}>
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          <form className={styles.inputBar} onSubmit={send}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX))}
              placeholder="Write your message"
              maxLength={MAX}
              aria-label="Message"
            />
            <span className={styles.counter}>{input.length}/{MAX}</span>
            <button className={styles.sendBtn} type="submit" aria-label="Send" disabled={!input.trim()}>
              <Send size={17} />
            </button>
          </form>
        </div>
      )}

      <button
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Minimize chat" : "Open live chat"}
      >
        {open ? <ChevronDown size={24} /> : <MessageSquare size={22} />}
      </button>
    </div>
  );
}
