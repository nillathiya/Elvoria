// ============================================================
//  Global consumed TX hash registry.
//  One entry per successfully verified TX hash, across all peers and methods.
//  This file is what makes "the same TX hash can never be used twice" true.
// ============================================================

import { createRepository } from "./base-repository.js";

const repo = createRepository("consumedTxHashes", { idPrefix: "consumed", unique: ["registryKey"] });

export const consumedTxHashRepository = {
  ...repo,

  // registryKey is the network-namespaced canonical hash from normalizeTxHash.
  findByRegistryKey: (registryKey) => repo.findOne((c) => c.registryKey === registryKey),

  async isConsumed(registryKey) {
    return Boolean(await repo.findOne((c) => c.registryKey === registryKey));
  },
};
