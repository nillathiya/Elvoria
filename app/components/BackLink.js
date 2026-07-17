"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// "Back" should mean back.
//
// A legal page is reachable from the client area, from the admin panel, and
// from a bare link someone was sent — so no fixed href can be right for all
// three. A hardcoded one sent everybody to the same place regardless of where
// they actually came from.
//
// history.back() returns them wherever they were. `fallback` covers the case
// where there is no history to go back to: opened in a new tab, or pasted
// straight into the address bar.
export default function BackLink({ fallback = "/pa", className, label = "Back" }) {
  const router = useRouter();

  const goBack = () => {
    // window.history.length is 1 for a fresh tab; back() there does nothing and
    // the user is stranded on the page they wanted to leave.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button type="button" className={className} onClick={goBack}>
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
