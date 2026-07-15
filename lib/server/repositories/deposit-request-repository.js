import { createRepository } from "./base-repository.js";

const repo = createRepository("depositRequests", { idPrefix: "deposit" });

export const depositRequestRepository = {
  ...repo,

  listByUser: (userId) => repo.find((d) => d.userId === userId),

  // An open request already owns an assigned address; reuse it rather than
  // rolling a new one, or the address would change on every page refresh.
  findOpenForUserAndMethod: (userId, methodId) =>
    repo.findOne(
      (d) => d.userId === userId && d.methodId === methodId && d.status === "awaiting_txhash"
    ),
};
