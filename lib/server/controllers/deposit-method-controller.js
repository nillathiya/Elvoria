// ============================================================
//  Deposit method controller (spec §7, §22).
// ============================================================

import { json, readJsonBody } from "../middleware/api-handler.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  listMethods,
  createMethod,
  updateMethod,
  setMethodStatus,
} from "../services/deposit-service.js";

export async function listMethodsController() {
  await requireAdmin();
  return json({ methods: await listMethods() });
}

export async function createMethodController(request) {
  await requireAdmin();
  const body = await readJsonBody(request);

  return json({ ok: true, method: await createMethod(body) }, { status: 201 });
}

export async function updateMethodController(request, { params }) {
  await requireAdmin();
  const body = await readJsonBody(request);

  return json({ ok: true, method: await updateMethod(params.id, body) });
}

export async function setMethodStatusController(request, { params }) {
  await requireAdmin();
  const body = await readJsonBody(request);

  return json({ ok: true, method: await setMethodStatus(params.id, body.status) });
}
