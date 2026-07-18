// ============================================================
//  Server-side page guards for App Router layouts.
//
//  The API middleware throws typed errors for JSON responses; a page needs a
//  redirect instead. Guarding in a server layout means the protected markup is
//  never sent to an unauthenticated browser at all — unlike a client-side
//  check, which ships the page and then hides it.
// ============================================================

import { redirect } from "next/navigation";
import { requireAdmin, requirePeer, requireUser } from "./auth.js";

export async function guardAdminPage() {
  try {
    return await requireAdmin();
  } catch {
    redirect("/admin");
  }
}

export async function guardPeerPage() {
  try {
    return await requirePeer();
  } catch {
    redirect("/peer");
  }
}

export async function guardUserPage() {
  try {
    return await requireUser();
  } catch {
    redirect("/login");
  }
}
