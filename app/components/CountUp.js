"use client";

import { useEffect, useRef, useState } from "react";

// Animated number counter — rolls up from 0 on mount via requestAnimationFrame.
export default function CountUp({
  value = 0,
  duration = 1200,
  prefix = "",
  suffix = "",
  decimals = 2,
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = value;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const formatted = display.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span translate="no" className="notranslate">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
