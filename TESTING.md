# Manual test flow

A one-pass walkthrough of every role and every rule the spec calls
non-negotiable (`.md` §26). Roughly 20 minutes.

`npm test` already covers 105 automated cases. This is for driving the real UI
against the real blockchain, which the automated tests deliberately do not do.

---

## 0. Start from a known state

Test results are only meaningful if you know where you started. Stop the dev
server, then:

```bash
rm -f storage/*.json storage/*.json.bak
rm -f storage/sessions/* storage/locks/*
npm run set-admin-pin        # choose your own PIN
npm run seed-dev             # PEER001/654321, PEER002 (disabled), demouser, 2 methods
npm run dev
```

`seed-dev` deliberately adds **no receiving addresses** — step 4 is where you
add one.

> **A TX hash can only ever be verified once.** That is the point of the
> system, so this flow cannot hand you a reusable hash. Where one is needed,
> fetch a fresh one from [bscscan.com](https://bscscan.com) as described.

---

## 1. Admin authentication (§3.1)

| # | Do | Expect |
|---|---|---|
| 1.1 | Open `/admin/peers` **without logging in** | Redirected to `/admin`. You never receive the panel HTML — check the Network tab: no peer data is in the response |
| 1.2 | Enter a 5-digit PIN | `Admin PIN must be exactly 6 digits, numbers only` |
| 1.3 | Enter letters | Field rejects them as you type |
| 1.4 | Enter a wrong 6-digit PIN | `Invalid PIN` |
| 1.5 | Repeat 1.4 five times, then enter the **correct** PIN | `Too many failed attempts. Try again in 60s.` — the lockout holds even for the right PIN |
| 1.6 | Wait 60s, enter the correct PIN | Signed in |
| 1.7 | DevTools → Application → Cookies | `elvoria_admin_session` is `HttpOnly`. JS cannot read it; type `document.cookie` in the console and it is absent |
| 1.8 | Sign out, then press Back | Still signed out — the session was destroyed server-side, not just hidden |

---

## 2. Peer management (§6)

| # | Do | Expect |
|---|---|---|
| 2.1 | Peers → create `PEER900` / `Test Peer` / PIN `111111` | Created |
| 2.2 | Look anywhere for that PIN | Nowhere. `storage/peers.json` holds only a `scrypt$…` hash (§6: the admin cannot see the PIN after creation) |
| 2.3 | Create `PEER900` again | `Peer ID PEER900 already exists` |
| 2.4 | Try PIN `12345` / `1234567` / `abc123` | Rejected |
| 2.5 | Disable `PEER900`, then log in as it at `/peer` | `Invalid Peer ID or PIN` — same wording as a wrong PIN, so the reply does not reveal that the account exists |
| 2.6 | Re-enable, log in | Works |
| 2.7 | Reset its PIN to `999999`, try the old `111111` | Old PIN refused, new one works |

---

## 3. Deposit methods (§7)

| # | Do | Expect |
|---|---|---|
| 3.1 | Deposit methods → add a token method with **no contract address** | `A token method requires a token contract address` |
| 3.2 | Add one with verifier `tron-token-verifier` but network `BSC` | `Verifier tron-token-verifier handles TRON/token, not BSC/token` — §26.17: a network's verifier cannot be attached to another network |
| 3.3 | Disable `bnb_native`, then open `/pa/deposit` as the user | BNB is gone from the list |
| 3.4 | Re-enable it | It returns |

---

## 4. Deposit addresses (§8)

| # | Do | Expect |
|---|---|---|
| 4.1 | Deposit address → method `BNB · BSC` → paste a TRON address (`T…`) | `Invalid EVM address` |
| 4.2 | Add More → enter one valid address and one piece of garbage → Save | Whole batch refused. Configured addresses count is unchanged — a typo cannot half-save a batch |
| 4.3 | Add a valid BSC address | Saved, shown `active` |
| 4.4 | Add the same address again | `Address already configured for this method` |
| 4.5 | Add it again in UPPERCASE | Also refused — case is not a different address |
| 4.6 | Disable it | `/pa/deposit` stops offering BNB entirely: a method with no active address is not advertised |
| 4.7 | Re-enable it | BNB returns |

---

## 5. Normal user (§2.3, §3.3, §9)

| # | Do | Expect |
|---|---|---|
| 5.1 | Open `/pa` signed out | Redirected to `/` |
| 5.2 | Register with an existing email | `That email is already registered` |
| 5.3 | Register the same email in UPPERCASE | Also refused |
| 5.4 | Register with password `short` | `Password must be at least 8 characters` |
| 5.5 | Log in with the right email and a wrong password | Refused, with no hint as to which half was wrong |
| 5.6 | Log in properly, open `/pa/deposit`, click BNB | An address and QR appear |
| 5.7 | Close it, reopen, refresh, reopen — 5 times | **Exactly the same address every time** (§9 — an address must not be re-rolled on refresh) |
| 5.8 | Admin: add a 2nd and 3rd BNB address. Register a few new users and open the deposit | Different users get different addresses (random draw from the active set) |
| 5.9 | Note a deposit request's address, then disable that address as admin, reload the user's deposit | The user still sees the address they were given — they were already told it |
| 5.10 | Check `storage/deposit-requests.json` | `assignedAddress` recorded against the request |

---

## 6. Peer verification — the main feature (§10–§16)

Log in at `/peer` as `PEER001` / `654321`.

### 6.1 Bad input

| Do | Expect |
|---|---|
| Submit `abc` | `That is not a valid TX hash` — and nothing hits the network |
| Submit a PIN hash or any random text | Same |

### 6.2 Against the real chain

| Do | Expect |
|---|---|
| Submit `0x` + 64 random hex | `This transaction was not found on the blockchain` — the server really did ask BSC |
| Submit a **real BSC tx hash** that paid someone else | `The funds were not sent to one of our receiving addresses` |

### 6.3 The green path

1. On [bscscan.com](https://bscscan.com), open **Latest Transactions** and pick one whose Value is not `0 BNB`
2. Copy its **To** address and its **Transaction Hash**
3. Admin → Deposit address → add that **To** address to `BNB · BSC`
4. Peer panel → `BNB · BSC` → paste the hash → Submit

Expect: **✓ Transaction verified successfully**, with the real amount, sender
and block number — every value read from the chain, none of it submitted.

> That address is not yours. **Delete it when you are done.**

### 6.4 Ownership and duplicates (§11, §12, §26.10–12)

| # | Do | Expect |
|---|---|---|
| 6.4.1 | Submit the same hash again as `PEER001` | `Transaction already used` · *You have already verified this transaction* |
| 6.4.2 | Same hash **without** the `0x`, and in UPPERCASE | Still `already used` — casing cannot claim a hash twice |
| 6.4.3 | Log out, log in as `PEER003`, submit that hash | `Already used` — and it does **not** say who owns it |
| 6.4.4 | `storage/consumed-txhashes.json` | Exactly one entry, still `PEER001`. Ownership never transfers |
| 6.4.5 | Submit a hash that was **rejected** earlier | Still processed, not burned — an invalid hash is never claimed (§11) |

### 6.5 Never trust the client (§26.14)

With the peer panel open, run this in the DevTools console:

```js
await fetch('/api/peer/verify-tx', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': document.cookie.match(/elvoria_csrf=([^;]+)/)[1],
  },
  body: JSON.stringify({
    methodId: 'bnb_native',
    txHash: '0x' + 'a'.repeat(64),
    amount: '999999',
    sender: '0x1111111111111111111111111111111111111111',
    recipient: '0x1111111111111111111111111111111111111111',
    status: 'verified',
    confirmations: 9999,
  }),
}).then((r) => r.json());
```

Expect `{status: 'rejected', reason: 'TX_NOT_FOUND'}` with `amount: null`.
Every forged field is ignored; the server asks the chain instead.

### 6.6 Wrong network / wrong token

| Do | Expect |
|---|---|
| Take a **USDT** transfer hash, submit it with `BNB · BSC` selected | Rejected — the native verifier does not accept token transfers |
| Take a **BNB** transfer hash, submit it with `USDT BEP20` selected | Rejected — no USDT `Transfer` event for that contract |

### 6.7 Token transfers — the §16 case

This is the one most implementations get wrong.

1. On BSCScan find a **USDT BEP20** transfer
2. Open its **Logs** tab, find the `Transfer` event, and take the **`to`** value from there — *not* the top-level `To`, which is the USDT contract
3. Configure that address on `USDT BEP20`, then verify the hash

Expect: verified, with the amount taken from the event. Checking the top-level
`To` instead would have credited the contract, not the wallet.

---

## 7. Role isolation (§21)

| # | Do | Expect |
|---|---|---|
| 7.1 | Signed in as admin only, open `/peer/verify` | Redirected to `/peer` — an admin cookie is not a peer session |
| 7.2 | Signed in as peer only, open `/admin/peers` | Redirected to `/admin` |
| 7.3 | As a peer, run `fetch('/api/admin/peers').then(r=>r.json())` in the console | `401 Not authenticated` |
| 7.4 | As admin, disable `PEER001` while it is logged in, then have it submit a hash | Refused immediately — the peer is re-read on every request, not trusted from the session |

---

## 8. Security (§21)

| # | Do | Expect |
|---|---|---|
| 8.1 | `curl -X POST http://localhost:3000/api/user/login -H 'Content-Type: application/json' -d '{"identifier":"demouser","password":"correct horse battery staple"}'` | `{"error":"Missing or invalid CSRF token","code":"CSRF_FAILED"}` |
| 8.2 | The same request with a valid `X-CSRF-Token` **and** `Origin: https://evil.example` | `Request origin does not match this site` |
| 8.3 | Submit a TX hash 11 times in a minute | `Too many requests. Try again in Ns.` (verify-tx is capped at 10/min — each call hits a blockchain node) |
| 8.4 | `grep -ri "admin123\|password.*=.*['\"]" lib/ app/ --include=*.js` | No credential in source |
| 8.5 | `cat storage/peers.json` | Only `scrypt$…` hashes — no PIN in plain text (§26.21) |

### 8.6 Corruption fails closed

```bash
cp storage/consumed-txhashes.json /tmp/backup.json
echo "{ broken" > storage/consumed-txhashes.json
```

Submit any hash → **500 `STORAGE_CORRUPT`**, not a verification.

This is the point: if a damaged registry were read as "no hashes consumed",
every previously claimed hash would become claimable again — a disk fault would
turn into a double-spend. Restore it:

```bash
cp /tmp/backup.json storage/consumed-txhashes.json     # or use the .bak file
```

---

## 9. Concurrency (§26.12)

The single most important rule: two simultaneous submissions of the same hash
must not both succeed. Covered automatically — it forks six real OS processes
that race for one hash:

```bash
node --test tests/storage.test.mjs
node --test tests/verify.test.mjs
```

To see it through the HTTP layer, take a fresh unclaimed hash and fire ten
requests at once from the console:

```js
const csrf = document.cookie.match(/elvoria_csrf=([^;]+)/)[1];
const hash = '0xPUT_A_FRESH_UNCLAIMED_HASH_HERE';

const results = await Promise.all(
  Array.from({ length: 10 }, () =>
    fetch('/api/peer/verify-tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ methodId: 'bnb_native', txHash: hash }),
    }).then((r) => r.json())
  )
);

console.table(results.map((r) => ({ status: r.status, reason: r.reason })));
```

Expect exactly **one** `verified` and **nine** `already_used`. Never two
`verified`.

---

## Known limits

Real, and worth knowing before this takes real deposits:

- **Login lockout needs a reverse proxy.** Next does not expose the socket IP,
  so without a proxy setting `X-Real-IP` / `X-Forwarded-For` every anonymous
  client shares one lockout bucket — anyone can lock the admin out with five
  wrong PINs. It fails closed (no way in), but it is a denial of service. See
  `.env.example`.
- **`AUTH_PEPPER` must be set before production.** A 6-digit PIN is 1,000,000
  combinations; without a pepper, anyone who obtains `storage/admin.json` can
  brute-force it offline. Changing it later invalidates every PIN and password.
- **Rate limit counters are per process** and reset on restart. With several
  instances the effective limit multiplies by the instance count.
- **`next@14.2.5` has a published security advisory.** Upgrading is a separate
  decision, outside this spec.
- **Storage must be a real disk.** Atomic rename and `O_EXCL` locking are not
  reliable on NFS or most network shares.
