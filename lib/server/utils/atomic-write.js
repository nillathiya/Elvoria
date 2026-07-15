// ============================================================
//  Atomic file writes — temp file + fsync + rename.
//  A crash mid-write must never leave a truncated JSON file.
// ============================================================

import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";

// Unique per write: two concurrent writers to the same target must not
// collide on the temp path, or one would clobber the other's partial file.
function tempPathFor(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  return path.join(dir, `.${base}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`);
}

export async function atomicWrite(filePath, contents) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

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
  try {
    const raw = await fs.readFile(filePath, "utf8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}
