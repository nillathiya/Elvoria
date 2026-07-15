// ============================================================
//  Base repository — thin, typed-ish wrapper over the storage service.
//  Repositories are the only callers of file-storage-service.
// ============================================================

import {
  readCollection,
  findAll,
  findOne,
  findById,
  insert,
  updateById,
  deleteById,
  mutateCollection,
  newId,
  nowIso,
} from "../services/file-storage-service.js";

export function createRepository(collection, { idPrefix, unique = [] } = {}) {
  return {
    collection,

    all: () => readCollection(collection),
    find: (predicate) => findAll(collection, predicate),
    findOne: (predicate) => findOne(collection, predicate),
    findById: (id) => findById(collection, id),

    async create(data) {
      const record = {
        id: data.id || newId(idPrefix),
        ...data,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      return insert(collection, record, { unique });
    },

    update(id, patch) {
      return updateById(collection, id, (current) => ({
        ...(typeof patch === "function" ? patch(current) : patch),
        updatedAt: nowIso(),
      }));
    },

    remove: (id) => deleteById(collection, id),

    // Escape hatch for multi-record changes that must be one atomic write.
    mutate: (mutator, opts) => mutateCollection(collection, mutator, opts),
  };
}
