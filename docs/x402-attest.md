# Social post attestation (x402 SKU)

Bot-first contract for SCDO's second metered SKU. Primary SKU stays `GET https://scdo.com.au/api/x402/ledger-stats` (live). This SKU is **shipping** until an unpaid POST returns HTTP 402.

| Field | Value |
|---|---|
| id | `social-post-attest` |
| method | `POST` |
| url | `https://scdo.com.au/api/x402/attest` |
| price | 0.01 USDC |
| network | `eip155:8453` (Base) |
| asset | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC, 6 decimals) |
| amountAtomic | `10000` |
| payTo | `0x105c14379874E0Ff5287a2f5214146ed1b9FC866` (same as ledger-stats) |
| type | `social_post_attestation` |
| status | `shipping` |
| what_unlocked | After settle, stores the social post text + `content_sha256` and returns `verify_url`. Optional Shard0 memo `SCDO-X-ATTEST-v1:0x{sha256}`. |
| verify URL | `https://scdo.com.au/agent-ledger/attestations/<id>/` |

Sample body: [`examples/attest-request.json`](../examples/attest-request.json). Field list: [`attestations/SCHEMA-social_post_v1.md`](../attestations/SCHEMA-social_post_v1.md).

Free public HTML, treasury, health JSON, and the agents list stay free. Pay only when you need this stored attestation.

## Unpaid call

```bash
curl -sS -D - -o /tmp/attest-body.json -X POST \
  'https://scdo.com.au/api/x402/attest' \
  -H 'content-type: application/json' \
  -H 'accept: application/json' \
  --data @examples/attest-request.json
```

### Probe (2026-10-23)

`POST https://scdo.com.au/api/x402/attest` (and the same path with a trailing slash, plus `https://apeccapital.org/api/x402/attest`) returned **HTTP 404**, not 402. Body began:

```json
{"error":"not available: the SCDO Classic (Shard1-4) explorer API is not served by apeccapital.org. Shard0: /api?module=account&action=txlist, /api/address/<0x..>/txs, /enhance/shard0/*"}
```

Do not send USDC to this URL until the same unpaid POST returns **402**. No paid transaction hash is published for this SKU.

The same day, unpaid `GET https://scdo.com.au/api/x402/ledger-stats` returned **402** with `amount` `10000`, `network` `eip155:8453`, asset `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, `payTo` `0x105c14379874E0Ff5287a2f5214146ed1b9FC866`.

### Expected 402

When the route is mounted, an unpaid POST should return HTTP 402 (`x402Version` 2, `error` `payment required`) and an `accepts[]` entry with the price fields above (`scheme` `exact`). The live ledger-stats challenge also sent `maxTimeoutSeconds` 300 and `extra.name` `USD Coin` / `extra.version` `2`, plus a `PAYMENT-REQUIRED` header. Treat those as the shape to expect; they are copied from that live challenge, not from a captured attest response.

```json
{
  "x402Version": 2,
  "error": "payment required",
  "resource": {
    "url": "https://scdo.com.au/api/x402/attest",
    "description": "SCDO x402: social post attestation",
    "mimeType": "application/json"
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:8453",
      "amount": "10000",
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "payTo": "0x105c14379874E0Ff5287a2f5214146ed1b9FC866",
      "extra": { "name": "USD Coin", "version": "2" }
    }
  ]
}
```

Retry the same POST (same JSON body) with the x402 v2 `PAYMENT-SIGNATURE` header. The gateway also accepts `X-PAYMENT`. Settlement response header: `PAYMENT-RESPONSE` / `X-PAYMENT-RESPONSE`. [`examples/x402-pay.mjs`](../examples/x402-pay.mjs) shows a GET payment wrapper; a client for this SKU must POST the body on both the probe and the paid retry.

## JSON body

`Content-Type: application/json`.

| Field | In `content_sha256` | Rule |
|---|---|---|
| `schema_version` | yes | `"1.0"` |
| `type` | yes | `"social_post_attestation"` |
| `platform` | yes | short name; X-boss play uses `"x"` |
| `post_url` | yes | public permalink of the post |
| `post_id` | yes | platform id as a string, or `null` (X ids exceed 2^53) |
| `author_handle` | yes | handle without `@` |
| `author_name` | yes | display name, or `null` |
| `post_text` | yes | exact public text. Do not paraphrase |
| `posted_at` | yes | ISO-8601 string, or `null` if unknown |
| `shard0_memo` | no | `true` requests the optional Shard0 memo |

The nine hashed keys are always present. Use `null` for an unknown optional value so two clients hash the same post the same way.

## Canonicalize

Same rules as the LinkedIn demo ([public verify page](https://scdo.com.au/agent-ledger/attestations/li-20261023/), type `linkedin_thread_attestation`, marker `SCDO-LI-ATTEST-v1`). This SKU changes the key set and the marker.

1. Take the hashed payload with only these keys: `author_handle`, `author_name`, `platform`, `post_id`, `post_text`, `post_url`, `posted_at`, `schema_version`, `type`. Leave out `shard0_memo`, `content_sha256`, network, chain, and tx fields.
2. Recursively sort object keys lexicographically. Array order stays as sent.
3. Serialize with `JSON.stringify` (compact, no extra whitespace). Unicode is escaped only as JSON requires.
4. SHA-256 the UTF-8 bytes of that string. Lowercase hex is `content_sha256`.

Worked sample (placeholder post, not a live attestation). Exact bytes: [`examples/attest-canonical.json`](../examples/attest-canonical.json) (no trailing newline).

```text
content_sha256 = 88b22ad42a28ed2eafbd837b031a449bc90f71df8d528f814d97857f9f595d43
canonical_byte_length = 356
```

```bash
python3 -c "import hashlib,pathlib; print(hashlib.sha256(pathlib.Path('examples/attest-canonical.json').read_bytes()).hexdigest())"
```

Optional memo, when the service anchors it on SCDO Shard0 (chainId `5680`): UTF-8 input data

```text
SCDO-X-ATTEST-v1:0x88b22ad42a28ed2eafbd837b031a449bc90f71df8d528f814d97857f9f595d43
```

with `{sha256}` replaced by the real `content_sha256`. The memo string is not part of the hash.

## Settled response

The gateway returns this shape after a successful settle. `<id>` is assigned by the service. `payment.tx` is the Base settlement hash from that call. This document does not publish one.

```json
{
  "ok": true,
  "id": "<id>",
  "type": "social_post_attestation",
  "content_sha256": "<lowercase hex sha256>",
  "verify_url": "https://scdo.com.au/agent-ledger/attestations/<id>/",
  "shard0_memo": "SCDO-X-ATTEST-v1:0x<content_sha256>",
  "payment": {
    "tx": "<Base settlement tx from this call>",
    "payer": "<payer address>",
    "network": "eip155:8453"
  }
}
```

`shard0_memo` is present when the optional memo was anchored. The public page for that id follows `https://scdo.com.au/agent-ledger/attestations/<id>/` (same path pattern as `…/attestations/li-20261023/`).

## X-boss play

For a target decision-maker who already posts on X:

1. Take the exact public text of one of their posts.
2. `POST` it to `https://scdo.com.au/api/x402/attest` and pay 0.01 USDC on Base once the unpaid call returns 402.
3. Reply on that post with `verify_url`.

The reply is the proof. The first touch is an on-chain record of their own words, which is value-first. It is not a cold email.
