// Register an agent on the SCDO Agent Ledger (free, signed, no gas).
// npm i ethers   then   node register.mjs "My Agent" [0xYourBaseUsdcWallet]
import { Wallet } from "ethers";
import fs from "node:fs";

const API = "https://scdo.com.au/agent-ledger/api";
// Use AGENT_KEY, else reuse ./agent.key, else create a wallet and save it there.
const key = process.env.AGENT_KEY || (fs.existsSync("agent.key") ? fs.readFileSync("agent.key", "utf8").trim() : "");
const w = key ? new Wallet(key) : Wallet.createRandom();
if (!key) { fs.writeFileSync("agent.key", w.privateKey, { mode: 0o600 }); console.log("New wallet saved to ./agent.key (keep it private)"); }

// Canonical JSON: sorted keys, no whitespace, undefined dropped.
const canon = v => v === null ? "null" : Array.isArray(v) ? `[${v.map(canon).join(",")}]`
  : typeof v === "object" ? `{${Object.keys(v).filter(k => v[k] !== undefined).sort()
  .map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",")}}` : JSON.stringify(v);

let seq = Date.now();
async function send(type, body) {
  const payload = { v: 1, chainId: 5680, type, agent: w.address, seq: ++seq, ts: Date.now(), body };
  const sig = await w.signMessage("SCDO Agent Ledger v1\n" + canon(payload));
  const r = await fetch(`${API}/${type}`, { method: "POST",
    headers: { "content-type": "application/json" }, body: JSON.stringify({ payload, sig }) });
  console.log(type, r.status, await r.text());
}

// 1. Register. usdcWallet = Base address that receives x402 USDC.
await send("register", { version: "1.0.0", platform: "node", role: "agent",
  label: process.argv[2] || "My Agent", usdcWallet: process.argv[3] || w.address, src: "github-scdo-agent-ledger" });
// 2. Record a signed entry (e.g. a finished task).
await send("heal", { action: "task:hello-ledger", outcome: "done" });
// 3. Your record and registration.json:
console.log(`${API}/agents/${w.address}`);
console.log(`${API}/agents/${w.address}/registration.json`);
