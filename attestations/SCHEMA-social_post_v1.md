# social_post_attestation v1

Hashed payload for `POST https://scdo.com.au/api/x402/attest`. Canonicalize rules and the worked sample live in [`docs/x402-attest.md`](../docs/x402-attest.md).

`schema_version` is `"1.0"`. `type` is `"social_post_attestation"`.

This file describes the social-post record. It does not replace [`attestations/li-20261023/`](https://scdo.com.au/agent-ledger/attestations/li-20261023/), which is a `linkedin_thread_attestation` with marker `SCDO-LI-ATTEST-v1`.

## Hashed fields

These nine keys are the only inputs to `content_sha256`. Every key is present. Unknown optionals are JSON `null`.

| Field | JSON type | Notes |
|---|---|---|
| `schema_version` | string | `"1.0"` |
| `type` | string | `"social_post_attestation"` |
| `platform` | string | Short platform name. This GTM uses `"x"` |
| `post_url` | string | Public permalink |
| `post_id` | string or null | Platform post id. Keep it a string |
| `author_handle` | string | Handle with no leading `@` |
| `author_name` | string or null | Display name when known |
| `post_text` | string | Exact public post text, including line breaks |
| `posted_at` | string or null | ISO-8601 time of the post, or `null` |

Object keys are sorted lexicographically before hashing. Array order is preserved. Compact `JSON.stringify`, then SHA-256 over the UTF-8 bytes, lowercase hex.

## Request-only field

| Field | JSON type | Notes |
|---|---|---|
| `shard0_memo` | boolean | `true` asks the service to anchor `SCDO-X-ATTEST-v1:0x{sha256}` on SCDO Shard0 (chainId 5680). Not hashed |

## Record fields the service may add

These are outside the hash. They show up on the verify page and in the settled JSON. Do not invent a Base settlement hash or a Shard0 memo tx; the service fills them after it actually settles and anchors.

| Field | Notes |
|---|---|
| `content_sha256` | Lowercase hex digest of the hashed payload |
| `id` | Service-assigned id. Verify URL is `https://scdo.com.au/agent-ledger/attestations/<id>/` |
| `verify_url` | That URL |
| `network` | Payment network `eip155:8453` |
| `shard0_memo` | UTF-8 memo `SCDO-X-ATTEST-v1:0x` + `content_sha256`, when anchored |
| `payment.tx` | Base USDC settlement transaction for this call |
| `payment.payer` | Address that paid |
| `payment.network` | `eip155:8453` |

Price for the call that creates the record: 0.01 USDC, `amountAtomic` 10000, `payTo` `0x105c14379874E0Ff5287a2f5214146ed1b9FC866`.
