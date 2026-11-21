# Design system

Goal: feel like a native finance app on a phone, not a website. Dark-only, calm, high contrast, fast.

## Principles

1. Mobile first. Design at 375px; larger screens get the same layout centered.
2. Primary navigation is a bottom tab bar (Books, Reports, Settings). Drill-in screens (a book) show a top bar
   with Back and their own bottom action bar (Cash In / Cash Out) instead of the tabs.
3. One primary action per screen. Money-in is green, money-out is red, never color alone: signs (+ and -) and
   labels accompany color.
4. Immediate feedback. Press states within 150 ms, toasts for results, undo instead of confirmation when an
   action is reversible, confirmation dialogs only for irreversible actions.
5. Offline is normal, not an error. Show sync state quietly (the badge on Books, details in Settings).
6. Motion explains cause and effect: sheets rise from the bottom, screens slide in, rows slide to reveal
   Delete. 150 to 260 ms, transform and opacity only, and `prefers-reduced-motion` disables it globally.

## Tokens

Defined as space-separated RGB channels in `src/index.css` and mapped in `tailwind.config.js` so opacity
modifiers work (`bg-brand/15`).

| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#0B0D12` | app background (near-black for OLED) |
| `surface` | `#15171E` | cards, bars |
| `surface-2` | `#1C1F29` | inputs, sheets, menus |
| `border` | white at 8 to 10 percent | dividers (`border-border/10`) |
| `fg` | `#F4F5F7` | primary text |
| `fg-muted` | `#9AA0AC` | secondary text |
| `brand` | `#7D7AFF` | primary actions, active tab |
| `in` | `#2FD17B` | money in |
| `out` | `#FF5C5C` | money out, destructive |

Measured contrast (WCAG): `fg` on `bg` 17.8:1, `fg-muted` on `surface` 6.8:1, `in` on `surface` 9.0:1, `out` on `surface` 5.9:1, `brand` on `bg` 5.7:1. Filled buttons (`bg-brand`, `bg-in`, `bg-out`) use dark `text-bg` (5.7:1, 9.7:1, 6.4:1); white text on them would fail AA (3.4:1 and 3.0:1), so do not use it. All of the above meet AA for normal text.

## Type

Plus Jakarta Sans (variable), bundled with `@fontsource-variable/plus-jakarta-sans`, so it works offline and
needs no external request. Screen titles 24px/800, section labels 12px/700 uppercase, body 16px, captions
12px. Money uses tabular numerals (`.tabular`) so columns align.

## Spacing, shape, elevation

4px rhythm. Cards use 16px radius with a single shadow (`shadow-card`); sheets 24px radius (`shadow-sheet`).
Touch targets are at least 44px. Screen gutters are 16px. Fixed bars respect safe-area insets.

## Components

| Component | Notes |
| --- | --- |
| `BottomNav` | 3 tabs, icon plus label, active state filled and tinted |
| `Sheet` | bottom sheet with drag-to-dismiss handle, backdrop blur, spring-out entry |
| `SwipeRow` | horizontal swipe reveals Delete; vertical scroll is never blocked |
| `ConfirmDialog` | irreversible actions only |
| `ToastHost` | `aria-live="polite"`, auto-dismiss, optional action (Undo) |
| `SyncBadge` | compact sync status on the Books header |
| Pills (`.pill`) | horizontally scrolling filter chips |

## Accessibility checklist

- Every input has a visible or `sr-only` `<label>` tied with `htmlFor`.
- Icon-only buttons have `aria-label`; toggles expose `aria-expanded` or `aria-current`.
- Errors appear next to the field and use `role="alert"`.
- Inputs are 16px+ to prevent iOS zoom; `inputMode` is set for amounts and email.
- Status is never color-only; focus rings are visible on inputs.

## Icons

Inline SVG only, 1.8 to 2px strokes, no icon libraries. Replace `public/icons/icon-192.png` and
`icon-512.png` with your own artwork (the shipped ones are placeholders).
