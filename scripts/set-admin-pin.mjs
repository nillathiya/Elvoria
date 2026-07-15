// ============================================================
//  Set / reset the admin PIN. Run: npm run set-admin-pin
//
//  There is no default admin PIN anywhere in this codebase — that is the
//  point. The PIN is prompted for, never passed as an argument, because argv
//  is visible in shell history and to `ps` on a shared host.
// ============================================================

import readline from "readline";
import { stdin, stdout } from "process";

const { ensureStorage } = await import("../lib/server/services/file-storage-service.js");
const { setAdminPin, isAdminProvisioned } = await import("../lib/server/services/auth-service.js");

function ask(question, { mask = false } = {}) {
  const rl = readline.createInterface({ input: stdin, output: stdout, terminal: true });

  if (mask) {
    // Swallow the echo so the PIN never appears on screen or in a scrollback.
    rl._writeToOutput = (chunk) => {
      if (chunk.includes(question)) stdout.write(question);
      else stdout.write("*");
    };
  }

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (mask) stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

await ensureStorage();

if (await isAdminProvisioned()) {
  const confirm = await ask("An admin PIN is already set. Replace it? (yes/no): ");
  if (confirm.toLowerCase() !== "yes") {
    console.log("Cancelled. Existing PIN unchanged.");
    process.exit(0);
  }
}

if (!process.env.AUTH_PEPPER) {
  console.warn(
    "\n  Warning: AUTH_PEPPER is not set.\n" +
      "  A 6-digit PIN is only 1,000,000 combinations. Without a pepper, anyone\n" +
      "  who obtains storage/admin.json can brute-force it offline. Set AUTH_PEPPER\n" +
      "  to a long random secret in your environment before going live.\n" +
      "  Changing it later invalidates every existing PIN and password.\n"
  );
}

const pin = await ask("New 6-digit admin PIN: ", { mask: true });
const again = await ask("Confirm PIN: ", { mask: true });

if (pin !== again) {
  console.error("PINs do not match. Nothing was changed.");
  process.exit(1);
}

try {
  await setAdminPin(pin); // validates exactly-6-digits and hashes before storage
  console.log("Admin PIN set. Only the scrypt hash was written to storage/admin.json.");
} catch (err) {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
}
