"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./Modal.module.css";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer = null,
  size = "md",
}) {
  // createPortal needs a real document, which does not exist during the server
  // render. Mounting first keeps SSR and the first client render agreeing.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const overlay = (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={[styles.modal, styles[size]].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );

  // Rendered into <body>, not where it was written.
  //
  // The overlay is position: fixed and expects to cover the viewport, but every
  // page sits in a .animate-in wrapper, and that animation ends on
  // transform: translateY(0) with fill-mode: both — so the transform stays
  // applied forever. Any transformed ancestor becomes the containing block for
  // a fixed child, so the backdrop was sizing itself to the page container: it
  // covered the middle of the screen and left the profile bar and the area
  // below it untouched.
  //
  // Portalling puts it outside all of that, which is what a modal wants anyway.
  return createPortal(overlay, document.body);
}
