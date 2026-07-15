// ============================================================
//  Deposit address controller (spec §8, §22).
// ============================================================

import { json, readJsonBody } from "../middleware/api-handler.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  listAddresses,
  addAddresses,
  updateAddress,
  setAddressStatus,
  deleteAddress,
} from "../services/deposit-service.js";

export async function listAddressesController(_request, { params }) {
  await requireAdmin();
  return json({ addresses: await listAddresses(params.id) });
}

// Accepts one address or many, so the panel's "Add More" can post the whole
// batch in a single atomic request (spec §8).
export async function addAddressesController(request, { params }) {
  await requireAdmin();
  const body = await readJsonBody(request);

  const input = body.addresses ?? body.address;
  const created = await addAddresses(params.id, input);

  return json({ ok: true, addresses: created }, { status: 201 });
}

export async function updateAddressController(request, { params }) {
  await requireAdmin();
  const body = await readJsonBody(request);

  return json({ ok: true, address: await updateAddress(params.id, body) });
}

export async function setAddressStatusController(request, { params }) {
  await requireAdmin();
  const body = await readJsonBody(request);

  return json({ ok: true, address: await setAddressStatus(params.id, body.status) });
}

export async function deleteAddressController(_request, { params }) {
  await requireAdmin();
  return json(await deleteAddress(params.id));
}
