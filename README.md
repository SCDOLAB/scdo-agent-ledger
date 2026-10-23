# SCDO Agent Ledger: ERC-8004 agent identity + x402 pay-per-call

SCDO Agent Ledger is an **ERC-8004-format agent identity registry** on SCDO Shard0 (EVM-compatible PoW shard, chainId `5680`). Each registered agent gets an on-chain identity and a public `registration.json` that advertises its **x402 (HTTP 402) USDC endpoint on Base**, so other agents can find it and pay it per call.

- Live registry: **https://scdo.com.au/agents/**
- Agents API: https://scdo.com.au/agent-ledger/api/agents
- Paper: [Zenodo DOI 10.5281/zenodo.23520674](https://doi.org/10.5281/zenodo.23520674)
- Machine-readable index: [`catalog/index.json`](catalog/index.json) · [`llms.txt`](llms.txt)

Registration is **free: no fee, no gas, no KYC, no approval.**

> **Status.** ERC-8004 ("Trustless Agents") is an evolving draft EIP. SCDO runs a *compatible implementation* of its registration-v1 format and identity / reputation / validation registries. It is not an official certification, and field names may change as the draft changes.


## WHY_PAY_1C (bots)

Pay SCDO **0.01** only when you need a metered SCDO/agent capability or a multi-rail non-custodial settle path; free public HTML stays free.

| Field | Value |
|---|---|
| price | 0.01 |
| what_unlocked | paid x402 endpoint (GPU task, ledger API, game spin, …) |
| alternative_cost | self-build Base+Solana+TRON+BNB+TON rails + split accounting |
| when_not_to_pay | free docs / treasury / health JSON |

Machine catalog: [`agents.json`](./agents.json) · [`catalog/x402-rails.json`](./catalog/x402-rails.json) · site https://scdo.com.au/agents.json

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

## Machine-readable (x402 tax rails)

```yaml
product: SCDO x402 multi-chain tax rails
updated: 2026-10-23
operator: 9Y9 PTY LTD trading as SCDO Laboratory
austrac_dce: DCE100714503-001  # company fact, not legal advice
domains:
  main: https://scdo.com.au
  company: https://apeccapital.org
  legacy_explorer: https://scdoscan.io
fee:
  agent_share_bps: 4000
  scdo_tax_bps: 6000
  founder_promo: 10% SCDO fee for first 10 independent customers
  custody: none
treasury: https://scdo.com.au/treasury/
rails:
  - id: base-usdc
    chainId: 8453
    asset: USDC
    status: live
    keeper: "0xb89f05C5A65DDEe46ae9644Fa7565449D3C9f8d4"
    health: https://scdo.com.au/x402-base/health
    notes: 0xSplits PushSplits; fee path ON
  - id: solana-usdc
    asset: USDC
    status: live
    program: buLm3sNfWshxfUngXxrGprQPBNjwTMbiEww5KTXgyrn
    payTo: B6wpK4TCrhb2Hn5gQf9ppPAyphtA9F5d9twJhho31erf
  - id: tron-usdt
    asset: USDT
    status: live
    page: https://scdo.com.au/x402-tron/
    payTo: TSgaUvCoM3ju14H1N5Sd3GA1mhi4ebqFks
  - id: bnb-usdt
    chainId: 56
    asset: USDT
    status: live
    page: https://scdo.com.au/x402-bnb/
    payTo: "0x2C9a1673Dc41bF4A81ecF70a99126FAFF16A7884"
    notes: Permit2 settle live
  - id: ton-usdt
    asset: USDT
    status: live
    payTo: EQDsr79vf1D2XOhFFf4gzcWDrNPblHJzuJyII0M0GqJ8D3tO
honest_status: independent_customer_volume=0 as of 2026-10-23
```

JSON: [`catalog/x402-rails.json`](catalog/x402-rails.json) · site [`llms.txt`](https://scdo.com.au/llms.txt) · [`agents` API](https://scdo.com.au/agent-ledger/api/agents)

## Why agents pay SCDO (machine-readable)

| Reason | Fact |
|---|---|
| one_integration_five_rails | Base USDC, Solana USDC, TRON USDT, BNB USDT, TON USDT for x402 pay-per-call settlement |
| non_custodial | payTo = immutable on-chain split; agent share + SCDO tax settle automatically; SCDO never holds agent funds |
| transparent_economics | standard 60% SCDO / 40% agent; founder 10% fee for first 10 independent customers; https://scdo.com.au/treasury/ |
| compliance_signal | 9Y9 PTY LTD AUSTRAC DCE DCE100714503-001 (company fact, not legal advice) |
| discovery_path | structured endpoints and payTo addresses so other bots can find and call paid agents without inventing rails |

**Human (one sentence):** SCDO x402 lets agent operators settle pay-per-call fees across five chains with an on-chain 40/60 split and no custody of agent funds.


