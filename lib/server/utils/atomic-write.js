// ============================================================
//  Atomic file writes — temp file + fsync + rename.
//  A crash mid-write must never leave a truncated JSON file.
// ============================================================

import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { StorageCorruptError } from "./errors.js";

// Unique per write: two concurrent writers to the same target must not
// collide on the temp path, or one would clobber the other's partial file.
function tempPathFor(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  return path.join(dir, `.${base}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`);
}

export function backupPathFor(filePath) {
  return `${filePath}.bak`;
}

export async function atomicWrite(filePath, contents) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // Keep the previous good version. Atomic rename makes a torn write
  // impossible, but it cannot protect against disk faults or someone editing
  // the file by hand — and since a corrupt file fails closed, the operator
  // needs something to restore from.
  await fs.copyFile(filePath, backupPathFor(filePath)).catch((err) => {
    if (err.code !== "ENOENT") throw err; // first write has nothing to back up
  });

  const tmp = tempPathFor(filePath);
  let handle;
  try {
    // "wx" fails rather than overwrites, proving the temp name was unused.
    handle = await fs.open(tmp, "wx");
    await handle.writeFile(contents, "utf8");
    // Flush to disk before the rename: rename is atomic in the namespace,
    // but without this the data can still be in the page cache on crash.
    await handle.sync();
    await handle.close();
    handle = null;

    // rename() replaces the target atomically. On Windows, Node maps this to
    // MoveFileEx(MOVEFILE_REPLACE_EXISTING), so it also overwrites atomically.
    await fs.rename(tmp, filePath);
  } catch (err) {
    if (handle) await handle.close().catch(() => {});
    await fs.rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}

export async function atomicWriteJson(filePath, data) {
  await atomicWrite(filePath, JSON.stringify(data, null, 2) + "\n");
}

export async function readJson(filePath, fallback) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    // Not existing yet is normal on a fresh install — that is the only case
    // that may fall back to an empty value.
    if (err.code === "ENOENT") return fallback;
    throw err;
  }

  // A file that exists but is empty is NOT normal: atomic writes always produce
  // a complete document, so zero bytes means something else damaged it. Treat
  // it as corruption rather than as "no records".
  if (!raw.trim()) throw new StorageCorruptError(filePath, new Error("File is empty"));

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new StorageCorruptError(filePath, err);
  }
}
