import { createRepository } from "./base-repository.js";

const repo = createRepository("depositAddresses", { idPrefix: "address" });

export const depositAddressRepository = {
  ...repo,

  listByMethod: (methodId) => repo.find((a) => a.methodId === methodId),

  // The only set the random assigner and the recipient check may draw from.
  listActiveByMethod: (methodId) =>
    repo.find((a) => a.methodId === methodId && a.status === "active"),
};
