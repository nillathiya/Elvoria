"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

// Site-wide "Install app" affordance.
// - Chrome / Edge / Android: uses the beforeinstallprompt event.
// - iOS Safari: shows an "Add to Home Screen" hint (no programmatic install exists).
export default function InstallPWA() {
  const [deferred, setDeferred] = useState(null);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standalone) return; // already installed

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setDeferred(null);
      setIosHint(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari doesn't fire beforeinstallprompt — detect and hint instead.
    const ua = window.navigator.userAgent || "";
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (isIOS && isSafari) {
      const seen = (() => {
        try { return localStorage.getItem("elvoria-ios-install-hint") === "1"; } catch { return false; }
      })();
      if (!seen) setIosHint(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (dismissed) return null;

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch {}
    setDeferred(null);
  };

  const close = () => {
    setDismissed(true);
    if (iosHint) {
      try { localStorage.setItem("elvoria-ios-install-hint", "1"); } catch {}
    }
  };

  if (deferred) {
    return (
      <div className="pwa-install">
        <button className="pwa-install-btn" onClick={install}>
          <Download size={16} /> Install app
        </button>
        <button className="pwa-install-close" onClick={close} aria-label="Dismiss">
          <X size={15} />
        </button>
      </div>
    );
  }

  if (iosHint) {
    return (
      <div className="pwa-install pwa-install--ios">
        <span className="pwa-install-hint">
          <Share size={15} /> Install: Share → <b>Add to Home Screen</b>
        </span>
        <button className="pwa-install-close" onClick={close} aria-label="Dismiss">
          <X size={15} />
        </button>
      </div>
    );
  }

  return null;
}
