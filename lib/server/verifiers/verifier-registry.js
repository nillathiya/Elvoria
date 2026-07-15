// ============================================================
//  Verifier registry (spec §13).
//
//  A method names its verifier by id; this is the only place that resolves
//  one. There is deliberately no fallback and no generic verifier: a method
//  whose verifier is unknown fails closed rather than being waved through by
//  something that trusts the submitted values (§13, §26.17).
// ============================================================

import * as bscNative from "./bsc/native-verifier.js";
import * as bscToken from "./bsc/token-verifier.js";
import * as ethNative from "./ethereum/native-verifier.js";
import * as ethToken from "./ethereum/token-verifier.js";
import * as tronNative from "./tron/native-verifier.js";
import * as tronToken from "./tron/token-verifier.js";
import * as btc from "./bitcoin/btc-verifier.js";
import { AppError } from "../utils/errors.js";

const REGISTRY = new Map(
  [bscNative, bscToken, ethNative, ethToken, tronNative, tronToken, btc].map((m) => [m.id, m])
);

export function getVerifier(id) {
  const verifier = REGISTRY.get(id);
  if (!verifier) {
    throw new AppError(`No verifier registered for "${id}"`, {
      status: 500,
      code: "VERIFIER_NOT_FOUND",
    });
  }
  return verifier;
}

export function listVerifierIds() {
  return [...REGISTRY.keys()];
}
