// Pass-through. /admin is the public login page; every protected page lives
// under the (panel) route group, whose layout applies the server-side guard.
export default function AdminLayout({ children }) {
  return children;
}
