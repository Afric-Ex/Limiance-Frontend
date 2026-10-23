# Limiance Exchange — Design Language

Implementation guide derived from the codebase. The original specification
(`Limiance-Exchange-Design-System.md`) is referenced throughout the source but
is **not** checked into this repository; this document captures the token layer,
component conventions, and rules that are actually enforced in code.

Source of truth, in order:

1. `app/globals.css` — CSS custom properties and global primitives
2. `tailwind.config.ts` — semantic Tailwind aliases and brand scales
3. `src/utils/theme.ts` — Mantine theme aligned to the same values
4. `src/components/ui/*` — token-driven component library
5. `src/styles/animations.css` — motion system
6. `scripts/audit-tokens.mjs` — automated token conformance check

---

## 1. Design intent

- **Dark, dense, trading-first.** Near-black surfaces, restrained chrome, data
  is the loudest element on the page.
- **One brand blue.** `#4D77F0` is the accent, link, focus, and active-state
  color. Filled primary surfaces use the darker `#4168DD` so white text passes
  AA contrast.
- **Semantic money colors.** Green means buy/up, red means sell/down, and the
  color is always paired with a sign, label, or arrow.
- **Compact rhythm.** 4px spacing base, 55/40px inputs, 65/64px CTAs, 56px list
  rows, 72px header.
- **Quiet motion.** Short fades and slides, subtle glow; no decorative
  animation on data surfaces.
- **Token or nothing.** New UI consumes semantic aliases/CSS variables, never
  raw hex values.

---

## 2. Color

### 2.1 Brand and surfaces

| Token | CSS variable | Tailwind | Value | Use |
|---|---|---|---|---|
| Primary | `--color-primary` | `primary` | `#4D77F0` | Accent, links, focus, active states, icons |
| Primary strong | `--color-primary-strong` | `primary-strong` | `#4168DD` | Filled buttons carrying white text (4.94:1) |
| Primary lighter | — | `primary-lighter` | `#162244` | Subtle primary backgrounds |
| Surface | `--color-surface` | `surface` | `#121212` | Page-level panels |
| Elevated | `--color-elevated` | `elevated` | `#222222` | Cards, modals, popovers |
| Muted | `--color-muted` | `muted` | `#292929` | Secondary buttons, inert chips |
| Navy tint | `--color-tint-navy` | `navy` | `#293556` | Tinted informational surfaces |
| Border | `--color-border` | `line` | `#343434` | Default 1px borders |
| Background / foreground | `--background` / `--foreground` | `background` / `foreground` | `#000000` / `#FFFFFF` | App root |

> Observed panel variant: account and dashboard surfaces use `#181A20` with
> `rgba(255,255,255,0.06)` borders (`.account-card`, `bg-[#181a20]`). This is
> allowlisted but is **not** the canonical elevated token — prefer `Card` for
> new work.

### 2.2 Text

| Token | CSS variable | Tailwind | Value | Notes |
|---|---|---|---|---|
| Text primary | `--color-text-primary` | via arbitrary value | `#E0E0E0` | Default copy |
| Text secondary | `--color-text-secondary` | `secondary` | `#727679` | 4.09:1 — large/non-interactive use only |
| Disabled | `--color-text-disabled` | `disabled` | `#666666` | 3.26:1 — placeholders, disabled, timestamps |
| Off-white | `--color-neutral-off-white` | `offwhite` | `#D9D9D9` | High-emphasis neutral |
| Grey 400 | `--color-neutral-grey-400` | `grey400` | `#A1A1AA` | Focus ring on primary surfaces |
| Grey 200 | `--color-neutral-grey-200` | `grey200` | `#E4E4E7` | Light neutral |

### 2.3 Semantic

| Token | CSS variable | Tailwind | Value |
|---|---|---|---|
| Buy / success | `--color-buy` | `buy` | `#25AB42` |
| Buy tint | `--color-buy-tint` | `buy-tint` | `#25AB421A` |
| Buy alt (unconfirmed) | `--color-buy-alt` | `buy-alt` | `#27AE60` |
| Sell / error | `--color-sell` | `sell` | `#F6465D` |
| Warning base | `--color-warning-base` | `warning` | `#FF9500` |
| Warning text | `--color-warning-text` | `warning.text` | `#FBA42A` |

`#27AE60` is flagged by the audit tool as an unconfirmed duplicate of the buy
token. Do not introduce new uses.

### 2.4 Legacy scales

`tailwind.config.ts` also exposes `blue.1-5`, `success.1-6`, `error.1`,
`yellow.1`, `orange.1`, `gold.1`, `purple.1`, and a large `gray.1-53` ramp.
These are migration leftovers. **New code must use the semantic aliases above.**
Chart series, decorative art, and avatar palettes are the only sanctioned
exceptions and live in `scripts/audit-tokens.allowlist.json`.

### 2.5 Color rules

- Never raw hex in components; use `bg-surface`, `text-[var(--color-text-primary)]`, etc.
- Buy/sell is never color-only: pair with `+`/`-`, "Buy"/"Sell", or an arrow.
- White text on `primary` fails AA (4.03:1) — use `primary-strong` for filled controls.
- `text-secondary` and `disabled` are not for body-sized interactive text.

---

## 3. Typography

Font stack (system, no webfont): `-apple-system, BlinkMacSystemFont, "Segoe UI",
Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif` plus emoji fallbacks.

The type ramp is **inferred** (the original spec lists typography as
unconfirmed). Treat it as an ordering contract, not final Figma values.

| Token | Size | Typical use |
|---|---|---|
| `--text-display` | 48px | Marketing display |
| `--text-heading` | 32px | Page/section headings |
| `--text-title` | 24px | Card and modal titles |
| `--text-subtitle` | 19px | Section subtitles, input labels |
| `--text-body` | 15px | Body copy |
| `--text-caption` | 13px | Captions, table meta |
| `--text-micro` | 11px | Badges, overlines |

Additional Tailwind sizes exist for legacy pixel-perfect layouts
(`text-38px`, `text-32px`, `text-19px`, etc.). Prefer the ramp for new work.

Numeric data uses `tabular-nums` (see `StatCell`, `CoinRow`, trading tables) so
prices and balances do not shift while updating.

---

## 4. Spacing, sizing, radius

### 4.1 Spacing scale

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40` — exposed as `--spacing-1` … `--spacing-10`.

### 4.2 Layout constants

| Token | Value | Where |
|---|---|---|
| `--size-container-desktop` | 1440px | Max desktop frame |
| `.app-container` | `max-width: 1137px`, `px-4` | Content column |
| `--size-header-height` | 72px | Sticky header |
| `--size-header-gutter` | 32px | Header horizontal padding |
| `--size-sidebar-width` | 281px | Sidebar outer |
| `--size-sidebar-inner` | 265px | Sidebar nav column |
| `--size-auth-panel` | 416px | Auth form panel |
| `--size-row-list` | 56px | Coin/list rows |
| `--size-row-nav` | 55px | Sidebar nav rows |

### 4.3 Controls

| Token | Value | Use |
|---|---|---|
| `--size-input-standard` | 55px | Default form inputs |
| `--size-input-compact` | 40px | Dense/toolbar inputs and compact buttons |
| `--size-button-primary` | 65px | Primary CTA |
| `--size-button-secondary` | 64px | Secondary/social auth |
| Segmented tab | 77 × 31px | `SegmentedControl` (29px inner, 4px padding, 4px gap) |
| Mobile input/button | 52px | Mobile flows (`.mobile-input`, `.mobile-btn-primary`) |

### 4.4 Radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 4px | Chips, tiny tags |
| `--radius-sm` | 8px | Dropdown items |
| `--radius-md` | 12px | Inputs, buttons, segmented shell |
| `--radius-lg` | 16px | Cards/panels |
| `--radius-xl` | 24px | Large surfaces, modals on mobile |
| `--radius-full` | 9999px | Pills, avatars, icon buttons |

Radius is also inferred; do not add one-off values.

### 4.5 Elevation

| Token | Value | Use |
|---|---|---|
| `--shadow-card` | `0 8px 25px rgba(102,102,102,0.20), 8px 0 20px rgba(0,0,0,0.20)` | Cards, modals, popovers |
| `--shadow-glow-primary` | `1px 1px 30px -4px #4D77F0` | Primary emphasis/glow |
| `shadow-1..7` | Tailwind legacy | Existing chrome; avoid for new work |

---

## 5. Motion

Base keyframes and utilities live in `src/styles/animations.css`, imported once
from `app/globals.css`.

| Utility | Effect | Duration |
|---|---|---|
| `.animate-fade-in` | Opacity 0 → 1 | 0.4s ease-out |
| `.animate-fade-up` / `.animate-fade-in-up` | Opacity + 16px rise | 0.5s / 0.45s |
| `.animate-slide-down` | Opacity + 12px drop | 0.3s |
| `.animate-scale-in` | Scale 0.95 → 1 | 0.2s |
| `.animate-slide-in-left` | Drawer entry | 0.3s spring curve |
| `.animate-float` | Decorative 8px float | 3s infinite |
| `.animate-pulse-glow` | Opacity pulse | 2s infinite |
| `.animate-flash-green` / `.animate-flash-red` | Price tick flash | 0.6s |
| `.stagger-1` … `.stagger-8` | 50ms incremental delays | — |

Other motion conventions:

- Buttons press to `scale(0.97)` (global) / `scale(0.98)` (`Button`).
- Modals: overlay `bg-black/70 backdrop-blur-sm`, panel `scaleIn`.
- Page entry: `.page-enter` (20px slide-up, 0.3s).
- Skeletons: `.skeleton` shimmer, 1.5s infinite.
- Scrollbars are 6px, white at 10% opacity (20% on hover).

No `prefers-reduced-motion` handling exists yet; add it when touching animation
code.

---

## 6. Component library

Import directly from `src/components/ui`. Components are token-driven and
accept `className` for layout-only overrides.

### Button — `button.tsx`

Variants: `primary`, `secondary`, `subtle`, `outline`, `buy`, `sell`, `ghost`.
Sizes: `primary` (65px, full width), `secondary` (64px, full width), `compact`
(40px), `small` (32px).

- Primary uses `bg-primary-strong` + white text (AA strategy).
- Buy/sell add a soft colored glow.
- Shared base: 12px radius, semibold, 200ms transition, active scale, disabled
  at 50% opacity, 2px focus ring.

### Card — `card.tsx`

`bg-elevated border-line rounded-xl shadow-card`, optional `title`/`actions`
header, padding `none | sm (16) | md (24) | lg (28)`. Primary content grouping
primitive.

### FormInput — `form-input.tsx`

Label above, `standard` 55px / `compact` 40px, 20px horizontal inset, 12px
radius, surface background, border-line, optional `rightIcon`. Focus: primary
border + `ring-primary/30`.

### SegmentedControl — `segmented-control.tsx`

Tablist with 4px padding/gap, 12px shell radius, active tab `bg-primary`,
inactive `text-secondary`. Sizes `default` (29px height, 77px min width) and
`compact` (24px).

### StatCell — `stat-cell.tsx`

Uppercase 13px secondary label stacked over 19px semibold primary value,
`tabular-nums`. The recurring market-stat pattern.

### CoinRow — `coin-row.tsx`

56px row, 32×32 icon, ticker + name left, amount/price right (price hidden
below `md`), optional action, bottom border at 40% line opacity, hover
`bg-muted/30`.

### ModalShell — `modal-shell.tsx`

Centered dialog, max 460px, overlay `black/70` + blur, `role="dialog"` and
`aria-modal`, icon/title header, 24px padding, scrollable body capped at 70vh,
optional footer, 36px circular close button.

### DropdownPopover / DropdownItem — `dropdown-popover.tsx`

Elevated panel, border-line, shadow-card, 8px padding, `minWidth` default 280.
Items are 44px (or auto with description), icon + title + optional description,
hover `bg-muted`.

### EmptyState — `empty-state.tsx`

Centered optional icon in disabled color plus secondary caption
(default "No Records"), vertical padding 40px.

---

## 7. Layout and page patterns

- **Header:** 72px sticky, `backdrop-blur-xl`, `#181A20/90`, 32px gutters;
  authenticated state adds a 1px bottom border. Contains logo, nav, search,
  Deposit quick action, wallet/profile/notifications, language, settings.
- **Sidebar:** 281px outer / 265px inner, 55px nav rows, 16px icon offset +
  12px icon-to-label gap, gradient background, active-row indicator.
- **Auth:** single 416px panel; mobile brand header; 55px inputs and full-width
  CTAs; clear back navigation.
- **Trading workspace:** full-bleed, no sidebar (`(no-sidebar)` route group);
  chart + order book + order form; tabular numerals throughout.
- **Account pages:** `.account-card` panels (`#181A20`, 16px radius, 32px
  padding; 12px/16px on mobile).
- **Tables:** 56px rows, right-aligned numerics, hover row tint, skeleton
  placeholders instead of spinners for first load.
- **Status colors:** buy/sell tokens plus text labels; badges use tinted
  backgrounds (e.g. `bg-buy/10 text-buy border-buy/20`).
- **Mobile:** 52px inputs/buttons, bottom nav, bottom sheets
  (`.sheet-enter`), safe-area padding utilities (`.pb-safe`, `.pt-safe`).

---

## 8. Accessibility contract

- **Focus:** global 2px `primary` outline with 2px offset on all interactive
  elements. On primary-filled surfaces the outline switches to
  `--color-neutral-grey-400` (`#A1A1AA`).
- **Contrast strategy:** filled primary controls use `primary-strong` so white
  labels reach 4.94:1. `primary` remains for accents and large text.
- **Icon-only controls** require `aria-label`; decorative SVGs use
  `aria-hidden="true"`.
- **Dialogs** use `role="dialog"`, `aria-modal="true"`, and
  `aria-labelledby`.
- **Meaning is never color-only:** gains/losses and buy/sell carry a sign,
  word, or arrow.
- **Keyboard:** all controls reachable and visibly focused; overlay click-outside
  must not trap focus.

---

## 9. Token governance

Run before shipping:

```bash
npm run audit:tokens   # flags raw hex/rgb literals outside the allowlist
npm run audit:pii      # flags PII leakage in logs/UI
npm run typecheck
```

Rules:

1. Use semantic Tailwind aliases or `var(--token)`; no new raw colors.
2. Use the component library before hand-rolling markup.
3. Add to `scripts/audit-tokens.allowlist.json` only for documented one-offs
   (chart series, illustration art, avatar palettes) with a comment/reason.
4. Do not add a token that duplicates an existing one. Surface duplicates rather
   than aliasing around them.
5. Keep the Mantine theme (`src/utils/theme.ts`) in sync when adding tokens.

### Known drift (as of this document)

- `app/page.tsx` (new landing page) uses an isolated cyan/slate palette and
  `#0A0D14` instead of the token system.
- `src/components/dashboard/kickstart-journey.tsx` uses `#2F66F6`, `#1B2234`,
  `#10192E`, `#0D1424`, `#0A0F1B`, `#2557E0`, `#E11D48`.
- `src/components/trades/candlestick-chart-lwc.tsx` uses chart-specific colors
  (`#16C784`, `#FF8A00`, `#3B3F4A`, `#E040FB`, `#00BCD4`) — candidates for the
  allowlist.
- A parallel mobile palette exists (`--bg-deep`, `--bg-card`, `--bg-surface`,
  `--m-primary: #6366F1`, …). It predates the canonical tokens and should be
  reconciled.
- Typography and radius scales are inferred; the original spec is missing.
- `#27AE60` (buy-alt) is unconfirmed.
- Accessibility follow-ups: per-control aria-labels, AA-safe use of
  `text-secondary`/`disabled`, and keyboard/screen-reader QA on chrome, modals,
  forms, and trading surfaces.

---

## 10. Quick reference

```tsx
import { Card } from "@/src/components/ui/card";
import { StatCell } from "@/src/components/ui/stat-cell";
import { Button } from "@/src/components/ui/button";

<Card title="Portfolio" actions={<Button variant="ghost" size="small">View</Button>}>
  <StatCell label="Estimated Balance" value="$24,850.40" />
  <Button variant="primary">Deposit</Button>
</Card>
```

- Brand accent: `#4D77F0` (`primary`)
- Filled CTA: `#4168DD` (`primary-strong`)
- Card: `#222222` (`elevated`) + `line` border + `shadow-card`
- Text: `#E0E0E0` primary / `#727679` secondary
- Buy/sell: `#25AB42` / `#F6465D`
- Spacing: 4px base
- Radius: 4 / 8 / 12 / 16 / 24 / full
- Motion: 0.2–0.5s ease-out, press scale 0.97
- Audit: `npm run audit:tokens`
