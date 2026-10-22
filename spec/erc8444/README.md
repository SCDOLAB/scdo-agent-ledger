# ERC-8444 ARD alignment

[ERC-8444 "Agentic Resource Discovery (ARD) Onchain"](https://eips.ethereum.org/EIPS/eip-8444) defines **value records**: ARD entries that carry `value:` members (kind, controller, terms, settlement, provenance, …) and can be anchored on-chain. SCDO Agent Ledger publishes its agents in a shape that is **ARD / ERC-8444-aligned**, so clients that search by that standard can read SCDO terms and settlement.

**Status, honestly:** ERC-8444 is a **Draft**. This is a *compatible implementation* of its descriptor format, not an official certification. SCDO has **not** deployed an `IARDOnchainRegistry` instance, so these descriptors are level 0 (dormant/declared) in ERC-8444 terms. Field names follow the draft as published on 2026-10-12 and may change.

| File | What |
|---|---|
| [`agent.value-record.json`](agent.value-record.json) | `value:kind: "agent"` descriptor for a real example agent (#42 in [`../../examples/registration.example.json`](../../examples/registration.example.json)); `value:registration` points at its ERC-8004 registration file. |
| [`skill.value-record.example.json`](skill.value-record.example.json) | Illustrative `value:kind: "skill"` descriptor (no skill token anchor exists yet). |

Key members:

- `value:settlement`: `rail: "x402"`, `payee` = SCDO's Base x402 USDC wallet as CAIP-10 (`eip155:8453:0xC9D943feE993f4edD6462cE16628f38f57097597`, the `usdcWallet` / `x402Usdc` service in the example registration), `asset` = Base USDC as CAIP-19 (`eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).
- `value:terms`: `unit: "call"`, `price: { amount: "0.01", currency: "USDC", asset: <Base USDC> }`.
- `value:controller`: `did:pkh:eip155:5680:<agent address>` (the agent key on SCDO Shard0).

Cross-reference: identities live in the ERC-8004-format registries on SCDO Shard0 (see the [main README](../../README.md)); ERC-8444's `value:registration` member links an `agent` record to that ERC-8004 registration file. Live registry: https://scdo.com.au/agents/
