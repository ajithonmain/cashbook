# Design system

Goal: feel like a native finance app on a phone, not a website. Calm, flat, dense, fast. The visual language is
adapted from the author's PocketDays app: neutral monochrome, hairline borders, one near-black (light) or
near-white (dark) accent, flat panels, and an inverted "dock" for navigation.

## Motion

One easing language, modeled on Stripe's: a fast start with a long soft landing (`--ease-out`: `cubic-bezier(0.16, 1, 0.3, 1)`), and an accelerating exit (`--ease-in`). Durations: press 60 to 160 ms, menus 150 ms, dialogs 160 to 220 ms, tab fade 200 ms, sheets 360 ms in and 240 ms out, book push 340 ms in and 280 ms out, toasts 280 ms in and 220 ms out, dock indicator 380 ms. Only `transform` and `opacity` animate (plus tiny grid-column and color transitions on the dock label and theme change).

Rules that keep it smooth:

- **Tabs never unmount.** Books, Reports and Settings stay mounted and are shown or hidden, so switching tabs reloads nothing, keeps each tab's scroll position, and only cross-fades. Local writes bump `useDataVersion()` so hidden tabs are fresh when shown.
- **A book is a pushed layer**, not a route swap: it slides over the list (z-50) and the list stays underneath. Open books add one history entry, so the Android back gesture and browser Back close it with the reverse animation.
- **No empty or skeleton flash.** `src/lib/cache.ts` holds the last entries per book (primed by the list), so a screen paints real data instantly; skeletons appear only on a true cold start and match the final height.
- **Exit animations exist for everything that enters** (sheet, dialog, toast, book layer). A dragged sheet exits from where the finger left it.
- **Focus waits.** Inputs inside sheets focus after the slide-in finishes (about 380 ms); focusing earlier makes mobile browsers jump the viewport.
- **No overshoot springs or backdrop blur** on large surfaces (they cause bounce gaps and mobile jank).
- Theme changes add a short-lived `theme-transition` class so colors cross-fade.
- Measured: five tab switches plus opening and closing a book produce a cumulative layout shift of 0.0009.

## Principles

1. Mobile first. Design at 375px; larger screens get the same layout centered.
2. No page headers. Top-level tabs (Books, Reports, Settings) start directly with content, typically a balance
   summary. Drill-in screens (a book) use a floating back button and an export button over the content, with the
   book name inside the summary card.
3. Navigation is a slim bottom dock: icons only, and the active tab expands into an inverted pill with its
   label. Android and browser Back return from a book to the list (history entry per open book).
4. Dense by default. Rows are two lines, controls are small (see "Density"), sheets hold anything secondary
   (filters, account, forms) so pages stay quiet.
5. One primary action per screen. Money in and out use color plus a sign (+ and -) and a label, never color alone.
6. Immediate feedback: press states in 150 ms, toasts for results, undo instead of confirmation when reversible,
   confirmation dialogs only for irreversible actions.
7. Offline is normal. Sync state is a quiet badge on Books and a row in Settings.
8. Motion explains cause and effect (sheets rise, screens slide in, swipe reveals Delete) in 150 to 260 ms using
   transform and opacity; `prefers-reduced-motion` disables it globally.

## Themes

Light, Dark, or System, chosen under Settings > Appearance (a sliding segmented control). The choice is stored in
`localStorage` (`cashbook_theme`). `public/theme-init.js` applies it before first paint (the CSP forbids inline
scripts, so it is a tiny blocking external script), `src/lib/theme.ts` handles changes and updates the browser
`theme-color`. The root element carries `data-theme="light|dark"`; Tailwind's `dark:` variant is not used, so
always style with tokens, never with `dark:`.

## Tokens

Defined in `src/index.css` as space-separated RGB channels (so `bg-brand/15` works) and mapped in
`tailwind.config.js`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | `#F5F5F7` | `#0D0F10` | app background |
| `surface` | `#FFFFFF` | `#17191B` | cards, rows, sheets |
| `surface-2` | `#F1F1F4` | `#1C1F21` | inputs, menus |
| `border` | `#171D23` at 10% | white at 10% | hairlines (`border-border/10`) |
| `fg` | `#171D23` | `#F2F3F3` | primary text |
| `fg-muted` | `#656B72` | `#8C9194` | secondary text |
| `brand` / `brand-solid` | `#171D23` | `#F2F3F3` | accent: primary buttons, selected states |
| `on-brand` | `#FFFFFF` | `#111416` | text on `brand-solid` |
| `in` / `in-solid` / `on-in` | `#2E7D52` / same / white | `#86D4A8` / `#9FD9B6` / `#0F2A1B` | money in |
| `out` / `out-solid` / `on-out` | `#B43F42` / `#AB3B41` / white | `#F6A8A8` / `#F0AFA5` / `#321612` | money out, destructive |
| `dock`, `dock-text`, `dock-active`, `dock-active-text` | near-black bar, light-gray icons, white pill, dark text | slate bar, gray icons, near-white pill, dark text | bottom dock |

`text-*` colors are for text on surfaces; `*-solid` are fills that must be paired with their `on-*` text color
(`bg-in-solid text-on-in`). Never put white text on a solid fill by hand: the dark theme uses pastel fills with
dark text.

Contrast (WCAG), measured: all text pairs and all solid-button pairs meet AA (4.5:1) in both themes. The
PocketDays muted gray (`#9D9D9D`, 2.7:1 on white) was replaced by `#656B72` (5.4:1) for this reason. Re-check with
a contrast calculator if you change a token.

## Book colors and icons

Each book has an icon (32 inline-SVG options in `src/components/BookAvatar.tsx`) and a color stored as an HSL hue
(0 to 359). The icon is suggested from keywords in the name (`suggestIcon`: "Trip to Goa" suggests a plane) until the
user picks one. Color defaults to **Auto**: `pickAutoHue` takes the hue nearest to the name-derived one that no other
book uses, keeping at least 28 degrees from every used hue (relaxing only when there are very many books), so two
books never look alike. The chosen hue is stored, so it does not change when other books are added or removed.
Users can instead pick one of 18 presets or any hue with the slider. Books saved before colors existed get a distinct
stored hue assigned once on first load. Known limit: two devices that create books offline at the same time cannot
see each other's colors, so they can occasionally pick the same hue; editing either book fixes it. Lightness is set
per theme in CSS (`.book-avatar`, `.book-swatch`) so every hue is readable in light and dark.

## Type

Plus Jakarta Sans (variable), bundled with `@fontsource-variable/plus-jakarta-sans` so it works offline and makes
no external request. Money uses tabular numerals (`.tabular`).

## Density

| Element | Size |
| --- | --- |
| Summary balance | 24px bold; labels 11px; In/Out values 14px |
| Entry row | two lines: category, party, remarks and amount (14px); time, mode and running balance (11px); 8px vertical padding |
| Settings row | 46px min height, 14px title, 11px subtitle |
| Pill button | 32px tall (tap area extended to 44px with an invisible pseudo-element) |
| Search and filter button | 40px |
| Bottom dock | 56px plus safe area; icons 20px; active label 13px |
| Cash In / Cash Out bar | 14px labels, 10px vertical padding |
| Sheet inputs | 16px text (prevents iOS zoom), 10px vertical padding |

Visible controls are compact by design; where a visible control is under 44px, its hit area is extended so touch
targets stay usable.

## Components

| Component | Notes |
| --- | --- |
| `BottomNav` | 3 tabs, icon dock with inverted active pill |
| `SummaryCard` | net balance with Cash in and Cash out; used on Books, Reports and each book |
| `ListGroup` (`Group`, `Row`, `PillButton`) | PocketDays-style settings lists |
| `Menu`, `MenuItem` | dropdown in a portal with fixed positioning: never clipped by cards, right-aligned to its button, flips above it near the screen bottom |
| `Sheet` | bottom sheet in a portal above the dock (layers: dock 40, sheet 60, confirm 70, update banner 500, toast 1000); drag handle, Escape, backdrop |
| `BookAvatar`, `BookEditSheet` | book icon and color, picker with live preview |
| `FilterBar` | search plus a filter button that opens a sheet; active filters show as removable chips |
| `SwipeRow` | swipe left to reveal Delete; the action is fully hidden at rest |
| `ConfirmDialog` | irreversible actions only |
| `ToastHost` | polite live region, optional Undo |
| `UpdateBanner` | "New version available" when a new service worker is waiting |

## Settings structure

Appearance (theme control), Sync (sign in, or account rows with Sync now and Manage), App (Install, Version with
Check for updates, Storage with Protect). One line of helper text per row at most; anything longer lives in a sheet.

## Accessibility checklist

- Every input has a visible or `sr-only` `<label>` tied with `htmlFor`; icon-only buttons have `aria-label`.
- Radio-like controls (theme, icon, color) use `role="radiogroup"` and `role="radio"` with `aria-checked`.
- Errors appear next to the field with `role="alert"`; sheets are `role="dialog"` and close with Escape.
- Inputs are 16px text with `inputMode` set; pinch zoom is not disabled.
- Status is never color-only; focus rings are visible on inputs.

## Icons

Inline SVG only, about 1.8px strokes, no icon libraries. Replace `public/icons/icon-192.png` and `icon-512.png`
with your own artwork (the shipped ones are placeholders).
