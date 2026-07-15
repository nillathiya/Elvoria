// Pass-through. /peer is the public login page; the panel lives under the
// (panel) route group, which applies the server-side peer guard.
export default function PeerLayout({ children }) {
  return children;
}
