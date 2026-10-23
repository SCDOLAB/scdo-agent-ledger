# LinkedIn thread attestation — 2026-10-23

Anchors the SCDO Agent Ledger LinkedIn thread (Ying ZHANG post + Michael Blake comment + Ying ZHANG reply) on **SCDO Shard0** (eip155:5680).

## Public verify

- Page: https://scdo.com.au/agent-ledger/attestations/li-20261023/
- JSON: https://scdo.com.au/agent-ledger/attestations/li-20261023/attestation.json
- LinkedIn: https://www.linkedin.com/feed/update/urn:li:activity:7518847737325477889/

## On-chain

- Marker: `SCDO-LI-ATTEST-v1:0x` + `content_sha256`
- Signer: SCDO CEO agent `0x9F415DDd86Bde7e493CDF5272B0579ba56b60b72` (tokenId 31)
- See `tx.txt` and `attestation.json` for tx hash + explorer link

## Canonicalize / content_sha256

1. Take the hashed payload object with keys only:
   `comments`, `linkedin_activity_urn`, `linkedin_url`, `parties`, `post_text`, `posted_at`, `reply`, `schema_version`, `type`, `verification_api`
   (no `content_sha256`, no `network`, no chain/tx fields).
2. Recursively sort all object keys lexicographically (array element order is preserved).
3. Serialize with `JSON.stringify` (compact, no extra whitespace).
4. SHA-256 over the UTF-8 bytes of that string; lowercase hex → `content_sha256`.

Reference bytes: `canonical-hashed.json` (must hash to the `content_sha256` in `attestation.json`).

```bash
sha256sum canonical-hashed.json
# or: python3 -c "import hashlib,pathlib; print(hashlib.sha256(pathlib.Path('canonical-hashed.json').read_bytes()).hexdigest())"
```

## Files

| File | Purpose |
|------|---------|
| attestation.json | Full public record (conversation text + hash + tx) |
| verify.html | Human-readable verify page |
| canonical-hashed.json | Exact bytes hashed for content_sha256 |
| content_sha256.txt | Hex digest |
| tx.txt | Tx hash + confirmation notes |
| proof-card.png | Shareable proof image |
| README.md | This file |
