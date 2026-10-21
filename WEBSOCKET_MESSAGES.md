# Limiance WebSocket Client-to-Server Messages Reference

> **Target Audience:** Frontend Developers (Web, iOS, Android, Desktop) & Algorithmic Traders.  
> **Protocol:** JSON-RPC style frames over persistent WebSocket.  
> **Endpoints:**
> - Production: `wss://api.limiance.com/ws` (or `wss://api.limiance.com/api/v1/ws`)
> - Staging / Local: `ws://localhost:8080/ws`
> 
> **Authentication:** Pass the JWT access token in the connection handshake URL query string:
> ```
> wss://<host>/ws?token=<jwt_access_token>
> ```
> - **Guest Viewers:** Connections without a token or with a token resolving to a `viewer-*` identity can access public feeds only (Order Books, Klines/Candles, Recent Trades, Market Tickers, Futures Tickers). All private trading, portfolio, balance, chat, and P2P operations require authenticated JWT credentials.
> - **Heartbeat:** Standard RFC-6455 Ping/Pong is supported by the server. Clients may send WebSocket Ping frames every 30 seconds; the server responds with Pong.

---

## Table of Contents
1. [General Frame Envelope Specification](#1-general-frame-envelope-specification)
2. [Order Placement & Trading Lifecycle Guide (End-to-End Workflow)](#2-order-placement--trading-lifecycle-guide-end-to-end-workflow)
   - 2.1 [Trading Message Types Master Matrix](#21-trading-message-types-master-matrix)
   - 2.2 [Standard Order Placement Sequence & State Transitions](#22-standard-order-placement-sequence--state-transitions)
   - 2.3 [Supported Order Types & Execution Modifiers](#23-supported-order-types--execution-modifiers)
   - 2.4 [Order Status Lifecycle States](#24-order-status-lifecycle-states)
   - 2.5 [Risk Limits, Sizing & Price Band Collars](#25-risk-limits-sizing--price-band-collars)
3. [Spot Trading Order Entry & History](#3-spot-trading-order-entry--history)
   - 3.1 [Place Spot Limit Order (BUY)](#31-place-spot-limit-order-buy)
   - 3.2 [Place Spot Limit Order (SELL)](#32-place-spot-limit-order-sell)
   - 3.3 [Place Spot Market Order (BUY)](#33-place-spot-market-order-buy)
   - 3.4 [Place Spot Market Order (SELL)](#34-place-spot-market-order-sell)
   - 3.5 [Place Spot Order with Take-Profit & Stop-Loss (TP/SL)](#35-place-spot-order-with-take-profit--stop-loss-tpsl)
   - 3.6 [Place Spot Order with Immediate-or-Cancel (IOC)](#36-place-spot-order-with-immediate-or-cancel-ioc)
   - 3.7 [Place Spot Order with Fill-or-Kill (FOK)](#37-place-spot-order-with-fill-or-kill-fok)
   - 3.8 [Place Spot Maker Post-Only Order (`postOnly: true`)](#38-place-spot-maker-post-only-order-postonly-true)
   - 3.9 [Place Spot Good-'Til-Date Order (GTD with `expireTime`)](#39-place-spot-good-til-date-order-gtd-with-expiretime)
   - 3.10 [Place Spot Order Using Field Aliases (`pair`, `qty`, `order_type`)](#310-place-spot-order-using-field-aliases-pair-qty-order_type)
   - 3.11 [Cancel Spot Order by `orderId`](#311-cancel-spot-order-by-orderid)
   - 3.12 [Cancel Spot Order Using Aliases (`order_id`, `id`)](#312-cancel-spot-order-using-aliases-order_id-id)
   - 3.13 [Get Spot Order History - Default (Page 1, Limit 50)](#313-get-spot-order-history---default-page-1-limit-50)
   - 3.14 [Get Spot Order History - Filtered by Status (OPEN, FILLED, CANCELLED, REJECTED)](#314-get-spot-order-history---filtered-by-status-open-filled-cancelled-rejected)
   - 3.15 [Get Spot Order History - Custom Pagination](#315-get-spot-order-history---custom-pagination)
   - 3.16 [Get User Spot Trade Executions](#316-get-user-spot-trade-executions)
4. [Margin Trading Order Entry, History & Account](#4-margin-trading-order-entry-history--account)
   - 4.1 [Place Margin Limit BUY Order with Leverage](#41-place-margin-limit-buy-order-with-leverage)
   - 4.2 [Place Margin Limit SELL Order with Leverage](#42-place-margin-limit-sell-order-with-leverage)
   - 4.3 [Place Margin Market Order](#43-place-margin-market-order)
   - 4.4 [Place Margin Order with Explicit `marginUsed`](#44-place-margin-order-with-explicit-marginused)
   - 4.5 [Place Margin Order with Protection TP/SL](#45-place-margin-order-with-protection-tpsl)
   - 4.6 [Place Margin Order with IOC / FOK TimeInForce](#46-place-margin-order-with-ioc--fok-timeinforce)
   - 4.7 [Place Margin Maker Post-Only Order](#47-place-margin-maker-post-only-order)
   - 4.8 [Cancel Margin Order by `orderId`](#48-cancel-margin-order-by-orderid)
   - 4.9 [Cancel Margin Conditional/OCO Order](#49-cancel-margin-conditionaloco-order)
   - 4.10 [Get Margin Order History - Default](#410-get-margin-order-history---default)
   - 4.11 [Get Margin Order History - Filtered by Status & Custom Pagination](#411-get-margin-order-history---filtered-by-status--custom-pagination)
   - 4.12 [Get User Margin Trade Executions](#412-get-user-margin-trade-executions)
   - 4.13 [Subscribe to Margin Account Stream (Equity, Margin Level, Liabilities)](#413-subscribe-to-margin-account-stream-equity-margin-level-liabilities)
5. [Futures / Derivatives Trading](#5-futures--derivatives-trading)
   - 5.1 [Place Futures Limit LONG Order (Cross Margin Mode)](#51-place-futures-limit-long-order-cross-margin-mode)
   - 5.2 [Place Futures Limit SHORT Order (Isolated Margin Mode)](#52-place-futures-limit-short-order-isolated-margin-mode)
   - 5.3 [Place Futures Market LONG Order](#53-place-futures-market-long-order)
   - 5.4 [Place Futures Market SHORT Order](#54-place-futures-market-short-order)
   - 5.5 [Place Futures Order with TP/SL Triggers](#55-place-futures-order-with-tpsl-triggers)
   - 5.6 [Place Futures Order Using Field Aliases (`symbol`, `margin_mode`, `qty`)](#56-place-futures-order-using-field-aliases-symbol-margin_mode-qty)
   - 5.7 [Close Futures Position by `positionId`](#57-close-futures-position-by-positionid)
   - 5.8 [Close Futures Position Using Aliases (`position_id`, `id`)](#58-close-futures-position-using-aliases-position_id-id)
   - 5.9 [Subscribe to Live Futures Open Positions](#59-subscribe-to-live-futures-open-positions)
   - 5.10 [Get Futures Closed Positions & PnL History](#510-get-futures-closed-positions--pnl-history)
   - 5.11 [Subscribe to Real-Time Funding Rate](#511-subscribe-to-real-time-funding-rate)
   - 5.12 [Subscribe to Market-Wide Futures 24h Ticker & Index Feed](#512-subscribe-to-market-wide-futures-24h-ticker--index-feed)
6. [Public Market Feeds & Subscriptions](#6-public-market-feeds--subscriptions)
   - 6.1 [Subscribe to Spot Order Book (`BTCUSDT`)](#61-subscribe-to-spot-order-book-btcusdt)
   - 6.2 [Subscribe to Margin Order Book (`ETHUSDT`)](#62-subscribe-to-margin-order-book-ethusdt)
   - 6.3 [Subscribe to Futures Order Book (`BTC-PERP` / `BTC/USDT`)](#63-subscribe-to-futures-order-book-btc-perp--btcusdt)
   - 6.4 [Subscribe to Public Recent Trades Stream - Default Limit](#64-subscribe-to-public-recent-trades-stream---default-limit)
   - 6.5 [Subscribe to Public Recent Trades Stream - Custom Limit](#65-subscribe-to-public-recent-trades-stream---custom-limit)
   - 6.6 [Subscribe to Recent Trades Using Aliases (`get_spot_recent_trades`, `get_futures_recent_trades`)](#66-subscribe-to-recent-trades-using-aliases-get_spot_recent_trades-get_futures_recent_trades)
   - 6.7 [Subscribe to Market-Wide 24h Ticker Feed (Spot & Margin)](#67-subscribe-to-market-wide-24h-ticker-feed-spot--margin)
   - 6.8 [Subscribe to OHLCV Candles - Minute Intervals (`1m`, `5m`, `15m`, `30m`)](#68-subscribe-to-ohlcv-candles---minute-intervals-1m-5m-15m-30m)
   - 6.9 [Subscribe to OHLCV Candles - Hourly Intervals (`1h`, `4h`, `12h`)](#69-subscribe-to-ohlcv-candles---hourly-intervals-1h-4h-12h)
   - 6.10 [Subscribe to OHLCV Candles - Daily / Weekly / Monthly (`1d`, `1w`, `1M`)](#610-subscribe-to-ohlcv-candles---daily--weekly--monthly-1d-1w-1m)
   - 6.11 [Subscribe to Margin Candles & Live Stream Aliases (`get_spot_candles_live`, `get_margin_candles_live`)](#611-subscribe-to-margin-candles--live-stream-aliases-get_spot_candles_live-get_margin_candles_live)
7. [Private Account & Portfolio Telemetry](#7-private-account--portfolio-telemetry)
   - 7.1 [Subscribe to Live User Order Executions (`user_order_update`)](#71-subscribe-to-live-user-order-executions-user_order_update)
   - 7.2 [Subscribe to Total / Overall Portfolio Balance](#72-subscribe-to-total--overall-portfolio-balance)
   - 7.3 [Subscribe to Spot Portfolio Balance](#73-subscribe-to-spot-portfolio-balance)
   - 7.4 [Subscribe to Margin Portfolio Balance](#74-subscribe-to-margin-portfolio-balance)
   - 7.5 [Subscribe to Futures Portfolio Balance](#75-subscribe-to-futures-portfolio-balance)
   - 7.6 [Subscribe to Funding Wallet Balance](#76-subscribe-to-funding-wallet-balance)
   - 7.7 [Subscribe to Balance Using Aliases (`get_spot_balance`, `get_funding_balance`, etc.)](#77-subscribe-to-balance-using-aliases-get_spot_balance-get_funding_balance-etc)
   - 7.8 [Subscribe to Portfolio Asset Allocations Breakdown](#78-subscribe-to-portfolio-asset-allocations-breakdown)
   - 7.9 [Subscribe to Full Paginated Portfolio Asset List](#79-subscribe-to-full-paginated-portfolio-asset-list)
   - 7.10 [Subscribe to Paginated Portfolio with Asset Search Filter](#710-subscribe-to-paginated-portfolio-with-asset-search-filter)
8. [Live Support & P2P Order Chat](#8-live-support--p2p-order-chat)
   - 8.1 [Send Chat Message](#81-send-chat-message)
   - 8.2 [Get Active Chat Conversations List](#82-get-active-chat-conversations-list)
   - 8.3 [Get Chat Message History - Default Pagination](#83-get-chat-message-history---default-pagination)
   - 8.4 [Get Chat Message History - Custom Page & Limit](#84-get-chat-message-history---custom-page--limit)
   - 8.5 [Send Typing Indicator (Started Typing)](#85-send-typing-indicator-started-typing)
   - 8.6 [Send Typing Indicator (Stopped Typing)](#86-send-typing-indicator-stopped-typing)
9. [Peer-to-Peer (P2P) Trading Operations & Escrow](#9-peer-to-peer-p2p-trading-operations--escrow)
   - 9.1 [Create P2P BUY Ad (Fixed Price, Single Payment Method)](#91-create-p2p-buy-ad-fixed-price-single-payment-method)
   - 9.2 [Create P2P SELL Ad (Fixed Price, Multiple Payment Methods Array)](#92-create-p2p-sell-ad-fixed-price-multiple-payment-methods-array)
   - 9.3 [Create P2P Ad with Floating Price](#93-create-p2p-ad-with-floating-price)
   - 9.4 [Create P2P Ad with Comma-Separated Payment Methods String](#94-create-p2p-ad-with-comma-separated-payment-methods-string)
   - 9.5 [Edit P2P Ad - Update Price and Floating Price Flag](#95-edit-p2p-ad---update-price-and-floating-price-flag)
   - 9.6 [Edit P2P Ad - Update Min/Max Quantity, Duration and Remark](#96-edit-p2p-ad---update-minmax-quantity-duration-and-remark)
   - 9.7 [Edit P2P Ad - Update Payment Methods and Country](#97-edit-p2p-ad---update-payment-methods-and-country)
   - 9.8 [Deactivate Single P2P Ad (`action: "deactivate"`)](#98-deactivate-single-p2p-ad-action-deactivate)
   - 9.9 [Reactivate Single P2P Ad (`action: "reactivate"`)](#99-reactivate-single-p2p-ad-action-reactivate)
   - 9.10 [Toggle Ad Status Using Dedicated Action Types (`p2p_deactivate_order`, `p2p_reactivate_order`)](#910-toggle-ad-status-using-dedicated-action-types-p2p_deactivate_order-p2p_reactivate_order)
   - 9.11 [Toggle Ad Status Using Boolean Flags (`is_active: false` / `is_active: true`)](#911-toggle-ad-status-using-boolean-flags-is_active-false--is_active-true)
   - 9.12 [Deactivate / Reactivate ALL User Ads (Omitting `order_id`)](#912-deactivate--reactivate-all-user-ads-omitting-order_id)
   - 9.13 [Query Public P2P Ads - Default (Page 1, Limit 20)](#913-query-public-p2p-ads---default-page-1-limit-20)
   - 9.14 [Query Public P2P Ads - Filter by Asset, Fiat and Type (`BUY` / `SELL`)](#914-query-public-p2p-ads---filter-by-asset-fiat-and-type-buy--sell)
   - 9.15 [Query Public P2P Ads - Filter by Payment Method, Country and Minimum Quantity](#915-query-public-p2p-ads---filter-by-payment-method-country-and-minimum-quantity)
   - 9.16 [Subscribe to Real-Time P2P Ads Feed (`subscribe_p2p_orders`)](#916-subscribe-to-real-time-p2p-ads-feed-subscribe_p2p_orders)
   - 9.17 [Get User's Own P2P Ads - All Ads](#917-get-users-own-p2p-ads---all-ads)
   - 9.18 [Get User's Own P2P Ads - Filtered by Status, Asset and Currency](#918-get-users-own-p2p-ads---filtered-by-status-asset-and-currency)
   - 9.19 [Match P2P Ad / Taker Order Entry (`p2p_match_order`)](#919-match-p2p-ad--taker-order-entry-p2p_match_order)
   - 9.20 [Subscribe to Live P2P Trade Room (`subscribe_p2p_match`)](#920-subscribe-to-live-p2p-trade-room-subscribe_p2p_match)
   - 9.21 [Update Trade Match Status - Buyer Marks Paid (`status: "PAID"`)](#921-update-trade-match-status---buyer-marks-paid-status-paid)
   - 9.22 [Update Trade Match Status - Cancel Order Match (`status: "CANCELLED"`)](#922-update-trade-match-status---cancel-order-match-status-cancelled)
   - 9.23 [Update Trade Match Status - Open Dispute (`status: "DISPUTED"`)](#923-update-trade-match-status---open-dispute-status-disputed)
   - 9.24 [Request Escrow Release Code (`p2p_request_release_code`)](#924-request-escrow-release-code-p2p_request_release_code)
   - 9.25 [Release Escrow Asset to Counterparty (`p2p_release_order`)](#925-release-escrow-asset-to-counterparty-p2p_release_order)
   - 9.26 [Get Single P2P Match Details (`get_p2p_match`)](#926-get-single-p2p-match-details-get_p2p_match)
   - 9.27 [Get User's Trade Match History - All Matches](#927-get-users-trade-match-history---all-matches)
   - 9.28 [Get User's Trade Match History - Filtered by Status (`PENDING`, `PAID`, `COMPLETED`, `DISPUTED`)](#928-get-users-trade-match-history---filtered-by-status-pending-paid-completed-disputed)
10. [Subscription Teardown & Unsubscribe Handlers](#10-subscription-teardown--unsubscribe-handlers)
   - 10.1 [Unsubscribe from Spot/Margin Order Book](#101-unsubscribe-from-spotmargin-order-book)
   - 10.2 [Unsubscribe from Futures Order Book](#102-unsubscribe-from-futures-order-book)
   - 10.3 [Unsubscribe from Spot/Margin Market Ticker Feed](#103-unsubscribe-from-spotmargin-market-ticker-feed)
   - 10.4 [Unsubscribe from Futures Market Ticker Feed](#104-unsubscribe-from-futures-market-ticker-feed)
   - 10.5 [Unsubscribe from Recent Trades Stream](#105-unsubscribe-from-recent-trades-stream)
   - 10.6 [Unsubscribe from User Live Order Executions](#106-unsubscribe-from-user-live-order-executions)
   - 10.7 [Unsubscribe from Internal OHLCV Candles](#107-unsubscribe-from-internal-ohlcv-candles)
   - 10.8 [Unsubscribe from Live Klines Stream](#108-unsubscribe-from-live-klines-stream)
   - 10.9 [Unsubscribe from Total Portfolio Balance](#109-unsubscribe-from-total-portfolio-balance)
   - 10.10 [Unsubscribe from Specific Account Balance (Spot, Margin, Futures, Funding)](#1010-unsubscribe-from-specific-account-balance-spot-margin-futures-funding)
   - 10.11 [Unsubscribe from Portfolio Balance Allocations](#1011-unsubscribe-from-portfolio-balance-allocations)
   - 10.12 [Unsubscribe from Portfolio Assets Stream](#1012-unsubscribe-from-portfolio-assets-stream)
   - 10.13 [Unsubscribe from Margin Account Stream](#1013-unsubscribe-from-margin-account-stream)
   - 10.14 [Unsubscribe from Futures Positions Stream](#1014-unsubscribe-from-futures-positions-stream)
   - 10.15 [Unsubscribe from Funding Rate Stream for a Pair](#1015-unsubscribe-from-funding-rate-stream-for-a-pair)
   - 10.16 [Unsubscribe from Public P2P Ads Stream](#1016-unsubscribe-from-public-p2p-ads-stream)
   - 10.17 [Unsubscribe from P2P Live Match Room](#1017-unsubscribe-from-p2p-live-match-room)
   - 10.18 [Unsubscribe from All Active Streams on Connection](#1018-unsubscribe-from-all-active-streams-on-connection)
11. [Server Response Frames Reference](#11-server-response-frames-reference)

---

## 1. General Frame Envelope Specification

All client requests sent to the WebSocket endpoint **MUST** be serialized JSON matching this top-level envelope:

```json
{
  "type": "string",
  "request_id": "string (optional UUIDv4 recommended for tracking)",
  "data": { ... }
}
```

### Top-Level Envelope Keys
| Key | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | **Yes** | Handler action identifier (e.g. `place_spot_order`, `get_spot_order_books`, `p2p_create_order`). |
| `request_id` | `string` | No (Recommended) | Unique client correlation ID (e.g. `"req-10293"`). Echoed back verbatim in execution confirmations and error frames. |
| `data` | `object` | **Yes** | Action-specific payload dictionary. Must be an object (`{}`). Never pass `null` or omit this field. |

---

## 2. Order Placement & Trading Lifecycle Guide (End-to-End Workflow)

This section provides the master reference for any developer or algorithmic trader implementing trading on Limiance. It outlines the exact sequence of WebSocket frames required to inspect markets, enter orders, track executions in real time, and audit trade history.

### 2.1. Trading Message Types Master Matrix

| Trading Phase | Action | Client Message `type` | Canonical Aliases | Primary Input Parameters | Server Response Frame |
|---|---|---|---|---|---|
| **Pre-Trade Telemetry** | Stream Live Execution Fills | `get_user_order_updates` | - | `{}` | Continuous `user_order_update` |
| **Pre-Trade Telemetry** | Check Spot Available Balance | `get_portfolio_balance` | `get_spot_balance`, `get_spot_portfolio_balance` | `{"account": "spot"}` | `portfolio_balance` |
| **Pre-Trade Telemetry** | Check Margin Health & Collateral | `get_margin_account` | - | `{}` | `margin_account` |
| **Pre-Trade Telemetry** | Check Futures Available Balance | `get_portfolio_balance` | `get_futures_balance` | `{"account": "futures"}` | `portfolio_balance` |
| **Market Observation** | Stream Spot L2 Order Book Depth | `get_spot_order_books` | - | `{"pair": "BTCUSDT"}` | `order_book_stream_started`, `order_book` |
| **Market Observation** | Stream Margin L2 Order Book Depth | `get_margin_order_books` | - | `{"pair": "ETHUSDT"}` | `order_book_stream_started`, `order_book` |
| **Market Observation** | Stream Futures L2 Order Book Depth | `get_futures_order_books` | - | `{"pair": "BTC-PERP"}` | `futures_order_book_stream_started`, `order_book` |
| **Market Observation** | Stream Live Recent Trades & Fills | `get_trades` | `get_recent_trades`, `trades` | `{"pair": "BTCUSDT", "limit": "500"}` | `recent_trades`, continuous `trade` |
| **Market Observation** | Stream Live OHLCV Candles | `get_spot_candles` | `get_spot_candles_live`, `get_margin_candles` | `{"pair": "BTCUSDT", "interval": "1m"}` | `candle_stream_started`, continuous `candle` |
| **Market Observation** | Stream Perpetual Funding Rate | `get_funding_rate` | - | `{"pair": "BTC/USDT"}` | `funding_rate` |
| **Order Entry** | Place Spot Order | `place_spot_order` | `place_order` | `symbol`, `side`, `type`, `price`, `quantity`, `timeInForce`, `postOnly`, `takeProfit`, `stopLoss` | `order_placed` / `order_rejected` |
| **Order Entry** | Place Margin Order | `place_margin_order` | - | `symbol`, `side`, `type`, `price`, `quantity`, `leverage`, `marginUsed`, `postOnly`, `takeProfit`, `stopLoss` | `margin_order_placed` / `margin_order_rejected` |
| **Order Entry** | Place Futures Order | `place_futures_order` | - | `pair`, `side`, `type`, `price`, `quantity`, `leverage`, `marginMode`, `takeProfit`, `stopLoss` | `futures_order_placed` / `futures_order_rejected` |
| **Risk & Position** | Close Futures Position | `close_futures_position` | `close_position` | `{"positionId": "pos-xxx"}` | `position_closed` / `close_position_rejected` |
| **Risk & Position** | Stream Open Futures Positions | `get_futures_positions` | `get_futures_position` | `{}` | Continuous `futures_positions` |
| **Order Cancellation** | Cancel Open Spot Order | `cancel_spot_order` | `cancel_order` | `{"orderId": "xxx"}` | `order_cancelled` / `cancel_rejected` |
| **Order Cancellation** | Cancel Open Margin / OCO Order | `cancel_margin_order` | - | `{"orderId": "xxx"}` | `margin_order_cancelled` / `cancel_margin_rejected` |
| **Post-Trade Audit** | Query Spot Order History | `get_spot_order_history` | `get_spot_orders` | `{"status": "OPEN", "page": "1", "limit": "50"}` | `spot_order_history` |
| **Post-Trade Audit** | Query Spot Trade Fills | `get_spot_trades` | `get_user_spot_trades` | `{"page": "1", "limit": "50"}` | `spot_order_history` (fills) |
| **Post-Trade Audit** | Query Margin Order History | `get_margin_order_history` | `get_margin_orders` | `{"status": "FILLED", "page": "1", "limit": "50"}` | `margin_order_history` |
| **Post-Trade Audit** | Query Futures Closed PnL History | `get_futures_order_history` | - | `{"page": "1", "limit": "50"}` | `futures_order_history` |

---

### 2.2. Standard Order Placement Sequence & State Transitions

```
Client App                             Limiance WebSocket Server                      Matching Engine
    │                                             │                                         │
    │  1. Connect with JWT Token                   │                                         │
    │────────────────────────────────────────────>│ (Authenticate connection)               │
    │                                             │                                         │
    │  2. Subscribe to Live Execution Reports     │                                         │
    │     {"type": "get_user_order_updates"}      │                                         │
    │────────────────────────────────────────────>│ (Registers connection in User Broadcaster)
    │                                             │                                         │
    │  3. Subscribe to L2 Book Depth & Trades     │                                         │
    │     {"type": "get_spot_order_books", ...}   │                                         │
    │────────────────────────────────────────────>│ (Binds stream slot; sends snapshot)     │
    │<────────────────────────────────────────────│ {"type": "order_book_stream_started"}   │
    │<────────────────────────────────────────────│ {"type": "order_book", "data": {...}}   │
    │                                             │                                         │
    │  4. Submit Order Entry                      │                                         │
    │     {"type": "place_spot_order",            │                                         │
    │      "request_id": "ord-001", ...}          │                                         │
    │────────────────────────────────────────────>│────── Forward to Matching Engine ──────>│
    │                                             │                                         │ (Validates balance & collars)
    │                                             │<───── Synchronous Placement Ack ────────│ (Enters book or matches)
    │  5. Immediate Synchronous Ack               │                                         │
    │<────────────────────────────────────────────│                                         │
    │     {"type": "order_placed",                │                                         │
    │      "request_id": "ord-001", ...}          │                                         │
    │                                             │                                         │
    │  6. Asynchronous Real-Time Fill Event       │                                         │
    │<────────────────────────────────────────────│<───── Push Fill / Execution Event ──────│
    │     {"type": "user_order_update",           │                                         │
    │      "data": {"order": {"status":"FILLED"}}}│                                         │
    │                                             │                                         │
    │  7. (Optional) Cancel Unfilled Remainder    │                                         │
    │     {"type": "cancel_spot_order",           │                                         │
    │      "data": {"orderId": "..."}}            │                                         │
    │────────────────────────────────────────────>│────── Forward Cancel to Engine ────────>│
    │<────────────────────────────────────────────│<───── Cancellation Ack ─────────────────│
    │     {"type": "order_cancelled", ...}        │                                         │
```

> [!IMPORTANT]
> **Always subscribe to `get_user_order_updates` before sending order entry!**  
> Market orders and crossing limit orders execute immediately against resting liquidity. If your client has not subscribed to `get_user_order_updates`, you will receive the initial `order_placed` acknowledgment but miss the immediate real-time fill event with fee, executed price, and filled quantity.

---

### 2.3. Supported Order Types & Execution Modifiers

#### Order Types (`type` / `order_type`)
- `LIMIT`: Places a resting order at the specified `price`. Must specify `quantity` and `price`.
- `MARKET`: Executes immediately at current market best bids/asks. `price` can be omitted or set to `0`.
- `STOP_LIMIT`: A limit order activated only when the market price breaches a trigger price (`stopLoss` / `takeProfit`).
- `STOP_MARKET`: A market order triggered when market price reaches the trigger price.
- `BUY_LIMIT` / `SELL_LIMIT`: Explicit directional limit variants.

#### Time In Force (`timeInForce` / `time_in_force`)
- `GTC` (*Good 'Til Cancelled* - Default): The order rests on the order book indefinitely until completely filled or explicitly cancelled.
- `IOC` (*Immediate Or Cancel*): The order matches immediately with whatever liquidity is currently available at or better than the limit price; any unfilled portion is immediately cancelled.
- `FOK` (*Fill Or Kill*): The order must be filled in its entirety immediately; if not, the entire order is rejected with zero fill.
- `GTD` (*Good 'Til Date*): Order remains active until the Unix timestamp in seconds supplied in `expireTime` (e.g. `1792349000`).

#### Execution Flags & Protection Triggers
- `postOnly` (`bool`, default `false`): **Maker-Only flag**. Guarantees that the order will only rest as liquidity on the order book. If the order would execute immediately as a taker (crossing the spread), it is automatically rejected.
- `reduceOnly` (`bool`, default `false`): Used in Futures and Margin. Guarantees the order can only reduce or close an existing open position; will never open or flip into an opposite position.
- `takeProfit` (`float`): Attaches an automated Take-Profit conditional trigger order to the position.
- `stopLoss` (`float`): Attaches an automated Stop-Loss conditional trigger order to the position.
- `leverage` (`float`, 1.0 to 125.0): Multiplier for margin borrowing or futures exposure.
- `marginMode` (`"CROSS"` | `"ISOLATED"`): Sets collateral pool isolation.

---

### 2.4. Order Status Lifecycle States

| State | Description | Next Possible States |
|---|---|---|
| `NEW` | Order received and validated by gateway; dispatched to matching engine. | `OPEN`, `FILLED`, `REJECTED` |
| `OPEN` | Order actively resting on the order book waiting for matching counter-orders. | `PARTIALLY_FILLED`, `FILLED`, `CANCELLED`, `EXPIRED` |
| `PARTIALLY_FILLED` | A portion of the order quantity has been matched; remaining quantity is resting. | `PARTIALLY_FILLED`, `FILLED`, `CANCELLED` |
| `FILLED` | Complete quantity matched and executed. Terminal state. | None |
| `CANCELLED` | Order cancelled by client or cancelled due to `IOC` / `postOnly` rule. Terminal state. | None |
| `REJECTED` | Order failed pre-trade validation (insufficient funds, collar deviation, min notional). Terminal state. | None |
| `EXPIRED` | Order expired because its `GTD` timestamp was reached. Terminal state. | None |

---

### 2.5. Risk Limits, Sizing & Price Band Collars

1. **Minimum Notional Value:**  
   Every order must satisfy a minimum notional value (Default: `5.0 USD` or `5.0 USDT` equivalent). Orders below this threshold are rejected with `statusCode: 400` (`"order notional below minimum threshold"`).
2. **Price Band Collar (Fat-Finger Protection):**  
   Limit buy orders cannot be placed higher than `+10%` above current mark price. Limit sell orders cannot be placed lower than `-10%` below current mark price.
3. **Quantity Step Size:**  
   Quantity must adhere to the asset's precision step size (e.g. `BTC`: 0.00001, `USDT`: 0.01).

---

## 3. Spot Trading Order Entry & History

### 3.1. Place Spot Limit Order (BUY)
Submits a resting limit buy order on the spot matching engine.
```json
{
  "type": "place_spot_order",
  "request_id": "spot-req-001",
  "data": {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 64500.50,
    "quantity": 0.05,
    "timeInForce": "GTC"
  }
}
```

### 3.2. Place Spot Limit Order (SELL)
Submits a resting limit sell order on the spot matching engine.
```json
{
  "type": "place_spot_order",
  "request_id": "spot-req-002",
  "data": {
    "symbol": "BTCUSDT",
    "side": "SELL",
    "type": "LIMIT",
    "price": 66200.00,
    "quantity": 0.10,
    "timeInForce": "GTC"
  }
}
```

### 3.3. Place Spot Market Order (BUY)
Executes an immediate aggressive market buy order against existing book liquidity. `price` can be omitted or set to `0`.
```json
{
  "type": "place_spot_order",
  "request_id": "spot-req-003",
  "data": {
    "symbol": "ETHUSDT",
    "side": "BUY",
    "type": "MARKET",
    "quantity": 1.50
  }
}
```

### 3.4. Place Spot Market Order (SELL)
Executes an immediate aggressive market sell order.
```json
{
  "type": "place_spot_order",
  "request_id": "spot-req-004",
  "data": {
    "symbol": "SOLUSDT",
    "side": "SELL",
    "type": "MARKET",
    "quantity": 15.0
  }
}
```

### 3.5. Place Spot Order with Take-Profit & Stop-Loss (TP/SL)
Attaches conditional trigger prices (OCO protection) to the order.
```json
{
  "type": "place_spot_order",
  "request_id": "spot-req-005",
  "data": {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 63000.00,
    "quantity": 0.25,
    "takeProfit": 68000.00,
    "stopLoss": 61500.00,
    "timeInForce": "GTC"
  }
}
```

### 3.6. Place Spot Order with Immediate-or-Cancel (IOC)
Order fills immediately whatever quantity is currently available at the limit price; any remaining unfilled portion is cancelled automatically.
```json
{
  "type": "place_spot_order",
  "request_id": "spot-req-006",
  "data": {
    "symbol": "ETHUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 3200.00,
    "quantity": 5.0,
    "timeInForce": "IOC"
  }
}
```

### 3.7. Place Spot Order with Fill-or-Kill (FOK)
Order must be entirely filled immediately or the entire order is rejected.
```json
{
  "type": "place_spot_order",
  "request_id": "spot-req-007",
  "data": {
    "symbol": "BTCUSDT",
    "side": "SELL",
    "type": "LIMIT",
    "price": 65000.00,
    "quantity": 0.5,
    "timeInForce": "FOK"
  }
}
```

### 3.8. Place Spot Maker Post-Only Order (`postOnly: true`)
Guarantees maker liquidity rebate eligibility; rejected if order would cross the current orderbook spread as a taker.
```json
{
  "type": "place_spot_order",
  "request_id": "spot-req-008",
  "data": {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 64100.00,
    "quantity": 0.5,
    "postOnly": true,
    "timeInForce": "GTC"
  }
}
```

### 3.9. Place Spot Good-'Til-Date Order (GTD with `expireTime`)
Automatically expires at the specified Unix timestamp seconds if not filled.
```json
{
  "type": "place_spot_order",
  "request_id": "spot-req-009",
  "data": {
    "symbol": "ETHUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 3150.00,
    "quantity": 2.0,
    "timeInForce": "GTD",
    "expireTime": 1792349000
  }
}
```

### 3.10. Place Spot Order Using Field Aliases (`pair`, `qty`, `order_type`)
Demonstrates alternative field naming keys accepted by the backend:
```json
{
  "type": "place_order",
  "request_id": "spot-req-010",
  "data": {
    "pair": "BTC/USDT",
    "side": "BUY",
    "order_type": "limit",
    "price": 64000.00,
    "qty": 0.12,
    "take_profit": 69000.00,
    "stop_loss": 62000.00,
    "time_in_force": "GTC",
    "post_only": true
  }
}
```

#### Spot Order Parameters & Accepted Variations Table:
| Canonical Key | Accepted Alternative Keys | Accepted Value Formats | Description |
|---|---|---|---|
| `symbol` | `pair` | `"BTCUSDT"`, `"BTC/USDT"`, `"BTC-USDT"` | Base and quote trading pair. |
| `side` | - | `"BUY"`, `"SELL"` (case-insensitive) | Order direction. |
| `type` | `order_type` | `"LIMIT"`, `"MARKET"`, `"STOP_LIMIT"` | Execution type. |
| `price` | - | Number (`64500.50`) or string (`"64500.50"`) | Required for LIMIT orders; omit or 0 for MARKET. |
| `quantity` | `amount`, `qty` | Positive float > 0 | Trade quantity in base asset units. |
| `takeProfit` | `take_profit` | Optional float > 0 | Take profit trigger price. |
| `stopLoss` | `stop_loss` | Optional float > 0 | Stop loss trigger price. |
| `timeInForce` | `time_in_force` | `"GTC"` (default), `"IOC"`, `"FOK"`, `"GTD"` | Execution lifetime rule. |
| `postOnly` | `post_only` | `bool` (`true` / `false`) | Maker-only guarantee flag. |
| `reduceOnly` | `reduce_only` | `bool` (`true` / `false`) | Position reduction only flag. |
| `expireTime` | `expire_time` | Unix timestamp integer | Required when `timeInForce` is `"GTD"`. |

#### Server Response on Spot Order Placement:
- **Success (`order_placed`):**
  ```json
  {
    "type": "order_placed",
    "request_id": "spot-req-001",
    "data": {
      "success": true,
      "statusCode": 200,
      "message": "Order placed successfully",
      "error": "",
      "symbol": "BTCUSDT",
      "side": "BUY",
      "price": 64500.5,
      "quantity": 0.05
    }
  }
  ```
- **Error / Rejection (`order_rejected`):**
  ```json
  {
    "type": "order_rejected",
    "request_id": "spot-req-001",
    "data": {
      "success": false,
      "error": "insufficient balance to place order",
      "statusCode": 400
    }
  }
  ```

---

### 3.11. Cancel Spot Order by `orderId`
Cancels an open resting spot order.
```json
{
  "type": "cancel_spot_order",
  "request_id": "spot-cancel-001",
  "data": {
    "orderId": "651f8a12bc4e890012e4f5a1"
  }
}
```

### 3.12. Cancel Spot Order Using Aliases (`order_id`, `id`)
```json
{
  "type": "cancel_order",
  "request_id": "spot-cancel-002",
  "data": {
    "order_id": "651f8a12bc4e890012e4f5a1"
  }
}
```
*Can also pass `"id": "651f8a12bc4e890012e4f5a1"`.*

#### Server Response on Order Cancellation:
- **Success (`order_cancelled`):**
  ```json
  {
    "type": "order_cancelled",
    "request_id": "spot-cancel-001",
    "data": {
      "success": true,
      "statusCode": 200,
      "message": "Order cancelled successfully",
      "error": "",
      "orderId": "651f8a12bc4e890012e4f5a1"
    }
  }
  ```
- **Rejection (`cancel_rejected`):**
  ```json
  {
    "type": "cancel_rejected",
    "request_id": "spot-cancel-001",
    "data": {
      "success": false,
      "error": "order not found or already filled",
      "statusCode": 404
    }
  }
  ```

---

### 3.13. Get Spot Order History - Default (Page 1, Limit 50)
One-shot query fetching recent past orders for the authenticated user.
```json
{
  "type": "get_spot_order_history",
  "request_id": "spot-hist-001",
  "data": {}
}
```
*Alias message type:* `"get_spot_orders"`.

### 3.14. Get Spot Order History - Filtered by Status (OPEN, FILLED, CANCELLED, REJECTED)
#### Variation: Open Orders only
```json
{
  "type": "get_spot_order_history",
  "request_id": "spot-hist-002",
  "data": {
    "status": "OPEN",
    "page": "1",
    "limit": "50"
  }
}
```
#### Variation: Filled Orders only
```json
{
  "type": "get_spot_order_history",
  "request_id": "spot-hist-003",
  "data": {
    "status": "FILLED"
  }
}
```
#### Variation: Cancelled Orders only
```json
{
  "type": "get_spot_order_history",
  "request_id": "spot-hist-004",
  "data": {
    "status": "CANCELLED"
  }
}
```

### 3.15. Get Spot Order History - Custom Pagination
```json
{
  "type": "get_spot_order_history",
  "request_id": "spot-hist-005",
  "data": {
    "page": "3",
    "limit": "20"
  }
}
```

#### Server Response (`spot_order_history`):
```json
{
  "type": "spot_order_history",
  "request_id": "spot-hist-001",
  "data": {
    "success": true,
    "statusCode": 200,
    "message": "Orders retrieved",
    "error": "",
    "data": [
      {
        "id": "651f8a12bc4e890012e4f5a1",
        "symbol": "BTCUSDT",
        "side": "BUY",
        "type": "LIMIT",
        "price": 64500.0,
        "quantity": 0.05,
        "filledQuantity": 0.05,
        "status": "FILLED",
        "createdAt": "2026-10-18T14:32:00Z"
      }
    ],
    "totalPages": 4,
    "currentPage": 1,
    "totalRecords": 182
  }
}
```

---

### 3.16. Get User Spot Trade Executions
Fetches individual trade fills executed for the user.
```json
{
  "type": "get_spot_trades",
  "request_id": "spot-trades-001",
  "data": {
    "page": "1",
    "limit": "50"
  }
}
```
*Alias message type:* `"get_user_spot_trades"`.

---

## 4. Margin Trading Order Entry, History & Account

### 4.1. Place Margin Limit BUY Order with Leverage
Submits a margin limit order borrowing against margin collateral.
```json
{
  "type": "place_margin_order",
  "request_id": "margin-req-001",
  "data": {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 64000.00,
    "quantity": 0.50,
    "leverage": 5.0,
    "timeInForce": "GTC"
  }
}
```

### 4.2. Place Margin Limit SELL Order with Leverage
```json
{
  "type": "place_margin_order",
  "request_id": "margin-req-002",
  "data": {
    "symbol": "ETHUSDT",
    "side": "SELL",
    "type": "LIMIT",
    "price": 3500.00,
    "quantity": 4.0,
    "leverage": 3.0,
    "timeInForce": "GTC"
  }
}
```

### 4.3. Place Margin Market Order
```json
{
  "type": "place_margin_order",
  "request_id": "margin-req-003",
  "data": {
    "symbol": "SOLUSDT",
    "side": "BUY",
    "type": "MARKET",
    "quantity": 25.0,
    "leverage": 2.0
  }
}
```

### 4.4. Place Margin Order with Explicit `marginUsed`
Allows manually fixing the initial margin collateral allocated from the margin account.
```json
{
  "type": "place_margin_order",
  "request_id": "margin-req-004",
  "data": {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 64200.00,
    "quantity": 1.0,
    "leverage": 10.0,
    "marginUsed": 6420.00
  }
}
```
*Alias key:* `"margin_used": 6420.00` is also accepted.

### 4.5. Place Margin Order with Protection TP/SL
```json
{
  "type": "place_margin_order",
  "request_id": "margin-req-005",
  "data": {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 64000.00,
    "quantity": 0.20,
    "leverage": 5.0,
    "takeProfit": 68000.00,
    "stopLoss": 62500.00
  }
}
```

### 4.6. Place Margin Order with IOC / FOK TimeInForce
```json
{
  "type": "place_margin_order",
  "request_id": "margin-req-006",
  "data": {
    "symbol": "ETHUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 3100.00,
    "quantity": 2.0,
    "leverage": 3.0,
    "timeInForce": "IOC"
  }
}
```

### 4.7. Place Margin Maker Post-Only Order
```json
{
  "type": "place_margin_order",
  "request_id": "margin-req-007",
  "data": {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 63800.00,
    "quantity": 0.25,
    "leverage": 5.0,
    "postOnly": true
  }
}
```

#### Margin Order Parameters Table:
| Canonical Key | Accepted Alternative Keys | Accepted Values | Description |
|---|---|---|---|
| `symbol` | `pair` | `"BTCUSDT"`, `"ETHUSDT"` | Margin pair. |
| `side` | - | `"BUY"`, `"SELL"` | Order direction. |
| `type` | `order_type` | `"LIMIT"`, `"MARKET"` | Order type. |
| `price` | - | Float > 0 (or 0 for MARKET) | Order price. |
| `quantity` | `amount`, `qty` | Float > 0 | Order quantity. |
| `leverage` | - | Float >= 1.0 (e.g. `2.0`, `5.0`, `10.0`) | Position leverage. |
| `marginUsed` | `margin_used` | Optional float > 0 | Explicit collateral amount. |
| `takeProfit` | `take_profit` | Optional float > 0 | Take profit trigger price. |
| `stopLoss` | `stop_loss` | Optional float > 0 | Stop loss trigger price. |
| `timeInForce` | `time_in_force` | `"GTC"`, `"IOC"`, `"FOK"`, `"GTD"` | Time in force. |
| `postOnly` | `post_only` | `bool` | Maker-only order flag. |
| `reduceOnly` | `reduce_only` | `bool` | Reduce position only flag. |
| `expireTime` | `expire_time` | Unix timestamp integer | Timestamp for GTD. |

#### Server Response (`margin_order_placed` / `margin_order_rejected`):
```json
{
  "type": "margin_order_placed",
  "request_id": "margin-req-001",
  "data": {
    "success": true,
    "statusCode": 200,
    "message": "Margin order placed successfully",
    "error": "",
    "symbol": "BTCUSDT",
    "side": "BUY",
    "price": 64000.0,
    "quantity": 0.5,
    "leverage": 5.0
  }
}
```

---

### 4.8. Cancel Margin Order by `orderId`
Cancels a resting margin order.
```json
{
  "type": "cancel_margin_order",
  "request_id": "margin-cancel-001",
  "data": {
    "orderId": "6520ab3efc4e890012e4f999"
  }
}
```
*Alias keys:* `"order_id"` and `"id"` are also supported.

### 4.9. Cancel Margin Conditional/OCO Order
The server automatically checks for conditional/trigger orders first, and falls back to cancel resting book orders.
```json
{
  "type": "cancel_margin_order",
  "request_id": "margin-cancel-002",
  "data": {
    "order_id": "conditional-order-uuid-883"
  }
}
```

#### Server Response (`margin_order_cancelled` / `cancel_margin_rejected`):
```json
{
  "type": "margin_order_cancelled",
  "request_id": "margin-cancel-001",
  "data": {
    "success": true,
    "statusCode": 200,
    "message": "Margin order cancelled successfully",
    "error": "",
    "orderId": "6520ab3efc4e890012e4f999"
  }
}
```

---

### 4.10. Get Margin Order History - Default
```json
{
  "type": "get_margin_order_history",
  "request_id": "margin-hist-001",
  "data": {}
}
```
*Alias message type:* `"get_margin_orders"`.

### 4.11. Get Margin Order History - Filtered by Status & Custom Pagination
```json
{
  "type": "get_margin_order_history",
  "request_id": "margin-hist-002",
  "data": {
    "status": "OPEN",
    "page": "1",
    "limit": "25"
  }
}
```
*Accepted `status` values:* `"OPEN"`, `"FILLED"`, `"CANCELLED"`, `"REJECTED"`, or `""` for all.

### 4.12. Get User Margin Trade Executions
```json
{
  "type": "get_margin_trades",
  "request_id": "margin-trades-001",
  "data": {
    "page": "1",
    "limit": "50"
  }
}
```
*Alias message type:* `"get_user_margin_trades"`.

---

### 4.13. Subscribe to Margin Account Stream (Equity, Margin Level, Liabilities)
Opens a background telemetry subscription streaming cross-margin account health (matching Binance `/sapi/v1/margin/account` parity). An immediate snapshot is pushed, followed by live pushes on every debt/collateral event and reconciliation frames every 30s.
```json
{
  "type": "get_margin_account",
  "data": {}
}
```

#### Server Response (`margin_account`):
```json
{
  "type": "margin_account",
  "data": {
    "success": true,
    "data": {
      "equity_usd": 24500.50,
      "margin_level": 3.85,
      "total_assets_usd": 32000.00,
      "total_liability_usd": 7499.50,
      "status": "NORMAL",
      "user_assets": [
        {
          "asset": "BTC",
          "free": 0.45,
          "locked": 0.05,
          "borrowed": 0.10,
          "interest": 0.0002,
          "net_balance": 0.40,
          "total_liability": 0.1002
        },
        {
          "asset": "USDT",
          "free": 1200.0,
          "locked": 300.0,
          "borrowed": 0.0,
          "interest": 0.0,
          "net_balance": 1500.0,
          "total_liability": 0.0
        }
      ]
    },
    "updatedAt": "2026-10-18T14:35:10Z"
  }
}
```

---

## 5. Futures / Derivatives Trading

### 5.1. Place Futures Limit LONG Order (Cross Margin Mode)
```json
{
  "type": "place_futures_order",
  "request_id": "fut-req-001",
  "data": {
    "pair": "BTCUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 64000.00,
    "quantity": 0.10,
    "leverage": 20.0,
    "marginMode": "CROSS"
  }
}
```

### 5.2. Place Futures Limit SHORT Order (Isolated Margin Mode)
```json
{
  "type": "place_futures_order",
  "request_id": "fut-req-002",
  "data": {
    "pair": "ETHUSDT",
    "side": "SELL",
    "type": "LIMIT",
    "price": 3600.00,
    "quantity": 2.0,
    "leverage": 50.0,
    "marginMode": "ISOLATED"
  }
}
```

### 5.3. Place Futures Market LONG Order
```json
{
  "type": "place_futures_order",
  "request_id": "fut-req-003",
  "data": {
    "pair": "SOLUSDT",
    "side": "BUY",
    "type": "MARKET",
    "quantity": 10.0,
    "leverage": 10.0,
    "marginMode": "CROSS"
  }
}
```

### 5.4. Place Futures Market SHORT Order
```json
{
  "type": "place_futures_order",
  "request_id": "fut-req-004",
  "data": {
    "pair": "BTCUSDT",
    "side": "SELL",
    "type": "MARKET",
    "quantity": 0.05,
    "leverage": 25.0,
    "marginMode": "ISOLATED"
  }
}
```

### 5.5. Place Futures Order with TP/SL Triggers
```json
{
  "type": "place_futures_order",
  "request_id": "fut-req-005",
  "data": {
    "pair": "BTCUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 63500.00,
    "quantity": 0.20,
    "leverage": 20.0,
    "marginMode": "CROSS",
    "takeProfit": 68000.00,
    "stopLoss": 62000.00
  }
}
```

### 5.6. Place Futures Order Using Field Aliases (`symbol`, `margin_mode`, `qty`)
```json
{
  "type": "place_futures_order",
  "request_id": "fut-req-006",
  "data": {
    "symbol": "BTC-PERP",
    "side": "BUY",
    "order_type": "limit",
    "price": 64100.00,
    "qty": 0.15,
    "leverage": 15.0,
    "margin_mode": "cross",
    "take_profit": 69000.00,
    "stop_loss": 62500.00
  }
}
```

#### Futures Order Parameters Table:
| Canonical Key | Accepted Alternative Keys | Accepted Values | Description |
|---|---|---|---|
| `pair` | `symbol` | `"BTCUSDT"`, `"BTC-PERP"`, `"BTC/USDT"` | Perpetual derivative contract symbol. |
| `side` | - | `"BUY"`, `"SELL"` | Order side (`BUY` = Long, `SELL` = Short). |
| `type` | `order_type` | `"LIMIT"`, `"MARKET"` | Execution type. |
| `price` | - | Float > 0 (or 0 for MARKET) | Order limit price. |
| `quantity` | `amount`, `qty` | Float > 0 | Contract quantity. |
| `leverage` | - | Float (e.g. `1.0` up to `125.0`) | Position leverage multiplier. |
| `marginMode` | `margin_mode` | `"CROSS"`, `"ISOLATED"` | Margin risk mode. |
| `takeProfit` | `take_profit` | Optional float > 0 | Take profit execution trigger price. |
| `stopLoss` | `stop_loss` | Optional float > 0 | Stop loss execution trigger price. |

#### Server Response (`futures_order_placed` / `futures_order_rejected`):
```json
{
  "type": "futures_order_placed",
  "request_id": "fut-req-001",
  "data": {
    "success": true,
    "statusCode": 200,
    "message": "Futures order placed successfully",
    "error": "",
    "pair": "BTCUSDT"
  }
}
```

---

### 5.7. Close Futures Position by `positionId`
Submits an immediate market closing order for an active futures position.
```json
{
  "type": "close_futures_position",
  "request_id": "fut-close-001",
  "data": {
    "positionId": "pos-6520bc8819ab"
  }
}
```
*Alias message type:* `"close_position"`.

### 5.8. Close Futures Position Using Aliases (`position_id`, `id`)
```json
{
  "type": "close_futures_position",
  "request_id": "fut-close-002",
  "data": {
    "position_id": "pos-6520bc8819ab"
  }
}
```

#### Server Response (`position_closed` / `close_position_rejected`):
```json
{
  "type": "position_closed",
  "request_id": "fut-close-001",
  "data": {
    "success": true,
    "statusCode": 200,
    "message": "Futures position closed successfully",
    "error": "",
    "positionId": "pos-6520bc8819ab"
  }
}
```

---

### 5.9. Subscribe to Live Futures Open Positions
Subscribes to live positions stream for the authenticated user (unrealized PnL, mark price, liquidation price). Server sends immediate snapshot, followed by updates every 30s.
```json
{
  "type": "get_futures_positions",
  "data": {}
}
```
*Alias message type:* `"get_futures_position"`.

#### Server Response (`futures_positions`):
```json
{
  "type": "futures_positions",
  "data": {
    "success": true,
    "statusCode": 200,
    "message": "Positions retrieved",
    "error": "",
    "data": [
      {
        "positionId": "pos-6520bc8819ab",
        "pair": "BTCUSDT",
        "side": "LONG",
        "size": 0.50,
        "entryPrice": 63800.00,
        "markPrice": 64500.00,
        "liquidationPrice": 58200.00,
        "marginMode": "CROSS",
        "leverage": 20.0,
        "unrealizedPnl": 350.00,
        "roe": 0.1097,
        "margin": 1595.00
      }
    ],
    "updatedAt": "2026-10-18T14:38:00Z"
  }
}
```

---

### 5.10. Get Futures Closed Positions & PnL History
One-shot query returning closed futures positions and realized PnL.
```json
{
  "type": "get_futures_order_history",
  "data": {
    "page": "1",
    "limit": "50"
  }
}
```

#### Server Response (`futures_order_history`):
```json
{
  "type": "futures_order_history",
  "data": {
    "success": true,
    "statusCode": 200,
    "message": "Futures history retrieved",
    "error": "",
    "data": [
      {
        "id": "ord-close-9912",
        "pair": "ETHUSDT",
        "side": "SHORT",
        "closePrice": 3450.00,
        "entryPrice": 3550.00,
        "quantity": 2.0,
        "realizedPnl": 200.00,
        "closedAt": "2026-10-18T12:00:00Z"
      }
    ],
    "totalPages": 2,
    "currentPage": 1,
    "totalRecords": 64
  }
}
```

---

### 5.11. Subscribe to Real-Time Funding Rate
Streams current funding rate and countdown timestamp for a perpetual contract. Pushes snapshot immediately, then refreshes every 30s.
```json
{
  "type": "get_funding_rate",
  "data": {
    "pair": "BTC/USDT"
  }
}
```

#### Server Response (`funding_rate`):
```json
{
  "type": "funding_rate",
  "data": {
    "success": true,
    "statusCode": 200,
    "message": "Funding rate retrieved",
    "error": "",
    "pair": "BTC/USDT",
    "rate": "0.000100",
    "nextFundingTime": "2026-10-18T16:00:00Z",
    "updatedAt": "2026-10-18T14:40:00Z"
  }
}
```

---

### 5.12. Subscribe to Market-Wide Futures 24h Ticker & Index Feed
Subscribes connection to all futures market tickers (mark price, index price, 24h volume, high/low, open interest).
```json
{
  "type": "get_futures_markets",
  "data": {}
}
```

#### Server Response (`futures_markets`):
```json
{
  "type": "futures_markets",
  "data": {
    "data": [
      {
        "symbol": "BTCUSDT",
        "markPrice": 64510.20,
        "indexPrice": 64505.00,
        "lastPrice": 64512.00,
        "priceChangePercent24h": 2.45,
        "volume24h": 84210.5,
        "openInterest": 15420.0
      }
    ],
    "success": true,
    "message": "Futures market stream started successfully",
    "statusCode": 200,
    "createdAt": "2026-10-18T14:41:00Z"
  }
}
```

---

## 6. Public Market Feeds & Subscriptions

### 6.1. Subscribe to Spot Order Book (`BTCUSDT`)
Streams real-time L2 bids and asks from the spot matching engine.
```json
{
  "type": "get_spot_order_books",
  "data": {
    "pair": "BTCUSDT"
  }
}
```
*Accepted `pair` formats:* `"BTCUSDT"`, `"BTC/USDT"`, `"BTC-USDT"`, `"btc/usdt"`.

#### Server Initial Confirmation:
```json
{
  "type": "order_book_stream_started",
  "data": {
    "success": true,
    "message": "Order book stream started successfully",
    "statusCode": 200,
    "tradingPair": "BTCUSDT:spot",
    "marketType": "spot",
    "createdAt": "2026-10-18T14:42:00.123456Z"
  }
}
```
#### Live Stream Push Frames (`order_book`):
```json
{
  "type": "order_book",
  "data": {
    "tradingPair": "BTCUSDT:spot",
    "marketType": "spot",
    "buy": [
      { "price": 64500.0, "quantity": 1.25, "total": 80625.0 },
      { "price": 64495.0, "quantity": 0.80, "total": 51596.0 }
    ],
    "sell": [
      { "price": 64505.0, "quantity": 2.10, "total": 135460.5 },
      { "price": 64510.0, "quantity": 1.50, "total": 96765.0 }
    ]
  }
}
```

---

### 6.2. Subscribe to Margin Order Book (`ETHUSDT`)
```json
{
  "type": "get_margin_order_books",
  "data": {
    "pair": "ETHUSDT"
  }
}
```

---

### 6.3. Subscribe to Futures Order Book (`BTC-PERP` / `BTC/USDT`)
```json
{
  "type": "get_futures_order_books",
  "data": {
    "pair": "BTC/USDT"
  }
}
```
*Alias key:* `"symbol": "BTC/USDT"` is also accepted.

#### Server Initial Confirmation:
```json
{
  "type": "futures_order_book_stream_started",
  "data": {
    "success": true,
    "message": "Futures order book stream started successfully",
    "statusCode": 200,
    "symbol": "BTC/USDT",
    "marketType": "futures",
    "createdAt": "2026-10-18T14:43:00.123456Z"
  }
}
```

---

### 6.4. Subscribe to Public Recent Trades Stream - Default Limit
Fetches initial snapshot of public trade executions (default 500) and subscribes connection to live fills for that pair.
```json
{
  "type": "get_trades",
  "data": {
    "pair": "BTCUSDT"
  }
}
```
*Alias message types:* `"get_recent_trades"`, `"recent_trades"`, `"trades"`.

### 6.5. Subscribe to Public Recent Trades Stream - Custom Limit
```json
{
  "type": "get_trades",
  "data": {
    "pair": "ETHUSDT",
    "limit": "100"
  }
}
```

### 6.6. Subscribe to Recent Trades Using Aliases (`get_spot_recent_trades`, `get_futures_recent_trades`)
```json
{
  "type": "get_futures_recent_trades",
  "data": {
    "pair": "BTC-PERP",
    "limit": "50"
  }
}
```

#### Server Snapshot Response (`recent_trades`):
```json
{
  "type": "recent_trades",
  "data": {
    "success": true,
    "statusCode": 200,
    "pair": "BTCUSDT",
    "trades": [
      {
        "id": "tr-8891234",
        "price": 64502.5,
        "amount": 0.15,
        "quantity": 0.15,
        "side": "BUY",
        "time": 1792348920000,
        "createdAt": "2026-10-18T14:42:00Z",
        "pair": "BTCUSDT"
      }
    ]
  }
}
```
#### Live Stream Push Frames (`trade`):
```json
{
  "type": "trade",
  "data": {
    "id": "tr-8891235",
    "pair": "BTCUSDT",
    "price": 64503.0,
    "quantity": 0.08,
    "side": "SELL",
    "time": 1792348922000
  }
}
```

---

### 6.7. Subscribe to Market-Wide 24h Ticker Feed (Spot & Margin)
Subscribes connection to all 24h price statistics across spot and margin markets.
```json
{
  "type": "get_market_data",
  "data": {}
}
```
*Optional `pair` (e.g. `"pair": "BTCUSDT"`) can be passed to echo in response.*

#### Server Response (`spot_margin_stream_started`):
```json
{
  "type": "spot_margin_stream_started",
  "data": {
    "success": true,
    "message": "Market stream started successfully",
    "statusCode": 200,
    "tradingPair": "BTCUSDT",
    "createdAt": "2026-10-18T14:45:00Z"
  }
}
```

---

### 6.8. Subscribe to OHLCV Candles - Minute Intervals (`1m`, `5m`, `15m`, `30m`)
#### 1-Minute Interval:
```json
{
  "type": "get_spot_candles",
  "data": {
    "pair": "BTCUSDT",
    "interval": "1m"
  }
}
```
#### 5-Minute Interval:
```json
{
  "type": "get_spot_candles",
  "data": {
    "pair": "BTCUSDT",
    "interval": "5m"
  }
}
```
#### 15-Minute Interval:
```json
{
  "type": "get_spot_candles",
  "data": {
    "pair": "ETHUSDT",
    "interval": "15m"
  }
}
```
#### 30-Minute Interval:
```json
{
  "type": "get_spot_candles",
  "data": {
    "pair": "SOLUSDT",
    "interval": "30m"
  }
}
```

### 6.9. Subscribe to OHLCV Candles - Hourly Intervals (`1h`, `4h`, `12h`)
#### 1-Hour Interval:
```json
{
  "type": "get_spot_candles",
  "data": {
    "pair": "BTCUSDT",
    "interval": "1h"
  }
}
```
#### 4-Hour Interval:
```json
{
  "type": "get_spot_candles",
  "data": {
    "pair": "BTCUSDT",
    "interval": "4h"
  }
}
```
#### 12-Hour Interval:
```json
{
  "type": "get_spot_candles",
  "data": {
    "pair": "BTCUSDT",
    "interval": "12h"
  }
}
```

### 6.10. Subscribe to OHLCV Candles - Daily / Weekly / Monthly (`1d`, `1w`, `1M`)
#### 1-Day Interval:
```json
{
  "type": "get_spot_candles",
  "data": {
    "pair": "BTCUSDT",
    "interval": "1d"
  }
}
```
#### 1-Week Interval:
```json
{
  "type": "get_spot_candles",
  "data": {
    "pair": "BTCUSDT",
    "interval": "1w"
  }
}
```
#### 1-Month Interval:
```json
{
  "type": "get_spot_candles",
  "data": {
    "pair": "BTCUSDT",
    "interval": "1M"
  }
}
```

### 6.11. Subscribe to Margin Candles & Live Stream Aliases (`get_spot_candles_live`, `get_margin_candles_live`)
```json
{
  "type": "get_margin_candles",
  "data": {
    "pair": "BTCUSDT",
    "interval": "1h"
  }
}
```
*Alias message types:* `"get_spot_candles_live"`, `"get_margin_candles_live"`.

> **Note on Historical Klines:** The WebSocket connection is reserved exclusively for live candle updates. If `startTime`, `endTime`, or `limit` is passed, the server will reject the request with `spot_candles_error` directing the client to use HTTP `GET /trading/kline/historical`.

#### Server Initial Confirmation:
```json
{
  "type": "candle_stream_started",
  "data": {
    "success": true,
    "message": "Candle stream started successfully",
    "pair": "BTCUSDT",
    "interval": "1h"
  }
}
```
#### Live Stream Candle Frames (`candle`):
```json
{
  "type": "candle",
  "data": {
    "pair": "BTCUSDT",
    "interval": "1h",
    "success": true,
    "statusCode": 200,
    "candles": [
      {
        "openTime": 1792346400000,
        "open": 64200.0,
        "high": 64650.0,
        "low": 64150.0,
        "close": 64510.0,
        "volume": 245.82,
        "closeTime": 1792349999999
      }
    ],
    "createdAt": "2026-10-18T14:48:00.123456Z"
  }
}
```

---

## 7. Private Account & Portfolio Telemetry

### 7.1. Subscribe to Live User Order Executions (`user_order_update`)
Opens a push channel streaming order lifecycle events (fills, partial fills, cancellations, rejections) immediately as they occur on the matching engine.
```json
{
  "type": "get_user_order_updates",
  "data": {}
}
```

#### Live Push Frame Received on Every Trade Fill:
```json
{
  "type": "user_order_update",
  "data": {
    "order": {
      "orderId": "651f8a12bc4e890012e4f5a1",
      "symbol": "BTCUSDT",
      "side": "BUY",
      "status": "FILLED",
      "price": 64500.5,
      "quantity": 0.05,
      "filledQuantity": 0.05,
      "fee": 0.03225,
      "feeAsset": "USDT",
      "timestamp": "2026-10-18T14:50:00Z"
    }
  }
}
```

---

### 7.2. Subscribe to Total / Overall Portfolio Balance
Streams total aggregated portfolio balance across all user accounts.
```json
{
  "type": "get_portfolio_balance",
  "data": {
    "account": "total"
  }
}
```
*Note: Passing `"account": ""` or omitting `account` also defaults to total balance.*

### 7.3. Subscribe to Spot Portfolio Balance
```json
{
  "type": "get_portfolio_balance",
  "data": {
    "account": "spot"
  }
}
```

### 7.4. Subscribe to Margin Portfolio Balance
```json
{
  "type": "get_portfolio_balance",
  "data": {
    "account": "margin"
  }
}
```

### 7.5. Subscribe to Futures Portfolio Balance
```json
{
  "type": "get_portfolio_balance",
  "data": {
    "account": "futures"
  }
}
```

### 7.6. Subscribe to Funding Wallet Balance
```json
{
  "type": "get_portfolio_balance",
  "data": {
    "account": "funding"
  }
}
```

### 7.7. Subscribe to Balance Using Aliases (`get_spot_balance`, `get_funding_balance`, etc.)
Instead of passing `account` inside `data`, frontend can send dedicated message types:
```json
{
  "type": "get_spot_balance",
  "data": {}
}
```
*Other supported aliases:*
- `"get_spot_portfolio_balance"`
- `"get_margin_portfolio_balance"` / `"get_margin_balance"`
- `"get_futures_portfolio_balance"` / `"get_futures_balance"`
- `"get_funding_portfolio_balance"` / `"get_funding_balance"`
- `"get_total_portfolio_balance"` / `"get_total_balance"`

#### Server Response (`portfolio_balance`):
```json
{
  "type": "portfolio_balance",
  "data": {
    "success": true,
    "statusCode": 200,
    "account": "spot",
    "data": {
      "inUsd": "15420.50",
      "inBtc": "0.23902",
      "inNgn": "24672800.00",
      "pnl": "+420.50",
      "pnlPercentage": "+2.80%"
    },
    "updatedAt": "2026-10-18T14:52:00Z"
  }
}
```

---

### 7.8. Subscribe to Portfolio Asset Allocations Breakdown
Streams the percentage and fiat valuation distribution across all held assets.
```json
{
  "type": "get_portfolio_balance_allocations",
  "data": {}
}
```

#### Server Response (`portfolio_balance_allocations`):
```json
{
  "type": "portfolio_balance_allocations",
  "data": {
    "totalValueNGN": 24672800.00,
    "allocations": [
      { "asset": "BTC", "percentage": 65.4, "valueNGN": 16136011.20 },
      { "asset": "USDT", "percentage": 24.6, "valueNGN": 6069508.80 },
      { "asset": "ETH", "percentage": 10.0, "valueNGN": 2467280.00 }
    ]
  }
}
```

---

### 7.9. Subscribe to Full Paginated Portfolio Asset List
Streams detailed asset balances (available, locked, USD valuation).
```json
{
  "type": "get_portfolio",
  "data": {
    "page": "1",
    "limit": "10"
  }
}
```

### 7.10. Subscribe to Paginated Portfolio with Asset Search Filter
```json
{
  "type": "get_portfolio",
  "data": {
    "page": "1",
    "limit": "10",
    "query": "SOL"
  }
}
```

#### Server Response (`portfolio`):
```json
{
  "type": "portfolio",
  "data": {
    "success": true,
    "statusCode": 200,
    "message": "Portfolio retrieved",
    "error": "",
    "data": [
      {
        "asset": "BTC",
        "free": 0.23,
        "locked": 0.009,
        "total": 0.239,
        "usdValue": 15415.50
      }
    ],
    "totalPages": 1,
    "currentPage": 1,
    "totalRecords": 6,
    "updatedAt": "2026-10-18T14:55:00Z"
  }
}
```

---

## 8. Live Support & P2P Order Chat

### 8.1. Send Chat Message
Sends an end-to-end chat message inside an active conversation session (support ticket or P2P trade session). Maximum message length is 4000 characters.
```json
{
  "type": "chat_message",
  "data": {
    "chat_id": "chat-sess-6520e118ba",
    "message": "Hello, I have initiated the bank transfer. Please confirm."
  }
}
```

#### Server Delivery Event (pushed to all participants & sender connections):
```json
{
  "type": "new_chat_message",
  "data": {
    "chatId": "chat-sess-6520e118ba",
    "senderId": "usr-buyer-882",
    "senderName": "Alice",
    "content": "Hello, I have initiated the bank transfer. Please confirm.",
    "createdAt": "2026-10-18T14:56:00Z"
  }
}
```

---

### 8.2. Get Active Chat Conversations List
Fetches all open and past conversations for the authenticated user.
```json
{
  "type": "get_chats",
  "data": {}
}
```

#### Server Response (`user_chats`):
```json
{
  "type": "user_chats",
  "data": {
    "chats": [
      {
        "chatId": "chat-sess-6520e118ba",
        "title": "Trade #m-9921 Alice / Bob",
        "lastMessage": "Payment verified",
        "unreadCount": 0,
        "updatedAt": "2026-10-18T14:58:00Z"
      }
    ]
  }
}
```

---

### 8.3. Get Chat Message History - Default Pagination
```json
{
  "type": "get_chat_messages",
  "data": {
    "chat_id": "chat-sess-6520e118ba"
  }
}
```

### 8.4. Get Chat Message History - Custom Page & Limit
```json
{
  "type": "get_chat_messages",
  "data": {
    "chat_id": "chat-sess-6520e118ba",
    "page": "2",
    "limit": "30"
  }
}
```

#### Server Response (`chat_messages`):
```json
{
  "type": "chat_messages",
  "data": {
    "chatId": "chat-sess-6520e118ba",
    "messages": [
      {
        "id": "msg-1",
        "senderId": "usr-buyer-882",
        "content": "Payment sent",
        "createdAt": "2026-10-18T14:56:00Z"
      }
    ],
    "page": 2,
    "limit": 30
  }
}
```

---

### 8.5. Send Typing Indicator (Started Typing)
Notifies the other participant that the user is actively typing.
```json
{
  "type": "typing_response",
  "data": {
    "chat_id": "chat-sess-6520e118ba",
    "is_typing": true
  }
}
```

### 8.6. Send Typing Indicator (Stopped Typing)
```json
{
  "type": "typing_response",
  "data": {
    "chat_id": "chat-sess-6520e118ba",
    "is_typing": false
  }
}
```

#### Server Broadcast to Other Participant (`typing`):
```json
{
  "type": "typing",
  "data": {
    "chatId": "chat-sess-6520e118ba",
    "senderId": "usr-buyer-882",
    "isTyping": true
  }
}
```

---

## 9. Peer-to-Peer (P2P) Trading Operations & Escrow

### 9.1. Create P2P BUY Ad (Fixed Price, Single Payment Method)
Submits a public advertisement to buy crypto using fiat.
```json
{
  "type": "p2p_create_order",
  "data": {
    "type": "BUY",
    "asset": "USDT",
    "fiat": "USD",
    "price": 1.00,
    "floating_price": false,
    "quantity": 1000.0,
    "min_quantity": 50.0,
    "max_quantity": 500.0,
    "payment_duration": "15",
    "payment_methods": ["Bank Transfer"],
    "selected_country": "United States",
    "remark": "Instant wire release after payment confirmation."
  }
}
```

### 9.2. Create P2P SELL Ad (Fixed Price, Multiple Payment Methods Array)
Submits an advertisement to sell crypto. Required crypto collateral is held in escrow upon match.
```json
{
  "type": "p2p_create_order",
  "data": {
    "type": "SELL",
    "asset": "BTC",
    "fiat": "NGN",
    "price": 105000000.00,
    "floating_price": false,
    "quantity": 0.50,
    "min_quantity": 0.005,
    "max_quantity": 0.25,
    "payment_duration": "30",
    "payment_methods": ["Kuda Bank", "Opay", "GTBank"],
    "selected_country": "Nigeria",
    "remark": "Fast payment only. No third-party accounts."
  }
}
```

### 9.3. Create P2P Ad with Floating Price
Uses dynamic exchange rate margin tracking.
```json
{
  "type": "p2p_create_order",
  "data": {
    "type": "SELL",
    "asset": "ETH",
    "fiat": "EUR",
    "price": 3150.00,
    "floating_price": true,
    "quantity": 5.0,
    "min_quantity": 0.2,
    "max_quantity": 2.5,
    "payment_duration": "15",
    "payment_methods": ["SEPA Instant", "Revolut"],
    "selected_country": "Germany",
    "remark": "Floating market rate."
  }
}
```

### 9.4. Create P2P Ad with Comma-Separated Payment Methods String
Demonstrates string split variation supported by `messageStringSlice`:
```json
{
  "type": "p2p_create_order",
  "data": {
    "type": "BUY",
    "asset": "USDT",
    "currency": "GBP",
    "fixed_price": 0.78,
    "quantity": 2000.0,
    "min_quantity": 100.0,
    "max_quantity": 1000.0,
    "payment_methods": "Faster Payments, Revolut, Monzo",
    "country": "United Kingdom"
  }
}
```

#### P2P Create Ad Parameters Table:
| Key | Accepted Aliases | Type | Required | Description |
|---|---|---|---|---|
| `type` | `order_type`, `orderType` | `string` | **Yes** | `"BUY"` or `"SELL"`. |
| `asset` | - | `string` | **Yes** | Asset symbol (e.g. `"USDT"`, `"BTC"`, `"ETH"`). |
| `fiat` | `currency` | `string` | No (Default: `"USD"`) | Fiat currency code (e.g. `"USD"`, `"NGN"`, `"EUR"`, `"GBP"`). |
| `price` | `fixed_price`, `fixedPrice` | `float` | **Yes** | Per-unit fiat price. |
| `floating_price` | `floatingPrice` | `bool` / `string` | No (Default: `false`) | `true` if price floats with index. |
| `quantity` | - | `float` | **Yes** | Total crypto volume for sale or buy. |
| `min_quantity` | `minQuantity` | `float` | **Yes** | Minimum trade quantity per match. |
| `max_quantity` | `maxQuantity` | `float` | **Yes** | Maximum trade quantity per match. |
| `payment_duration` | `paymentDuration` | `string` | No (Default: `"15"`) | Window in minutes to complete payment. |
| `payment_methods` | `paymentMethods`, `payment_method`, `paymentMethod` | `[]string` or `string` | **Yes** | Array or comma-delimited string of payment options. |
| `selected_country` | `selectedCountry`, `country` | `string` | No | Geographic restriction. |
| `remark` | - | `string` | No | Terms and instructions displayed to taker. |
| `asset_logo` | `assetLogo` | `string` | No | Custom asset icon URL. |

#### Server Response on Ad Creation:
- **Success (`p2p_order_created`):**
  ```json
  {
    "type": "p2p_order_created",
    "data": {
      "success": true,
      "message": "P2P order created successfully",
      "statusCode": 200
    }
  }
  ```
- **Global Broadcast Frame (`p2p_orders_updated`):**
  ```json
  {
    "type": "p2p_orders_updated",
    "data": {
      "action": "created",
      "asset": "USDT",
      "fiat": "USD",
      "type": "BUY"
    }
  }
  ```
- **Error Frame (`p2p_error`):**
  ```json
  {
    "type": "p2p_error",
    "data": {
      "action": "p2p_create_order",
      "error": "insufficient wallet balance to escrow order quantity"
    }
  }
  ```

---

### 9.5. Edit P2P Ad - Update Price and Floating Price Flag
Modifies an active ad. Only the advertiser who created the order can edit it.
```json
{
  "type": "p2p_edit_order",
  "data": {
    "order_id": "p2p-ad-6521a0091",
    "price": 106200000.00,
    "floating_price": false
  }
}
```
*Alias keys:* `"orderId"` or `"id"`.

### 9.6. Edit P2P Ad - Update Min/Max Quantity, Duration and Remark
```json
{
  "type": "p2p_edit_order",
  "data": {
    "order_id": "p2p-ad-6521a0091",
    "min_quantity": 0.01,
    "max_quantity": 0.40,
    "payment_duration": "20",
    "remark": "Updated terms: payment must be made within 20 mins."
  }
}
```

### 9.7. Edit P2P Ad - Update Payment Methods and Country
```json
{
  "type": "p2p_edit_order",
  "data": {
    "order_id": "p2p-ad-6521a0091",
    "payment_methods": ["Kuda Bank", "Zenith Bank"],
    "selected_country": "Nigeria"
  }
}
```

#### Server Response (`p2p_order_updated`):
```json
{
  "type": "p2p_order_updated",
  "data": {
    "orderId": "p2p-ad-6521a0091",
    "success": true,
    "message": "P2P order updated successfully",
    "statusCode": 200
  }
}
```

---

### 9.8. Deactivate Single P2P Ad (`action: "deactivate"`)
Temporarily pauses an ad from appearing in public search results.
```json
{
  "type": "p2p_toggle_order_status",
  "data": {
    "order_id": "p2p-ad-6521a0091",
    "action": "deactivate"
  }
}
```

### 9.9. Reactivate Single P2P Ad (`action: "reactivate"`)
Resumes a paused ad.
```json
{
  "type": "p2p_toggle_order_status",
  "data": {
    "order_id": "p2p-ad-6521a0091",
    "action": "reactivate"
  }
}
```

### 9.10. Toggle Ad Status Using Dedicated Action Types (`p2p_deactivate_order`, `p2p_reactivate_order`)
Instead of `p2p_toggle_order_status`, clients can directly dispatch:
#### Deactivate:
```json
{
  "type": "p2p_deactivate_order",
  "data": {
    "order_id": "p2p-ad-6521a0091"
  }
}
```
#### Reactivate:
```json
{
  "type": "p2p_reactivate_order",
  "data": {
    "order_id": "p2p-ad-6521a0091"
  }
}
```

### 9.11. Toggle Ad Status Using Boolean Flags (`is_active: false` / `is_active: true`)
```json
{
  "type": "p2p_toggle_order_status",
  "data": {
    "order_id": "p2p-ad-6521a0091",
    "is_active": false
  }
}
```
*Alias key:* `"isActive": true` is also accepted.

### 9.12. Deactivate / Reactivate ALL User Ads (Omitting `order_id`)
Omitting `order_id` toggles all active ads created by the requesting user (bulk vacation mode).
#### Bulk Deactivate:
```json
{
  "type": "p2p_toggle_order_status",
  "data": {
    "action": "deactivate"
  }
}
```
#### Bulk Reactivate:
```json
{
  "type": "p2p_toggle_order_status",
  "data": {
    "action": "reactivate"
  }
}
```

#### Server Response (`p2p_order_status_toggled`):
```json
{
  "type": "p2p_order_status_toggled",
  "data": {
    "orderId": "p2p-ad-6521a0091",
    "action": "deactivate",
    "success": true,
    "message": "Order status updated successfully",
    "statusCode": 200
  }
}
```

---

### 9.13. Query Public P2P Ads - Default (Page 1, Limit 20)
One-shot search fetching active ads in the P2P marketplace.
```json
{
  "type": "get_p2p_orders",
  "data": {}
}
```

### 9.14. Query Public P2P Ads - Filter by Asset, Fiat and Type (`BUY` / `SELL`)
```json
{
  "type": "get_p2p_orders",
  "data": {
    "asset": "USDT",
    "fiat": "USD",
    "type": "SELL",
    "page": "1",
    "limit": "20"
  }
}
```

### 9.15. Query Public P2P Ads - Filter by Payment Method, Country and Minimum Quantity
```json
{
  "type": "get_p2p_orders",
  "data": {
    "asset": "BTC",
    "fiat": "NGN",
    "type": "BUY",
    "payment_method": "Bank Transfer",
    "country": "Nigeria",
    "min_quantity": "0.01",
    "available_quantity": "0.05",
    "page": "1",
    "limit": "20"
  }
}
```

#### Server Response (`p2p_orders_data`):
```json
{
  "type": "p2p_orders_data",
  "data": {
    "orders": [
      {
        "id": "p2p-ad-6521a0091",
        "type": "SELL",
        "asset": "BTC",
        "fiat": "NGN",
        "fixedPrice": 105000000.0,
        "floatingPrice": false,
        "quantity": 0.50,
        "minQuantity": 0.005,
        "maxQuantity": 0.25,
        "paymentDuration": "30",
        "paymentMethod": ["Kuda Bank", "Opay"],
        "selectedCountry": "Nigeria",
        "active": true,
        "advertiser": {
          "id": "usr-merchant-01",
          "name": "CryptoKing",
          "completedOrders": 340,
          "completionRate": 99.2
        }
      }
    ],
    "totalPages": 3,
    "currentPage": 1,
    "totalRecords": 45,
    "statusCode": 200
  }
}
```

---

### 9.16. Subscribe to Real-Time P2P Ads Feed (`subscribe_p2p_orders`)
Registers the connection to the live `p2p_orders` broadcast channel. The server returns the current ads snapshot and automatically pushes `p2p_orders_updated` events whenever any merchant creates, edits, or completes an ad.
```json
{
  "type": "subscribe_p2p_orders",
  "data": {
    "asset": "USDT",
    "fiat": "USD"
  }
}
```

#### Server Response (`p2p_orders_subscribed`):
```json
{
  "type": "p2p_orders_subscribed",
  "data": {
    "status": "subscribed",
    "channel": "p2p_orders"
  }
}
```
*(Followed immediately by `p2p_orders_data` containing the initial snapshot).*

---

### 9.17. Get User's Own P2P Ads - All Ads
Fetches advertisements created by the authenticated user.
```json
{
  "type": "get_user_p2p_orders",
  "data": {
    "page": "1",
    "limit": "20"
  }
}
```

### 9.18. Get User's Own P2P Ads - Filtered by Status, Asset and Currency
```json
{
  "type": "get_user_p2p_orders",
  "data": {
    "status": "active",
    "asset": "USDT",
    "currency": "USD",
    "type": "SELL",
    "page": "1",
    "limit": "20"
  }
}
```

#### Server Response (`user_p2p_orders_data`):
```json
{
  "type": "user_p2p_orders_data",
  "data": {
    "orders": [
      {
        "id": "p2p-ad-6521a0091",
        "type": "SELL",
        "asset": "USDT",
        "fiat": "USD",
        "fixedPrice": 1.00,
        "quantity": 1000.0,
        "active": true
      }
    ],
    "totalPages": 1,
    "currentPage": 1,
    "totalRecords": 3,
    "statusCode": 200
  }
}
```

---

### 9.19. Match P2P Ad / Taker Order Entry (`p2p_match_order`)
Initiates a trade with a merchant ad.  
- **Auto-Subscription:** Upon successful match, the server **automatically subscribes this WebSocket connection** to the live trade room channel: `p2p_match:<orderMatchId>`.  
- **Escrow:** For a SELL ad, the merchant's crypto is locked in escrow. For a BUY ad, the taker's crypto is locked in escrow.
```json
{
  "type": "p2p_match_order",
  "data": {
    "order_id": "p2p-ad-6521a0091",
    "quantity": 0.05,
    "payment_method_id": "pm-bank-transfer-01"
  }
}
```
*Alias keys:* `"orderId"` for order ID, `"paymentMethodId"` / `"payment_method"` for payment method.

#### Server Response to Taker (`p2p_order_matched`):
```json
{
  "type": "p2p_order_matched",
  "data": {
    "orderMatchId": "match-9812401",
    "success": true,
    "message": "Order matched successfully. Escrow locked.",
    "orderMatch": {
      "id": "match-9812401",
      "orderId": "p2p-ad-6521a0091",
      "quantity": 0.05,
      "amount": 5250000.0,
      "fiat": "NGN",
      "asset": "BTC",
      "status": "PENDING",
      "buyerId": "usr-buyer-882",
      "advertiserId": "usr-merchant-01",
      "createdAt": "2026-10-18T15:00:00Z"
    },
    "statusCode": 200
  }
}
```

#### Push Notification Delivered to Advertiser if Online (`p2p_new_match`):
```json
{
  "type": "p2p_new_match",
  "data": {
    "orderMatchId": "match-9812401",
    "orderMatch": {
      "id": "match-9812401",
      "orderId": "p2p-ad-6521a0091",
      "quantity": 0.05,
      "status": "PENDING",
      "buyerId": "usr-buyer-882"
    }
  }
}
```

---

### 9.20. Subscribe to Live P2P Trade Room (`subscribe_p2p_match`)
Subscribes to real-time events for an ongoing trade (status changes, payment confirmations, release notices, dispute alerts).
```json
{
  "type": "subscribe_p2p_match",
  "data": {
    "order_match_id": "match-9812401"
  }
}
```
*Alias keys:* `"orderMatchId"`, `"match_id"`, `"matchId"`, `"id"`.

#### Server Subscription Confirmations:
1. First, acknowledgment frame:
```json
{
  "type": "p2p_match_subscribed",
  "data": {
    "orderMatchId": "match-9812401",
    "room": "p2p_match:match-9812401",
    "status": "subscribed"
  }
}
```
2. Followed by current state snapshot:
```json
{
  "type": "p2p_match_state",
  "data": {
    "orderMatch": {
      "id": "match-9812401",
      "status": "PENDING",
      "quantity": 0.05,
      "asset": "BTC",
      "fiat": "NGN"
    }
  }
}
```

---

### 9.21. Update Trade Match Status - Buyer Marks Paid (`status: "PAID"`)
Sent by the fiat payer after transferring funds to the seller's account.
```json
{
  "type": "p2p_update_match_status",
  "data": {
    "order_match_id": "match-9812401",
    "status": "PAID"
  }
}
```

### 9.22. Update Trade Match Status - Cancel Order Match (`status: "CANCELLED"`)
Cancels an uncompleted match, releasing escrowed crypto back to the seller.
```json
{
  "type": "p2p_update_match_status",
  "data": {
    "order_match_id": "match-9812401",
    "status": "CANCELLED"
  }
}
```

### 9.23. Update Trade Match Status - Open Dispute (`status: "DISPUTED"`)
Flags match for customer support intervention (e.g. buyer marked paid but seller did not receive funds).
```json
{
  "type": "p2p_update_match_status",
  "data": {
    "order_match_id": "match-9812401",
    "status": "DISPUTED"
  }
}
```

#### Server Response to Sender (`p2p_match_status_updated`):
```json
{
  "type": "p2p_match_status_updated",
  "data": {
    "orderMatchId": "match-9812401",
    "status": "PAID",
    "success": true,
    "message": "Match status updated to PAID",
    "statusCode": 200
  }
}
```

#### Room Broadcast Frame Delivered to BOTH Buyer and Seller (`p2p_match_status_changed`):
```json
{
  "type": "p2p_match_status_changed",
  "data": {
    "orderMatchId": "match-9812401",
    "status": "PAID",
    "updatedBy": "usr-buyer-882",
    "timestamp": "2026-10-18T15:05:00Z"
  }
}
```

---

### 9.24. Request Escrow Release Code (`p2p_request_release_code`)
Triggers generation and dispatch of an OTP/security release verification code to the seller's registered email or SMS before crypto is released from escrow.
```json
{
  "type": "p2p_request_release_code",
  "data": {
    "order_match_id": "match-9812401"
  }
}
```
*Alias keys:* `"orderMatchId"`, `"match_id"`, `"matchId"`, `"id"`.

#### Server Response (`p2p_release_code_sent`):
```json
{
  "type": "p2p_release_code_sent",
  "data": {
    "orderMatchId": "match-9812401",
    "success": true,
    "message": "Release verification code sent to seller",
    "statusCode": 200
  }
}
```

---

### 9.25. Release Escrow Asset to Counterparty (`p2p_release_order`)
The crypto seller provides the verification code to release escrowed assets to the buyer's spot wallet.
```json
{
  "type": "p2p_release_order",
  "data": {
    "order_match_id": "match-9812401",
    "release_code": "849201"
  }
}
```
*Alias keys:* `"releaseCode"`, `"code"`.

#### Server Response to Releasing Party (`p2p_order_released`):
```json
{
  "type": "p2p_order_released",
  "data": {
    "orderMatchId": "match-9812401",
    "status": "COMPLETED",
    "success": true,
    "message": "Order released successfully. Funds transferred.",
    "statusCode": 200
  }
}
```

#### Room Broadcast Frame Delivered to BOTH Counterparties (`p2p_order_completed`):
```json
{
  "type": "p2p_order_completed",
  "data": {
    "orderMatchId": "match-9812401",
    "status": "COMPLETED",
    "releasedBy": "usr-merchant-01",
    "timestamp": "2026-10-18T15:08:00Z"
  }
}
```

---

### 9.26. Get Single P2P Match Details (`get_p2p_match`)
One-shot query retrieving complete trade details and payment info.
```json
{
  "type": "get_p2p_match",
  "data": {
    "order_match_id": "match-9812401"
  }
}
```

#### Server Response (`p2p_match_state`):
```json
{
  "type": "p2p_match_state",
  "data": {
    "orderMatch": {
      "id": "match-9812401",
      "orderId": "p2p-ad-6521a0091",
      "quantity": 0.05,
      "amount": 5250000.0,
      "fiat": "NGN",
      "asset": "BTC",
      "status": "PAID",
      "buyerId": "usr-buyer-882",
      "advertiserId": "usr-merchant-01",
      "paymentMethod": {
        "bankName": "Kuda Bank",
        "accountNumber": "2001928341",
        "accountName": "Crypto Merchant Ltd"
      }
    },
    "statusCode": 200
  }
}
```

---

### 9.27. Get User's Trade Match History - All Matches
Fetches list of all trades where the user is either buyer or seller.
```json
{
  "type": "get_user_p2p_matches",
  "data": {
    "page": "1",
    "limit": "20"
  }
}
```

### 9.28. Get User's Trade Match History - Filtered by Status (`PENDING`, `PAID`, `COMPLETED`, `DISPUTED`)
#### Pending Matches:
```json
{
  "type": "get_user_p2p_matches",
  "data": {
    "status": "PENDING"
  }
}
```
#### Paid Matches:
```json
{
  "type": "get_user_p2p_matches",
  "data": {
    "status": "PAID"
  }
}
```
#### Completed Matches:
```json
{
  "type": "get_user_p2p_matches",
  "data": {
    "status": "COMPLETED",
    "page": "1",
    "limit": "30"
  }
}
```
#### Disputed Matches:
```json
{
  "type": "get_user_p2p_matches",
  "data": {
    "status": "DISPUTED"
  }
}
```

#### Server Response (`user_p2p_matches_data`):
```json
{
  "type": "user_p2p_matches_data",
  "data": {
    "matches": [
      {
        "id": "match-9812401",
        "orderId": "p2p-ad-6521a0091",
        "quantity": 0.05,
        "amount": 5250000.0,
        "status": "COMPLETED",
        "asset": "BTC",
        "fiat": "NGN",
        "createdAt": "2026-10-18T15:00:00Z"
      }
    ],
    "totalPages": 2,
    "currentPage": 1,
    "totalRecords": 38,
    "statusCode": 200
  }
}
```

---

## 10. Subscription Teardown & Unsubscribe Handlers

To prevent memory leaks and unnecessary network egress, clients **MUST** unsubscribe from feeds when leaving a screen or switching trading tabs.

### 10.1. Unsubscribe from Spot/Margin Order Book
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "order_book"
  }
}
```

### 10.2. Unsubscribe from Futures Order Book
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "futures_order_book"
  }
}
```

### 10.3. Unsubscribe from Spot/Margin Market Ticker Feed
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "market_data"
  }
}
```

### 10.4. Unsubscribe from Futures Market Ticker Feed
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "futures_markets"
  }
}
```

### 10.5. Unsubscribe from Recent Trades Stream
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "trades"
  }
}
```

### 10.6. Unsubscribe from User Live Order Executions
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "user_order_updates"
  }
}
```

### 10.7. Unsubscribe from Internal OHLCV Candles
Pass the same `pair` and `interval` that was subscribed:
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "candles",
    "pair": "BTCUSDT",
    "interval": "1h"
  }
}
```

### 10.8. Unsubscribe from Live Klines Stream
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "candles_live",
    "symbol": "BTCUSDT",
    "interval": "1m"
  }
}
```

### 10.9. Unsubscribe from Total Portfolio Balance
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "portfolio_balance"
  }
}
```

### 10.10. Unsubscribe from Specific Account Balance (Spot, Margin, Futures, Funding)
#### Spot Balance:
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "portfolio_balance",
    "account": "spot"
  }
}
```
#### Margin Balance:
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "portfolio_balance",
    "account": "margin"
  }
}
```
#### Futures Balance:
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "portfolio_balance",
    "account": "futures"
  }
}
```
#### Funding Balance:
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "portfolio_balance",
    "account": "funding"
  }
}
```

### 10.11. Unsubscribe from Portfolio Balance Allocations
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "portfolio_balance_allocations"
  }
}
```

### 10.12. Unsubscribe from Portfolio Assets Stream
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "portfolio"
  }
}
```

### 10.13. Unsubscribe from Margin Account Stream
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "margin_account"
  }
}
```

### 10.14. Unsubscribe from Futures Positions Stream
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "futures_positions"
  }
}
```

### 10.15. Unsubscribe from Funding Rate Stream for a Pair
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "funding_rate",
    "pair": "BTC/USDT"
  }
}
```

### 10.16. Unsubscribe from Public P2P Ads Stream
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "p2p_orders"
  }
}
```

### 10.17. Unsubscribe from P2P Live Match Room
```json
{
  "type": "unsubscribe",
  "data": {
    "topic": "p2p_match",
    "order_match_id": "match-9812401"
  }
}
```

---

### 10.18. Unsubscribe from All Active Streams on Connection
Tears down every active subscription slot, poller, and room channel on this WebSocket connection.
```json
{
  "type": "unsubscribe_all"
}
```
*Alias types:* `"unsubscribeAll"`, `"unSubscribeAll"`, `"unsubscribe-all"`.

#### Server Response (`unsubscribed_all`):
```json
{
  "type": "unsubscribed_all",
  "data": {
    "status": "success"
  }
}
```

---

## 11. Server Response Frames Reference

Below is a quick reference matrix of all server-to-client response message types:

| Incoming Client Type | Success Response Type | Error / Rejection Response Type |
|---|---|---|
| `place_spot_order` / `place_order` | `order_placed` | `order_rejected` |
| `cancel_spot_order` / `cancel_order` | `order_cancelled` | `cancel_rejected` |
| `get_spot_order_history` / `get_spot_orders` | `spot_order_history` | `spot_order_history_error` |
| `place_margin_order` | `margin_order_placed` | `margin_order_rejected` |
| `cancel_margin_order` | `margin_order_cancelled` | `cancel_margin_rejected` |
| `get_margin_order_history` / `get_margin_orders` | `margin_order_history` | `margin_order_history_error` |
| `get_margin_account` | `margin_account` | `margin_account_error` |
| `place_futures_order` | `futures_order_placed` | `futures_order_rejected` |
| `close_futures_position` / `close_position` | `position_closed` | `close_position_rejected` |
| `get_futures_positions` / `get_futures_position` | `futures_positions` | `futures_positions_error` |
| `get_futures_order_history` | `futures_order_history` | `futures_order_history_error` |
| `get_funding_rate` | `funding_rate` | `funding_rate_error` |
| `get_spot_order_books` / `get_margin_order_books` | `order_book_stream_started`, `order_book` | `order_book_error` |
| `get_futures_order_books` | `futures_order_book_stream_started`, `order_book` | `order_book_error` |
| `get_trades` / `get_recent_trades` / `trades` | `recent_trades`, `trade` | `trades` (with `success: false`) |
| `get_market_data` | `spot_margin_stream_started`, `market_data` | - |
| `get_futures_markets` | `futures_markets` | - |
| `get_spot_candles` / `get_margin_candles` | `candle_stream_started`, `candle` | `spot_candles_error` |
| `get_portfolio_balance` (all account forms) | `portfolio_balance` (and `<account>_portfolio_balance`) | `portfolio_balance_error` |
| `get_portfolio_balance_allocations` | `portfolio_balance_allocations` | `portfolio_allocations_error` |
| `get_portfolio` | `portfolio` | `portfolio_error` |
| `get_user_order_updates` | `user_order_update` (live stream) | - |
| `chat_message` | `new_chat_message` | `message_delivery_failed` |
| `get_chats` | `user_chats` | - |
| `get_chat_messages` | `chat_messages` | - |
| `typing_response` | `typing` | - |
| `p2p_create_order` | `p2p_order_created`, `p2p_orders_updated` | `p2p_error` |
| `p2p_edit_order` | `p2p_order_updated`, `p2p_orders_updated` | `p2p_error` |
| `p2p_toggle_order_status` | `p2p_order_status_toggled`, `p2p_orders_updated` | `p2p_error` |
| `get_p2p_orders` | `p2p_orders_data` | `p2p_error` |
| `subscribe_p2p_orders` | `p2p_orders_subscribed`, `p2p_orders_data` | `p2p_error` |
| `get_user_p2p_orders` | `user_p2p_orders_data` | `p2p_error` |
| `p2p_match_order` | `p2p_order_matched`, `p2p_new_match` | `p2p_error` |
| `subscribe_p2p_match` | `p2p_match_subscribed`, `p2p_match_state` | `p2p_error` |
| `p2p_update_match_status` | `p2p_match_status_updated`, `p2p_match_status_changed` | `p2p_error` |
| `p2p_request_release_code` | `p2p_release_code_sent` | `p2p_error` |
| `p2p_release_order` | `p2p_order_released`, `p2p_order_completed` | `p2p_error` |
| `get_p2p_match` | `p2p_match_state` | `p2p_error` |
| `get_user_p2p_matches` | `user_p2p_matches_data` | `p2p_error` |
| `unsubscribe` | (Slot released silently) | `unsupported topic` / error message |
| `unsubscribe_all` | `unsubscribed_all` | - |
