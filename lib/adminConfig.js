// ============================================================
//  Admin — dummy credentials & auth state (frontend-only demo)
//  No database. Edit ADMIN_CREDENTIALS below to change the login.
// ============================================================

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

const AUTH_KEY = "elvoria-admin-auth";
const PASS_KEY = "elvoria-admin-pass";
// Pre-rebrand keys — still read so existing sessions/passwords keep working.
const LEGACY_AUTH_KEY = "dash-admin-auth";
const LEGACY_PASS_KEY = "dash-admin-pass";

// Current admin password (a change-password override in localStorage wins).
export function getAdminPassword() {
  if (typeof window === "undefined") return ADMIN_CREDENTIALS.password;
  try {
    return (
      window.localStorage.getItem(PASS_KEY) ||
      window.localStorage.getItem(LEGACY_PASS_KEY) ||
      ADMIN_CREDENTIALS.password
    );
  } catch {
    return ADMIN_CREDENTIALS.password;
  }
}

export function setAdminPassword(pass) {
  try {
    window.localStorage.setItem(PASS_KEY, pass);
  } catch {}
}

export function checkAdminLogin(username, password) {
  return (
    String(username).trim().toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase() &&
    password === getAdminPassword()
  );
}

export function isAdminAuthed() {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(AUTH_KEY) === "1" ||
      window.localStorage.getItem(LEGACY_AUTH_KEY) === "1"
    );
  } catch {
    return false;
  }
}

export function setAdminAuthed(v) {
  try {
    if (v) {
      window.localStorage.setItem(AUTH_KEY, "1");
    } else {
      // Clear both so a stale legacy key can't keep an admin signed in.
      window.localStorage.removeItem(AUTH_KEY);
      window.localStorage.removeItem(LEGACY_AUTH_KEY);
    }
  } catch {}
}
