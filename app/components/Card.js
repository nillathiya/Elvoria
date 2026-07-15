import styles from "./Card.module.css";

export default function Card({
  children,
  variant = "default",
  padding = "md",
  hoverable = false,
  className = "",
  as: Tag = "div",
  ...props
}) {
  const classes = [
    styles.card,
    styles[variant],
    styles[`pad-${padding}`],
    hoverable ? styles.hoverable : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}
