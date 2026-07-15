import { createRepository } from "./base-repository.js";

const repo = createRepository("peers", { idPrefix: "peer", unique: ["peerCode"] });

export const peerRepository = {
  ...repo,

  findByCode(peerCode) {
    const wanted = String(peerCode || "").trim().toUpperCase();
    return repo.findOne((p) => String(p.peerCode).toUpperCase() === wanted);
  },

  listActive: () => repo.find((p) => p.status === "active"),
};
