// ============================================================
//  File storage service — the ONLY module that touches collection files.
//  Controllers and routes must go through a repository, never through fs.
// ============================================================

import { promises as fs } from "fs";
import { randomBytes } from "crypto";
import { collectionPath, STORAGE_ROOT, DIRS } from "../config/storage-config.js";
import { atomicWriteJson, readJson } from "../utils/atomic-write.js";
import { withLock } from "../utils/file-lock.js";

export async function ensureStorage() {
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
  await Promise.all(Object.values(DIRS).map((d) => fs.mkdir(d, { recursive: true })));
}

export function newId(prefix) {
  // Timestamp prefix keeps ids roughly sortable; random suffix avoids
  // collisions when two records are created in the same millisecond.
  return `${prefix}_${Date.now().toString(36)}${randomBytes(5).toString("hex")}`;
}

export function nowIso() {
  return new Date().toISOString();
}

// ---- reads -------------------------------------------------

export async function readCollection(name) {
  const rows = await readJson(collectionPath(name), []);
  return Array.isArray(rows) ? rows : [];
}

export async function readDocument(name, fallback = null) {
  return readJson(collectionPath(name), fallback);
}

export async function findAll(name, predicate) {
  const rows = await readCollection(name);
  return predicate ? rows.filter(predicate) : rows;
}

export async function findOne(name, predicate) {
  const rows = await readCollection(name);
  return rows.find(predicate) || null;
}

export async function findById(name, id) {
  return findOne(name, (r) => r.id === id);
}

// ---- writes ------------------------------------------------
//
// Every mutation runs under the collection lock and re-reads the file inside
// the lock. Data read before acquiring the lock is stale by definition, so a
// mutator only ever sees the freshest rows.

function lockNameFor(name) {
  return `collection:${name}`;
}

export async function mutateCollection(name, mutator, opts) {
  return withLock(
    lockNameFor(name),
    async () => {
      const rows = await readCollection(name);
      const result = await mutator(rows);
      const next = result?.rows ?? rows;
      await atomicWriteJson(collectionPath(name), next);
      return result?.value;
    },
    opts
  );
}

export async function mutateDocument(name, mutator, fallback = {}, opts) {
  return withLock(
    lockNameFor(name),
    async () => {
      const doc = await readDocument(name, fallback);
      const result = await mutator(doc);
      const next = result?.doc ?? doc;
      await atomicWriteJson(collectionPath(name), next);
      return result?.value;
    },
    opts
  );
}

export async function insert(name, record, { unique } = {}) {
  return mutateCollection(name, (rows) => {
    // Uniqueness is checked inside the lock — checking before it would let two
    // concurrent inserts both pass the check and both write.
    if (unique) {
      const clash = rows.find((r) => unique.some((f) => r[f] !== undefined && r[f] === record[f]));
      if (clash) {
        const field = unique.find((f) => clash[f] === record[f]);
        const err = new Error(`Duplicate value for ${field}`);
        err.code = "DUPLICATE";
        err.field = field;
        throw err;
      }
    }
    return { rows: [...rows, record], value: record };
  });
}

export async function updateById(name, id, patch) {
  return mutateCollection(name, (rows) => {
    const i = rows.findIndex((r) => r.id === id);
    if (i === -1) return { rows, value: null };
    const updated = { ...rows[i], ...(typeof patch === "function" ? patch(rows[i]) : patch) };
    const next = rows.slice();
    next[i] = updated;
    return { rows: next, value: updated };
  });
}

export async function deleteById(name, id) {
  return mutateCollection(name, (rows) => {
    const next = rows.filter((r) => r.id !== id);
    return { rows: next, value: next.length !== rows.length };
  });
}
