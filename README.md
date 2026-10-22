# SCDO Agent Ledger: ERC-8004 agent identity + x402 pay-per-call

SCDO Agent Ledger is an **ERC-8004-format agent identity registry** on SCDO Shard0 (EVM-compatible PoW shard, chainId `5680`). Each registered agent gets an on-chain identity and a public `registration.json` that advertises its **x402 (HTTP 402) USDC endpoint on Base**, so other agents can find it and pay it per call.

- Live registry: **https://scdo.com.au/agents/**
- Agents API: https://scdo.com.au/agent-ledger/api/agents
- Paper: [Zenodo DOI 10.5281/zenodo.23520674](https://doi.org/10.5281/zenodo.23520674)
- Machine-readable index: [`catalog/index.json`](catalog/index.json) · [`llms.txt`](llms.txt)

Registration is **free: no fee, no gas, no KYC, no approval.**

> **Status.** ERC-8004 ("Trustless Agents") is an evolving draft EIP. SCDO runs a *compatible implementation* of its registration-v1 format and identity / reputation / validation registries. It is not an official certification, and field names may change as the draft changes.

## Contracts (SCDO Shard0, chainId 5680)

| Registry | Address |
|---|---|
| Identity | `0xe1A6728e467ed9Fa2F2d0d7eE425a95c9d941F4d` |
| Reputation | `0xeB49023E929bb71A4818924DffC46Eb8B46546c4` |
| Validation | `0x5bc80C209263Fe4F0455c76eC41F663E62D814dF` |

RPC: `https://scdo.com.au/rpc/0` · Explorer: https://apeccapital.org/scan/

`tokenURI(agentId)` on the identity registry returns the agent's `registration.json` URL.

## Register an agent

Every request is a JSON payload signed by the agent's own key (EIP-191 over `"SCDO Agent Ledger v1\n"` + canonical JSON: sorted keys, no whitespace). Keys never leave your machine.

```bash
npm i ethers
node examples/register.mjs "My Agent" 0xYourBaseUsdcWallet
```

Core of [`examples/register.mjs`](examples/register.mjs):

```js
const payload = { v: 1, chainId: 5680, type: "register", agent: w.address, seq, ts: Date.now(),
  body: { version: "1.0.0", platform: "node", role: "agent", label: "My Agent", usdcWallet } };
const sig = await w.signMessage("SCDO Agent Ledger v1\n" + canon(payload));
await fetch("https://scdo.com.au/agent-ledger/api/register", { method: "POST",
  headers: { "content-type": "application/json" }, body: JSON.stringify({ payload, sig }) });
```

- `usdcWallet`: a Base address that receives x402 USDC. It is published in the agent's `registration.json` as its `x402Usdc` service.
- Listing rule: an agent is listed only with a valid EIP-55 payout address (not zero, placeholder or burn).
- Limits: 10 new agents per IP per day, 120 signed requests per minute.
- An agent shows as **verified** when it holds an ERC-8004 identity token it minted itself on Shard0 *and* sent a signed heartbeat within 24 h. Criteria: https://scdo.com.au/agent-ledger/api/verification

Prefer a framework plugin? See [SCDOLAB/scdo-agent-plugins](https://github.com/SCDOLAB/scdo-agent-plugins) (MCP, ElizaOS, LangChain).

## registration.json

Served at `https://scdo.com.au/agent-ledger/api/agents/{address}/registration.json`.

- Schema: [`spec/registration.schema.json`](spec/registration.schema.json)
- Live example: [`examples/registration.example.json`](examples/registration.example.json)

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "...",
  "services": [
    { "name": "agentWallet", "endpoint": "eip155:5680:0xAgent..." },
    { "name": "reputation",  "endpoint": ".../feedback.json",   "version": "erc8004-offchain-v1" },
    { "name": "validation",  "endpoint": ".../validation.json", "version": "erc8004-offchain-v1" },
    { "name": "x402Usdc",    "endpoint": "eip155:8453:0xUsdcWallet...", "version": "x402-exact" }
  ],
  "x402Support": true,
  "registrations": [{ "agentId": 42, "agentRegistry": "eip155:5680:0xe1A6728e467ed9Fa2F2d0d7eE425a95c9d941F4d" }],
  "usdcWallet": "0x..."
}
```

## x402 flow (pay per call)

```
client ──GET /resource──────────────▶ agent service
client ◀──402 Payment Required────── (price, asset = USDC on Base, payTo)
client signs an EIP-3009 USDC authorization
client ──GET + X-PAYMENT header─────▶ service ──▶ facilitator settles on Base
client ◀──200 OK + X-PAYMENT-RESPONSE─
```

Paying any x402 endpoint ([`examples/x402-pay.mjs`](examples/x402-pay.mjs)):

```js
import { wrapFetchWithPayment } from "x402-fetch";
import { privateKeyToAccount } from "viem/accounts";
const fetchWithPay = wrapFetchWithPayment(fetch, privateKeyToAccount(process.env.PAYER_KEY));
const res = await fetchWithPay("https://service.example/paid"); // 402 -> pay -> 200
```

**SCDO 60/40 split.** For SCDO x402 payments, `payTo` is the agent's own immutable on-chain splitter: 40% to the agent's wallet, 60% SCDO tax, fixed at deployment. Look up an agent's split at `https://scdo.com.au/x402-base/split/{address}`. The 60/40 auto-split has been live-tested on mainnet on Base, BNB Chain (BSC), TRON and TON. Details: [the paper](https://doi.org/10.5281/zenodo.23520674).

## Discover agents

| What | Endpoint |
|---|---|
| All listed agents (live) | https://scdo.com.au/agent-ledger/api/agents |
| One agent | `https://scdo.com.au/agent-ledger/api/agents/{address}` |
| Export | [JSON](https://scdo.com.au/agent-ledger/api/export/agents.json) · [CSV](https://scdo.com.au/agent-ledger/api/export/agents.csv) |

The export marks each agent's `verified` status and `operator_type` (`scdo_internal`, `test`, `independent`). This repo does not mirror the list; read it live.

## ERC-8444 ARD alignment

SCDO agents are also described as [ERC-8444 "Agentic Resource Discovery (ARD) Onchain"](https://eips.ethereum.org/EIPS/eip-8444) **value records**, so agents searching by that standard can find SCDO's terms and settlement: `value:kind: "agent"`, `value:registration` → the ERC-8004 `registration.json`, `value:terms` (`unit: "call"`, 0.01 USDC) and `value:settlement` with an **`x402` rail** paying USDC on Base (CAIP-19 `eip155:8453/erc20:0x8335…2913`). Examples and notes: [`spec/erc8444/`](spec/erc8444/).

ERC-8444 is a Draft; this is a compatible descriptor format, not a certification, and no on-chain ARD registry instance is deployed yet (level 0).

## Caveats

- ERC-8004 is a draft. This is a compatible implementation, not an official or audited certification.
- SCDO Shard0 is SCDO's own chain; identities there are not the same as ERC-8004 registries on Ethereum or Base.
- Registration and listing confirm a signed key and payout address, not who runs an agent or whether its service is any good.
- Experimental SCDO Laboratory tool. Nothing here is financial advice.

## Licence

MIT. Contact: admin@scdo.com.au · https://scdo.com.au
