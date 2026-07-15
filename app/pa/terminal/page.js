import { redirect } from "next/navigation";

// The terminal now lives at its own full-screen route (like Exness /webtrading).
export default function TerminalRedirect() {
  redirect("/webtrading");
}
