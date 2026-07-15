// Server component: the user panel had NO authentication at all — anyone
// could open /pa directly. The session is now checked here, before any panel
// markup is rendered or sent.
import { guardUserPage } from "@/lib/server/middleware/page-guard";
import UserShell from "../components/UserShell";

export const dynamic = "force-dynamic"; // auth state must never be cached

export default async function PersonalAreaLayout({ children }) {
  await guardUserPage();

  return <UserShell>{children}</UserShell>;
}
