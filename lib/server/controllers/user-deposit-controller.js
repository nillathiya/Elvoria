// ============================================================
//  Normal user deposit controller (spec §9, §22).
// ============================================================

import { json, readJsonBody } from "../middleware/api-handler.js";
import { requireUser } from "../middleware/auth.js";
import {
  listActiveMethodsPublic,
  createDepositRequest,
  getDepositRequest,
} from "../services/deposit-service.js";

export async function userDepositMethodsController() {
  await requireUser();
  return json({ methods: await listActiveMethodsPublic() });
}

export async function createDepositController(request) {
  const { user } = await requireUser();
  const body = await readJsonBody(request);

  // Spec §9: the backend picks the address. The client sends only a method id
  // — an address supplied by the client would be trusted input (§26.14).
  const deposit = await createDepositRequest({ userId: user.id, methodId: body.methodId });

  return json({ ok: true, deposit }, { status: 201 });
}

export async function getDepositController(_request, { params }) {
  const { user } = await requireUser();

  // Scoped to the caller so one user cannot read another's deposit request.
  return json({ deposit: await getDepositRequest(params.id, user.id) });
}
