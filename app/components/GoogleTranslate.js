"use client";

import { useEffect } from "react";

// Loads the Google Website Translator once, site-wide. The visible language
// picker lives in the Header and drives this via the `googtrans` cookie.
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "bn", label: "বাংলা" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "hi", label: "हिन्दी" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "pt", label: "Português" },
  { code: "th", label: "ไทย" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "zh-CN", label: "简体中文" },
  { code: "uz", label: "O‘zbek" },
];

const INCLUDED = LANGUAGES.map((l) => l.code).join(",");

export function getLangCode() {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "en";
}

export function setLangCode(code) {
  const host = window.location.hostname;
  // Clear any existing translation cookie across domain variants.
  for (const d of ["", host, "." + host]) {
    document.cookie =
      "googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/" + (d ? ";domain=" + d : "");
  }
  if (code && code !== "en") {
    document.cookie = `googtrans=/en/${code};path=/`;
    document.cookie = `googtrans=/en/${code};path=/;domain=${host}`;
  }
  window.location.reload();
}

export default function GoogleTranslate() {
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: INCLUDED, autoDisplay: false },
        "google_translate_element"
      );
    };

    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(s);
  }, []);

  return <div id="google_translate_element" aria-hidden="true" />;
}
