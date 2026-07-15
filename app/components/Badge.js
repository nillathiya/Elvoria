import styles from "./Badge.module.css";

export default function Badge({
  children,
  variant = "neutral",
  size = "sm",
  dot = false,
  icon: Icon = null,
  className = "",
}) {
  const classes = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {dot && <span className={styles.dot} />}
      {Icon && <Icon size={size === "sm" ? 12 : 14} />}
      {children}
    </span>
  );
}
