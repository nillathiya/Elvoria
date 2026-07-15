// Child process used by the cross-process claim test. Races the parent's other
// workers to claim one TX hash, then reports whether it won.

const [registryKey, peerId] = process.argv.slice(2);

const { withLock } = await import("../../lib/server/utils/file-lock.js");
const { consumedTxHashRepository } = await import(
  "../../lib/server/repositories/consumed-txhash-repository.js"
);

async function claim() {
  if (await consumedTxHashRepository.isConsumed(registryKey)) return { ok: false, peerId };

  return withLock(`txhash:${registryKey}`, async () => {
    if (await consumedTxHashRepository.isConsumed(registryKey)) return { ok: false, peerId };
    await consumedTxHashRepository.create({ registryKey, peerId });
    return { ok: true, peerId };
  });
}

try {
  process.send(await claim());
} catch (err) {
  process.send({ ok: false, peerId, error: String(err?.message || err) });
}
process.exit(0);
