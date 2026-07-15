"use client";

import styles from "./Button.module.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon: Icon = null,
  iconRight = false,
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  ...props
}) {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    loading ? styles.loading : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {!loading && Icon && !iconRight && <Icon size={size === "sm" ? 15 : 18} />}
      {children && <span className={styles.label}>{children}</span>}
      {!loading && Icon && iconRight && <Icon size={size === "sm" ? 15 : 18} />}
    </button>
  );
}
