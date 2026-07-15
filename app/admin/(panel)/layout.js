// Server component: the admin session is checked here, before any panel markup
// is rendered or sent. An unauthenticated request is redirected to the login
// page and never receives the page at all.
import { guardAdminPage } from "@/lib/server/middleware/page-guard";
import AdminShell from "@/app/components/AdminShell";

export const dynamic = "force-dynamic"; // auth state must never be cached

export default async function AdminPanelLayout({ children }) {
  await guardAdminPage();

  return <AdminShell>{children}</AdminShell>;
}
