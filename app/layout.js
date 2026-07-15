import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";
import GoogleTranslate from "./components/GoogleTranslate";
import PWARegister from "./components/PWARegister";
import InstallPWA from "./components/InstallPWA";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  metadataBase: new URL("https://elvoria.com"),
  title: "Elvoria — Personal Area",
  description:
    "Elvoria trading platform Personal Area. Manage trading accounts, deposits, withdrawals, performance and more.",
  applicationName: "Elvoria",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Elvoria",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

// Set the saved theme before paint to avoid a flash of the wrong theme.
const themeInit = `(function(){try{var t=localStorage.getItem('elvoria-theme')||localStorage.getItem('dash-theme');document.documentElement.setAttribute('data-theme',(t==='light'||t==='dark')?t:'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <GoogleTranslate />
        {/* The live-chat widget was a keyword-matched bot with canned replies
            that pointed at pages which no longer exist ("Payments & wallet →
            Transfer", "Exness Terminal", a 40% revenue-share partner program).
            It looked like a support channel and answered like one, on pages
            where people send real, irreversible crypto transfers. A fake
            support desk is worse than none, so it is gone rather than
            restyled. */}
        <AppProvider>{children}</AppProvider>
        <PWARegister />
        <InstallPWA />
      </body>
    </html>
  );
}
