# Backend Requirements — Snapshot & Share

Scope: support the frontend "Snapshot & Share" feature (branded PNG export of trading data).
The frontend renders and exports images entirely client-side; **no image is ever uploaded or stored**.
This document lists what the backend must provide or confirm.

Status keys: **Required** (blocks a shipped feature), **Recommended** (hardening/consistency), **Deferred**.

---

## 1. CORS-enabled token logo URLs — **Required**

The snapshot cards now render token icons for every asset (`src/components/snapshot/token-icon.tsx`).

- Icons come from `GET /listedTokens` (`logo` / `image` / `icon` field) via `useTokenIconMap()`.
- The frontend fetches each logo URL, converts it to a data URI (`src/lib/snapshot/images.ts`), and inlines it so the PNG export is self-contained.
- `html-to-image` cannot rasterize cross-origin images without CORS, and the capture now **fails** with `image-load-failed` if any `<img>` in the card does not load.

Requirements:

1. Logo URLs must be absolute HTTPS URLs on a CDN that returns
   `Access-Control-Allow-Origin: *` (or the app origins) for `GET`.
2. Responses must be real images with a correct `Content-Type` (`image/png`, `image/svg+xml`, `image/webp`).
3. No redirect chain to a non-CORS host; if redirects are used, every hop must send CORS headers.
4. URLs must be stable/long-lived (they are cached in-memory for the session; `staleTime: Infinity`).
5. Cache headers (`Cache-Control: public, max-age≥86400`) recommended.

Acceptance: from a browser on the app origin, `fetch(logoUrl, { mode: "cors" })` resolves and returns an image blob for every listed token.

---

## 2. Stable, canonical field names — **Required**

The frontend currently maps multiple shapes defensively. Snapshot cards silently degrade when a field is missing. Please standardize (or confirm these are the canonical names and will not change):

### 2.1 Margin orders — open orders

Endpoint used: `tradingService.fetchMarginOpenOrders`.

| Purpose | Accepted today | Requested canonical |
|---|---|---|
| Pair label | `pair`, or `base` + `quote` | `pair` (`"BTC/USDT"`) |
| Side | `side` | `side` (`BUY`/`SELL`) |
| Type | `type` / `orderType` | `type` |
| Price | `price` | `price` (string or number, consistent) |
| Amount | `amount` / `quantity` | `quantity` |
| Filled | `filled` | `filled` |
| Status | `status` / `orderStatus` | `status` |
| Created time | `createdAt` | `createdAt` (ISO-8601 UTC) |
| Id | `id` / `orderId` | `id` |

### 2.2 Margin orders — order history

Endpoint used: `tradingService.marginOrderHistory`. Same fields as 2.1, plus `orderStatus` is currently read first. Please expose one of `status`/`orderStatus` consistently.

### 2.3 Convert history

Endpoint used: `tradingService.convertHistory`.

| Purpose | Accepted today | Requested canonical |
|---|---|---|
| Id | `id` | `id` |
| Time | `createdAt` | `createdAt` (ISO-8601 UTC) |
| From asset | `from` | `from` (symbol, uppercase) |
| To asset | `to` | `to` (symbol, uppercase) |
| From amount | `fromAmount` | `fromAmount` |
| To amount | `toAmount` | `toAmount` |
| Rate | `rate` | `rate` |
| Status | `status` | `status` |

### 2.4 P2P order (matched order)

Endpoints used: `p2p.getMatchedOrder(id)` and `p2p.getOrderById(id)`. The share card only uses the fields below (allow-listed in `src/lib/p2p/share-data.ts`):

| Purpose | Accepted today | Requested canonical |
|---|---|---|
| Asset | `asset` | `asset` |
| Fiat | `fiatCurrency` (fallback `currency`, `fiat`) | `fiatCurrency` |
| Amount (crypto) | `quantity` (fallback `amount`) | `quantity` |
| Total (fiat) | `fiatAmount` | `fiatAmount` |
| Unit price | derived (`fiatAmount / quantity`), fallback `fixedPrice`, `price`, `unitPrice` | return `unitPrice` explicitly |
| Status | `status` (also `PARTIALLY_COMPLETED`, `FULFILLED`) | `status` |
| Order number | `orderId` (fallback `id`) | `orderId` |
| Counterparty nickname | `counterpartyName`, nested `buyer`/`seller`/`advertiser`/`matcher` names | `counterpartyName` (nickname only, never email/phone) |
| Created time | `createdAt`, `matchedAt` | `createdAt` (ISO-8601 UTC) |

Acceptance: the fields above are non-null on populated records and do not change shape between REST responses and WebSocket updates (the P2P room re-renders from WS payloads).

---

## 3. Timestamps and timezone — **Required**

- All timestamps (`createdAt`, `matchedAt`, `updatedAt`, `expiryTime`) must be ISO-8601 with an explicit offset or `Z` (e.g. `2026-11-13T09:41:00Z`). The Go-style `"2024-05-01 10:00:00 +0000 UTC"` format is currently parsed defensively; returning ISO-8601 removes the risk.
- `GET /user/settings` must continue to return `timezone` (IANA name, e.g. `Africa/Lagos`). The snapshot footer formats the capture timestamp in the user's timezone; an invalid value falls back to the browser locale.

Acceptance: `timezone` is an IANA identifier; unknown values are not returned.

---

## 4. Order-id length and format — **Recommended**

Snapshot order numbers are masked to `******` + the **last 6 characters**. Ids of 6 characters or fewer are masked completely (no tail). To keep the share image useful without exposing full ids:

- Use ids of at least 8 characters.
- Do not put sequential account data in ids.
- If a public reference format exists (e.g. `MN-2024-…`), confirm it is safe to display 6 trailing characters.

---

## 5. Data minimization for P2P responses — **Recommended**

The P2P share card never requests payment details, bank/account data, phone, email, payment proof, payment instructions, chat, or dispute content. The frontend enforces an allow-list, but defense-in-depth is preferable:

- Confirm which endpoints (matched order, order by id) return `paymentMethod` / bank fields, and to whom.
- Only return payment/bank details to the paying party after the order is matched and while the order is in a payable state.
- Never include counterparty email/phone in matched-order payloads; return a display nickname that is safe to show in a shared image.
- Do not return chat message bodies in order payloads (chat is a separate channel endpoint).

Acceptance: a signed-in participant reviewing their own matched-order response sees no counterparty email/phone; unauthenticated access is rejected.

---

## 6. Share link / QR code — **Deferred**

The QR code was removed from the snapshot frame for this release (no public share URL exists yet). If product wants QR codes on the exported image later:

1. Provide a public, non-authenticated share endpoint: `GET /share/order/:token` returning a minimal, pre-approved HTML/OG card (no PII, no balances).
2. Token must be opaque, high-entropy, revocable, and expire (suggest 30–90 days).
3. The frontend will pass that URL into `SnapshotFrame` (`shareUrl` prop was removed; it would be reintroduced).

Until then: no backend work required.

---

## 7. Analytics / share events — **Deferred (skipped for now)**

Product decision: no analytics for snapshot/share in this release. If it changes, the backend/frontend will need an event ingestion endpoint. Not required now.

---

## 8. Test data for QA — **Recommended**

Please provide/seed accounts and records that let QA verify edge cases:

- P2P order with a long `orderId` and a completed status; one cancelled; one disputed.
- Margin open orders and margin order history with `LIMIT` and `MARKET` types.
- Convert history with at least 10 rows.
- A token whose logo is served from the production CDN (CORS-verified) and one asset **without** a logo (icon must be omitted without breaking export).
- Records with missing optional fields (no `unitPrice`, no `fiatAmount`, empty `pair`) to confirm graceful fallbacks.

---

## 9. Quick checklist

| # | Item | Priority | Status |
|---|---|---|---|
| 1 | CORS headers on token logo CDN | Required | ☐ |
| 2 | Canonical fields: margin open/history, convert history, P2P | Required | ☐ |
| 3 | ISO-8601 timestamps + IANA `timezone` in settings | Required | ☐ |
| 4 | Order ids ≥ 8 chars, safe trailing 6 chars | Recommended | ☐ |
| 5 | P2P response data minimization | Recommended | ☐ |
| 6 | QA seed data / fixtures | Recommended | ☐ |
| 7 | Public share URL + QR | Deferred | ☐ |
| 8 | Analytics endpoint | Deferred | ☐ |
