// Call an x402 (HTTP 402) endpoint and pay in USDC on Base.
// npm i x402-fetch viem   then   PAYER_KEY=0x... node x402-pay.mjs https://service.example/paid
// Flow: GET -> 402 + payment requirements -> sign EIP-3009 USDC authorization -> retry with X-PAYMENT -> 200.
import { wrapFetchWithPayment } from "x402-fetch";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.PAYER_KEY);
const fetchWithPay = wrapFetchWithPayment(fetch, account); // default cap: 0.1 USDC per request
const res = await fetchWithPay(process.argv[2]);
console.log(res.status, await res.text());
console.log("settlement:", res.headers.get("x-payment-response"));
