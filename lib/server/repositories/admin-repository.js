// ============================================================
//  Admin repository — admin.json is a single document, not a collection.
// ============================================================

import { readDocument, mutateDocument, nowIso } from "../services/file-storage-service.js";

const EMPTY = { pinHash: null, createdAt: null, updatedAt: null };

export const adminRepository = {
  get: () => readDocument("admin", EMPTY),

  async isProvisioned() {
    const doc = await readDocument("admin", EMPTY);
    return Boolean(doc?.pinHash);
  },

  setPinHash(pinHash) {
    return mutateDocument(
      "admin",
      (doc) => {
        const next = {
          ...doc,
          pinHash,
          createdAt: doc.createdAt || nowIso(),
          updatedAt: nowIso(),
        };
        return { doc: next, value: next };
      },
      EMPTY
    );
  },
};
