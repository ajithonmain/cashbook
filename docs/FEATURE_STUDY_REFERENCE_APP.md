# Feature study: reference app walkthrough (screen recording)

Source: a 2m14s screen recording of a commercial Android app also called "CashBook" (by Kodezen; unrelated
to this project, name collision only). Studied frame-by-frame to document its **flows and UI elements**, not
its visual design, per the brief ("inspire the flow... not the UI"). This doc maps each screen, cross-references
it against what this repo already has, and flags what's realistically worth building here given our
invariants (single-user accounts, no cross-account sharing, self-hosted, offline-first).

## 1. Cashbooks (book list) screen

- Business/profile switcher at top ("Tap to switch business") -- **not applicable**: we have no
  multi-business concept, just per-account scope.
- Dismissible tip banner ("Basics of CashBook... Know more").
- "Your Books" section header with sort icon and search icon.
- "Add New Book" as a full-width list row (not just a FAB).
- Each book row: icon, name, "Updated on <date>", running balance (colored), overflow menu (`...`).
- Floating "Ask coach" pill button (AI assistant) -- **out of scope**, no AI assistant goal here.
- Bottom nav: Cashbooks / Passbook / Help / Settings.

**We already have**: [BookList.tsx](../src/components/BookList.tsx) with add-book FAB, book rows, balance.
**Gap worth closing**: search/sort across books; "Updated on" timestamp on the row (we store `updatedAt`
already, just not surfaced here).

## 2. Book detail / transaction list screen

- Header: book name, "Tap here for book settings", add-member icon, PDF export icon, overflow menu.
- Search bar: "Search by remark or amount".
- Horizontal scrollable filter pill row: Select Date, Entry Type, Members, Party, Category, Payment Mode --
  each opens its own filter sheet, and an active filter pill turns solid/colored with a count badge.
- Summary card: Net Balance, Total In (+), Total Out (-), with "View reports" and "Ask coach" links.
- "Showing N of M entries" line (tells the user filters are narrowing the list).
- Entries grouped by date heading. Each row: category/payment-mode chips, amount (colored), running
  "Balance: X" under the amount, remark text, "Entry by <name> at <time>".
- Sticky bottom bar: mic (voice entry) + **Cash In** / **Cash Out** buttons.

**We already have**: [BookDetail.tsx](../src/components/BookDetail.tsx),
[TransactionList.tsx](../src/components/TransactionList.tsx), [FilterBar.tsx](../src/components/FilterBar.tsx),
`SummaryCard`, Cash In/Out buttons.
**Gaps worth closing**:
- No **date filter** at all today (All Time / Today / Yesterday / This Month / Last Month / Single Day /
  Date Range). This is the single most useful missing filter.
- Filters are single-select `<select>` dropdowns in one sheet; the reference app uses one **pill per filter
  dimension** that opens its own sheet, which scales better once there are many categories. Worth adopting the
  pattern (separate compact filter chips) even if we keep it one sheet for small screens -- see "Decisions
  needed" below.
- No running per-entry balance shown inline (we show it only in the summary card, not per row).
- No "Showing N of M" indicator when filters are active.
- Voice entry, Members filter, "Ask coach" -- out of scope (no speech-to-text, no sharing, no AI assistant).

## 3. Filter sheets (Category / Date / Member / Party / Payment Mode)

- Each is a full-height modal: search box at top, "Entries with" section, checkbox list (**multi-select**,
  not single-select), sticky "Clear" / "Apply" footer.
- Category filter list order matches the book's custom category order (see Category Settings below).
- Date filter is a single-select radio list: All Time, Today, Yesterday, This Month, Last Month, Single Day,
  Date Range.
- Payment Mode filter always includes a synthetic "No Payment Mode" option for entries with none set.

**Gap worth closing**: our filters are single-select; multi-select (e.g. "Food OR Travel") is strictly more
useful and the UI pattern (checkbox list + search + Clear/Apply) is simple to replicate in our existing `Sheet`.
Date range filtering is new.

## 4. Reports ("Generate Report") screen

- Filters block: Duration, Entry Type, Category, Payment Mode (each a dropdown reusing the same filter
  sheets as above).
- "Select Report Type" radio list:
  - All Entries Report -- full list with details
  - Day-wise summary -- total in/out/balance per day
  - Party-wise summary -- per party (greyed out here since this book has Party turned off)
  - Category-wise summary -- income & expenses per category
  - Payment Modes summary -- income & expenses per payment mode
- "Customize PDF Report" link -- lets the user choose which columns appear in the generated PDF.
- Two export buttons: **Generate Excel**, **Generate PDF**.

**We already have**: [Reports.tsx](../src/components/Reports.tsx) is only a per-book totals list (no
filtering, no report types), and [lib/export.ts](../src/lib/export.ts) exports one fixed PDF/CSV layout of
raw entries for a book.
**Gap worth closing**: this is the biggest functional gap. Turning "Reports" into a real report builder
(duration + entry-type + category + payment-mode filters, then a choice of report type, then
Excel/PDF/CSV output) is high value and fits cleanly on top of our existing `lib/export.ts`.

## 5. Book Settings screen

- Cashbook Name with inline "Rename" action.
- Entry Field Settings (Category / Payment Mode / Party / Custom Entry Fields) -- each toggled **ON/OFF**
  per book.
- Book Activity -- "only available in Group Books" (members/activity log) -- **out of scope**, this repo has
  no book sharing (see roadmap note in [AGENTS.md](../AGENTS.md): "There is no sharing between accounts").
- Members / roles / "Add members" -- **out of scope** for the same reason.

**We already have**: no book-settings screen at all; category/payment-mode are **global, hardcoded constants**
(`CATEGORIES_IN`, `CATEGORIES_OUT`, `PAYMENT_MODES` in [lib/types.ts](../src/lib/types.ts)), not per-book,
not user-editable, and there's no way to turn the Party field off even though it's already optional in data.
**Gap worth closing**: a Book Settings screen, and turning category/payment-mode from hardcoded constants
into **per-book, user-editable lists** (add/rename/delete/reorder/show-hide), is the second biggest
functional gap and the thing the "Common tasks" section of AGENTS.md already anticipates changing.

## 6. Entry Field Settings -> Category Settings (and identically for Payment Mode)

- "Show field" toggle (hide the whole field from the entry form and filters).
- "Required field" toggle (can't be left blank when it's shown).
- "+ Add new Category" / "+ Add new Payment Mode".
- "Import from other books" -- copy another book's category/payment-mode list into this one.
- List of existing values with a drag handle (reorder) and a `...` overflow menu (rename / delete, implied).

**Gap worth closing**: this is the concrete feature that makes categories "ours" per book instead of a fixed
global list. Reorder + rename + delete + add, with the list order then driving both the entry form's
`<select>` order and the category filter's order.

## 7. Settings (app-level) screen

- Business profile strength meter, subscription card, "Employee Expenses" upsell, Business Team, Move Book
  Requests, Business Settings -- **all out of scope** (multi-business / teams / payments, none of which this
  self-hosted, single-owner project has or needs).
- Help & Support, App Settings (Language, Theme, Security, Backup), Your Profile, About, Business Card /
  "CashBook for PC" / Share App, Logout.

**We already have**: [Settings.tsx](../src/components/Settings.tsx) with theme and account rows.
**Gap worth closing**: none of the business/team rows apply; "Share App" (share the install link) is a small,
cheap addition if desired, otherwise this screen is already close to the useful subset.

## Decisions needed before implementing

The reference app's flows span business/team features this project deliberately doesn't have. Scoping to
what fits the single-user, self-hosted model, the two features with real leverage and no architectural
conflict are:

1. **Per-book custom Category & Payment Mode lists** (add/rename/delete/reorder/show-hide/required), with a
   new Book Settings screen as the entry point. Needs a new migration (categories/payment-modes become rows,
   not constants) and touches `TransactionForm`, `FilterBar`, `Reports`, and both sync routes.
2. **Date filter + multi-select category/payment-mode filters**, replacing the single-select `<select>`
   filters in `FilterBar.tsx` with the checkbox-list-+-search sheet pattern, and adding the
   All Time/Today/Yesterday/This Month/Last Month/Single Day/Date Range picker.
3. **A real "Generate Report" flow**: filters (duration, entry type, category, payment mode) + report type
   (All entries / Day-wise / Category-wise / Payment-mode summary) + Excel and PDF output, replacing the
   current totals-only `Reports.tsx`.

Party field show/hide and "Custom Entry Fields" (arbitrary user-defined fields) are the same pattern as (1)
but lower value for a personal ledger app -- worth a follow-up once (1) lands, not before.
