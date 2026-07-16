// ============================================================
//  Deposit service (spec §7, §8, §9).
//  Methods, their receiving addresses, and deposit-request assignment.
// ============================================================

import { randomInt } from "crypto";
import { depositMethodRepository } from "../repositories/deposit-method-repository.js";
import { depositAddressRepository } from "../repositories/deposit-address-repository.js";
import { depositRequestRepository } from "../repositories/deposit-request-repository.js";
import { transactionRepository } from "../repositories/transaction-repository.js";
import { networkFor, verifierFor, ASSET_TYPES } from "../config/blockchain-config.js";
import { normalizeAddress } from "../utils/address-normalizer.js";
import { assertNonEmpty, assertOneOf } from "../utils/validation.js";
import { ValidationError, NotFoundError, ConflictError, AppError } from "../utils/errors.js";

const STATUSES = ["active", "inactive"];
const METHOD_ID = /^[a-z0-9_]{3,40}$/;

// ---- methods (spec §7) -------------------------------------

function validateMethodInput(input, { partial = false } = {}) {
  const out = {};

  if (input.name !== undefined || !partial) out.name = assertNonEmpty(input.name, "Method name");
  if (input.displayName !== undefined) out.displayName = String(input.displayName).trim();

  if (input.network !== undefined || !partial) {
    const network = networkFor(input.network);
    if (!network) throw new ValidationError(`Unsupported network: ${input.network}`);
    out.network = network.id;
  }

  if (input.assetType !== undefined || !partial) {
    out.assetType = assertOneOf(input.assetType, ASSET_TYPES, "Asset type");
  }

  if (input.symbol !== undefined || !partial) out.symbol = assertNonEmpty(input.symbol, "Symbol").toUpperCase();

  if (input.verifier !== undefined || !partial) {
    const verifier = verifierFor(input.verifier);
    if (!verifier) throw new ValidationError(`Unknown verifier: ${input.verifier}`);
    out.verifier = input.verifier;
  }

  if (input.requiredConfirmations !== undefined || !partial) {
    const n = Number(input.requiredConfirmations);
    if (!Number.isInteger(n) || n < 0 || n > 1000) {
      throw new ValidationError("Required confirmations must be an integer between 0 and 1000");
    }
    out.requiredConfirmations = n;
  }

  if (input.status !== undefined) out.status = assertOneOf(input.status, STATUSES, "Status");

  // Amounts stay strings end to end (spec §18): a float would silently lose
  // precision on 18-decimal token values.
  if (input.minAmount !== undefined && input.minAmount !== null && input.minAmount !== "") {
    const value = String(input.minAmount).trim();
    if (!/^\d+(\.\d+)?$/.test(value)) throw new ValidationError("Minimum amount must be a decimal string");
    out.minAmount = value;
  } else if (input.minAmount === null || input.minAmount === "") {
    out.minAmount = null;
  }

  return out;
}

// Token vs native rules, checked against the merged record so a PATCH that
// flips assetType cannot leave a token method without a contract.
function validateAssetShape(method) {
  if (method.assetType === "token") {
    if (!method.contractAddress) {
      throw new ValidationError("A token method requires a token contract address");
    }
    // Normalized here so §16's contract comparison is exact at verify time.
    method.contractAddress = normalizeAddress(method.contractAddress, method.network);

    const decimals = Number(method.decimals);
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
      throw new ValidationError("Token decimals must be an integer between 0 and 36");
    }
    method.decimals = decimals;
  } else {
    // A native method must not carry a contract — it would be meaningless and
    // could be mistaken for a token check later.
    method.contractAddress = null;
    method.decimals = method.decimals === undefined ? null : Number(method.decimals);
  }

  const verifier = verifierFor(method.verifier);
  if (verifier.network !== method.network || verifier.assetType !== method.assetType) {
    throw new ValidationError(
      `Verifier ${method.verifier} handles ${verifier.network}/${verifier.assetType}, ` +
        `not ${method.network}/${method.assetType}`
    );
  }

  return method;
}

// Admin view. Carries the active-address count because "active" alone does not
// mean a method is usable: listActiveMethodsPublic also requires at least one
// active address, so a method can read as active here and still be invisible to
// every user and peer. Without this count the admin has no way to see why.
export async function listMethods() {
  const [methods, addresses] = await Promise.all([
    depositMethodRepository.all(),
    depositAddressRepository.all(),
  ]);

  return methods.map((m) => {
    const mine = addresses.filter((a) => a.methodId === m.id);
    return {
      ...m,
      addressCount: mine.length,
      activeAddressCount: mine.filter((a) => a.status === "active").length,
    };
  });
}

// What a normal user or peer is allowed to see. The verifier id is internal.
function toPublicMethod(method) {
  return {
    id: method.id,
    name: method.name,
    displayName: method.displayName || method.name,
    network: method.network,
    symbol: method.symbol,
    assetType: method.assetType,
    requiredConfirmations: method.requiredConfirmations,
    minAmount: method.minAmount ?? null,
  };
}

// A method is only offerable if it can actually take a deposit, which means it
// needs at least one active receiving address. Listing one without an address
// advertises a route that always fails: the user picks it, the server has
// nothing to assign, and they get a 503 they can do nothing about. Same for a
// peer, whose verification could never match a recipient.
//
// Admins still see every method through listMethods() — they are the ones who
// have to configure the addresses.
export async function listActiveMethodsPublic() {
  const [methods, addresses] = await Promise.all([
    depositMethodRepository.listActive(),
    depositAddressRepository.find((a) => a.status === "active"),
  ]);

  const usable = new Set(addresses.map((a) => a.methodId));

  return methods.filter((m) => usable.has(m.id)).map(toPublicMethod);
}

export async function createMethod(input) {
  const id = String(input.id || "").trim().toLowerCase();
  if (!METHOD_ID.test(id)) {
    throw new ValidationError("Method ID must be 3-40 chars: lowercase letters, numbers, underscore");
  }

  const base = validateMethodInput(input);
  const method = validateAssetShape({
    ...base,
    id,
    contractAddress: input.contractAddress ?? null,
    decimals: input.decimals,
    status: base.status || "active",
  });

  try {
    return await depositMethodRepository.create(method);
  } catch (err) {
    if (err.code === "DUPLICATE") throw new ConflictError(`Method ${id} already exists`);
    throw err;
  }
}

export async function updateMethod(id, input) {
  const existing = await depositMethodRepository.findById(id);
  if (!existing) throw new NotFoundError("Deposit method not found");

  const patch = validateMethodInput(input, { partial: true });
  const merged = validateAssetShape({
    ...existing,
    ...patch,
    contractAddress: input.contractAddress !== undefined ? input.contractAddress : existing.contractAddress,
    decimals: input.decimals !== undefined ? input.decimals : existing.decimals,
  });

  // The network is what every stored address was validated against; changing
  // it would silently orphan them into a different address format.
  if (merged.network !== existing.network) {
    const addresses = await depositAddressRepository.listByMethod(id);
    if (addresses.length) {
      throw new ConflictError(
        "Cannot change the network of a method that already has addresses. " +
          "Create a new method instead."
      );
    }
  }

  return depositMethodRepository.update(id, merged);
}

export async function setMethodStatus(id, status) {
  assertOneOf(status, STATUSES, "Status");

  const updated = await depositMethodRepository.update(id, { status });
  if (!updated) throw new NotFoundError("Deposit method not found");
  return updated;
}

// ---- addresses (spec §8) -----------------------------------

export async function listAddresses(methodId) {
  const method = await depositMethodRepository.findById(methodId);
  if (!method) throw new NotFoundError("Deposit method not found");
  return depositAddressRepository.listByMethod(methodId);
}

// Spec §8: admin can add one address or many ("Add More"), so this takes a
// list either way.
export async function addAddresses(methodId, addresses) {
  const method = await depositMethodRepository.findById(methodId);
  if (!method) throw new NotFoundError("Deposit method not found");

  const list = Array.isArray(addresses) ? addresses : [addresses];
  if (!list.length) throw new ValidationError("At least one address is required");

  // Validate every address against the method's network BEFORE writing any, so
  // a bad entry in the batch cannot leave half of them saved.
  const normalized = list.map((entry) => {
    const raw = typeof entry === "string" ? entry : entry?.address;
    return {
      address: normalizeAddress(raw, method.network),
      status: typeof entry === "object" && entry?.status ? assertOneOf(entry.status, STATUSES, "Status") : "active",
    };
  });

  const seen = new Set();
  for (const { address } of normalized) {
    if (seen.has(address)) throw new ValidationError(`Duplicate address in request: ${address}`);
    seen.add(address);
  }

  // One atomic write for the whole batch, with the existing-address check
  // inside the lock so two concurrent batches cannot both add the same one.
  return depositAddressRepository.mutate((rows) => {
    for (const { address } of normalized) {
      if (rows.some((r) => r.methodId === methodId && r.address === address)) {
        throw new ConflictError(`Address already configured for this method: ${address}`);
      }
    }

    const created = normalized.map(({ address, status }) => ({
      id: `address_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      methodId,
      address,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return { rows: [...rows, ...created], value: created };
  });
}

export async function updateAddress(id, input) {
  const existing = await depositAddressRepository.findById(id);
  if (!existing) throw new NotFoundError("Address not found");

  const method = await depositMethodRepository.findById(existing.methodId);
  if (!method) throw new NotFoundError("Deposit method not found");

  const patch = {};
  if (input.address !== undefined) patch.address = normalizeAddress(input.address, method.network);
  if (input.status !== undefined) patch.status = assertOneOf(input.status, STATUSES, "Status");

  // Rewriting an address that a request already advertised would send the user
  // to a wallet the record does not match. Disable it and add a new one.
  if (patch.address && patch.address !== existing.address && (await isAddressInUse(id))) {
    throw new ConflictError(
      "This address is already assigned to a deposit request and cannot be changed. " +
        "Disable it and add a new address instead."
    );
  }

  return depositAddressRepository.update(id, patch);
}

export async function setAddressStatus(id, status) {
  assertOneOf(status, STATUSES, "Status");

  const updated = await depositAddressRepository.update(id, { status });
  if (!updated) throw new NotFoundError("Address not found");
  return updated;
}

// Spec §8: "delete unused address where safe" — safe means nothing references
// it, so deleting cannot orphan a request or a verified transaction's audit
// trail.
async function isAddressInUse(id) {
  const address = await depositAddressRepository.findById(id);
  if (!address) return false;

  const requests = await depositRequestRepository.find((r) => r.assignedAddressId === id);
  if (requests.length) return true;

  const transactions = await transactionRepository.find(
    (t) => t.recipient && t.recipient === address.address && t.methodId === address.methodId
  );
  return transactions.length > 0;
}

export async function deleteAddress(id) {
  const address = await depositAddressRepository.findById(id);
  if (!address) throw new NotFoundError("Address not found");

  if (await isAddressInUse(id)) {
    throw new ConflictError(
      "This address is referenced by a deposit request or a verified transaction. " +
        "Disable it instead of deleting it.",
      "ADDRESS_IN_USE"
    );
  }

  await depositAddressRepository.remove(id);
  return { ok: true };
}

// ---- deposit requests + random assignment (spec §9) --------

export async function createDepositRequest({ userId, methodId }) {
  const method = await depositMethodRepository.findById(methodId);
  if (!method) throw new NotFoundError("Deposit method not found");
  if (method.status !== "active") throw new ValidationError("This deposit method is not available");

  // Spec §9: an existing open request keeps its address. Without this, every
  // page refresh would roll a new address for the same pending deposit.
  const open = await depositRequestRepository.findOpenForUserAndMethod(userId, methodId);
  if (open) return toPublicRequest(open, method);

  const active = await depositAddressRepository.listActiveByMethod(methodId);
  if (!active.length) {
    throw new AppError("No receiving address is configured for this method yet", {
      status: 503,
      code: "NO_ACTIVE_ADDRESS",
    });
  }

  // crypto.randomInt, not Math.random: it is uniform and unpredictable, so the
  // next address cannot be guessed from previous assignments.
  const chosen = active[randomInt(active.length)];

  // The address is copied onto the request, not just referenced, so the record
  // still shows what the user was actually told even if the address is later
  // edited or removed.
  const request = await depositRequestRepository.create({
    userId,
    methodId,
    assignedAddressId: chosen.id,
    assignedAddress: chosen.address,
    status: "awaiting_txhash",
  });

  return toPublicRequest(request, method);
}

export async function getDepositRequest(id, userId) {
  const request = await depositRequestRepository.findById(id);

  // A missing request and someone else's request answer identically, so ids
  // cannot be probed to learn what exists.
  if (!request || request.userId !== userId) throw new NotFoundError("Deposit request not found");

  const method = await depositMethodRepository.findById(request.methodId);
  return toPublicRequest(request, method);
}

function toPublicRequest(request, method) {
  return {
    id: request.id,
    methodId: request.methodId,
    method: method ? toPublicMethod(method) : null,
    assignedAddress: request.assignedAddress,
    status: request.status,
    createdAt: request.createdAt,
  };
}
