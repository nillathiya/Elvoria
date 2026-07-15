import { createRepository } from "./base-repository.js";

const repo = createRepository("transactions", { idPrefix: "transaction" });

export const transactionRepository = {
  ...repo,

  listByPeer: (peerId) => repo.find((t) => t.peerId === peerId),

  findByRegistryKey: (registryKey) => repo.findOne((t) => t.registryKey === registryKey),
};
