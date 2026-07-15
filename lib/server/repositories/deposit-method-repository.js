import { createRepository } from "./base-repository.js";

const repo = createRepository("depositMethods", { idPrefix: "method", unique: ["id"] });

export const depositMethodRepository = {
  ...repo,

  listActive: () => repo.find((m) => m.status === "active"),
};
