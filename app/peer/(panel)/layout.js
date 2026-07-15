// Server component: the peer session is checked before any panel markup is
// rendered. guardPeerPage re-reads the peer record, so a peer the admin just
// disabled loses access immediately rather than at session expiry.
import { guardPeerPage } from "@/lib/server/middleware/page-guard";

export const dynamic = "force-dynamic";

export default async function PeerPanelLayout({ children }) {
  await guardPeerPage();
  return children;
}
