// Web app manifest (Next.js metadata route → served at /manifest.webmanifest).
export default function manifest() {
  return {
    name: "Elvoria — Trading Platform",
    short_name: "Elvoria",
    description:
      "Elvoria trading platform personal area — manage accounts, deposits, withdrawals and performance.",
    start_url: "/pa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Maskable art sits inside the safe zone so platform circle-crops don't clip it.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
