"use client";

import { useState } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import styles from "./Input.module.css";

export default function Input({
  type = "text",
  label,
  icon: Icon = null,
  error = null,
  helper = null,
  value,
  onChange,
  placeholder = " ",
  options = [],
  name,
  disabled = false,
  className = "",
  ...props
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const isSelect = type === "select";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  const wrapperClasses = [
    styles.field,
    error ? styles.hasError : "",
    Icon ? styles.hasIcon : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      <div className={styles.control}>
        {Icon && (
          <span className={styles.leadIcon}>
            <Icon size={18} />
          </span>
        )}

        {isSelect ? (
          <>
            <select
              name={name}
              value={value}
              onChange={onChange}
              disabled={disabled}
              className={styles.select}
              {...props}
            >
              {options.map((opt) => (
                <option key={opt.value ?? opt} value={opt.value ?? opt}>
                  {opt.label ?? opt}
                </option>
              ))}
            </select>
            <span className={styles.selectArrow}>
              <ChevronDown size={18} />
            </span>
            {label && <label className={styles.floatingStatic}>{label}</label>}
          </>
        ) : (
          <>
            <input
              type={inputType}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              className={styles.input}
              {...props}
            />
            {label && <label className={styles.floating}>{label}</label>}
            {isPassword && (
              <button
                type="button"
                className={styles.toggle}
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </>
        )}
      </div>

      {error ? (
        <span className={styles.error}>{error}</span>
      ) : helper ? (
        <span className={styles.helper}>{helper}</span>
      ) : null}
    </div>
  );
}
