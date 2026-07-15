import { BRAND } from "@/lib/config";

// Three gold-on-transparent brand assets live in /public:
//
//   /logo-lockup.png — the full lockup (emblem + ELVORIA wordmark + tagline), pre-cropped
//                      to the artwork and exported at 320×257 (~95 KB). This is the asset
//                      the UI renders. Prefer it over the master below: it carries no
//                      transparent padding, so it needs no offset maths, and it is ~88%
//                      lighter while still ~3× our largest on-screen size.
//   /logo.png        — the 1055×1491 master the lockup is derived from. Kept as the source
//                      of truth for re-exports; too heavy (761 KB) to ship to the browser.
//   /icon-192.png    — the emblem on its own, square and 43 KB. Used where the lockup is
//                      too wide to read, i.e. the 76px collapsed sidebar rail.
//
// The lockup bakes the wordmark and tagline into pixels, so it needs roughly 80px of
// height before the tagline stops being a smudge — size it generously or use the mark.
const LOCKUP_ASPECT = 320 / 257; // ≈1.245 (w/h)

// `size` is the rendered height; width follows the artwork's aspect ratio.
export default function Logo({ variant = "lockup", size = 40 }) {
  const isMark = variant === "mark";

  return (
    <span
      role="img"
      aria-label={`${BRAND} logo`}
      style={{
        display: "inline-block",
        width: isMark ? size : Math.round(size * LOCKUP_ASPECT),
        height: size,
        flexShrink: 0,
        backgroundImage: `url(${isMark ? "/icon-192.png" : "/logo-lockup.png"})`,
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
