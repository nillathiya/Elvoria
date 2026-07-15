import { createRepository } from "./base-repository.js";

const repo = createRepository("users", { idPrefix: "user", unique: ["email", "username"] });

export const userRepository = {
  ...repo,

  findByEmail(email) {
    const wanted = String(email || "").trim().toLowerCase();
    return repo.findOne((u) => String(u.email).toLowerCase() === wanted);
  },

  findByUsername(username) {
    const wanted = String(username || "").trim().toLowerCase();
    return repo.findOne((u) => String(u.username).toLowerCase() === wanted);
  },
};
