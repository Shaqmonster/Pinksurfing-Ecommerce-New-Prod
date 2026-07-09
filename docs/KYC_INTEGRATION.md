# KYC integration (ecommerce)

Seller and gig-worker identity verification runs on **SSO**, not on the marketplace API or in-browser Didit SDK.

## Canonical documentation

Full API reference, step-by-step flow, file checklist, and code samples:

**[sso/KYC_CONSUMER_INTEGRATION.md](../../sso/KYC_CONSUMER_INTEGRATION.md)** — Part 2 (Ecommerce)

SSO server setup (Didit keys, webhooks):

**[sso/KYC.md](../../sso/KYC.md)**

## Summary

| Action | API |
|--------|-----|
| Check status | `GET https://auth.pinksurfing.com/api/user/` or `/api/kyc/status/` |
| Start verification | `POST https://auth.pinksurfing.com/api/kyc/launch/` with `{ "return_url": "..." }` |
| Open | Redirect browser to response `kyc_url` |

**Stop using:** `VITE_SERVER_URL/api/identity/*` and `@didit-protocol/sdk-web`.

## Env

```env
VITE_AUTH_URL=https://auth.pinksurfing.com
```
