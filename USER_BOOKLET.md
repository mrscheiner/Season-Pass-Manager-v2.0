
# Season Pass Manager

## User Booklet

_Last updated: 2026-02-02_

Season Pass Manager helps you track season-ticket seat inventory, record sales for each game, and understand revenue/profit across a season. It runs on iOS, Android, and the Web.

Suggested use:
- Keep this file in the project as your “manual”.
- Print to PDF for a shareable booklet.

<!-- pagebreak -->

## Table of contents

- [1) Quick start](#1-quick-start)
- [2) Core concepts](#2-core-concepts)
- [3) The main tabs](#3-the-main-tabs)
- [4) Common workflows](#4-common-workflows)
- [5) Backups, restore, and “Clone Kits”](#5-backups-restore-and-clone-kits)
- [6) Imports and exports](#6-imports-and-exports)
- [7) Advanced tools and troubleshooting](#7-advanced-tools-and-troubleshooting)
- [8) Web vs. phone differences](#8-web-vs-phone-differences)
- [Quick reference (1 page)](#quick-reference-1-page)
- [FAQ](#faq)
- [Appendix: Export this booklet to PDF](#appendix-export-this-booklet-to-pdf)
- [Appendix: Tips](#appendix-tips)
- [Appendix: Glossary](#appendix-glossary)

---

<!-- pagebreak -->

## 1) Quick start

### If you’re brand new
1. Open the app.
2. Go through Setup:
   - Choose a league
   - Choose a team
   - Enter a season label (example: `2025-2026`)
   - Add at least one seat entry (section/row/seats + optional price paid)
     - Setup supports **Paired** (exactly 2 seats like `1-2`) and **Individual** (1+ seats like `1,2,3`).
3. After setup, use **Schedule** to enter sale prices per game.
4. Use **Dashboard** and **Analytics** to see totals.

### If you already have data (restore)
- Go to **Settings → Restore from Code** and paste a recovery code, **or**
- Go to **Settings → Restore from File** and select a backup file (JSON / package output).

---

<!-- pagebreak -->

## 2) Core concepts

### Season Pass
A “Season Pass” is one team + one season label + your seat entries + a schedule + recorded sales.

### Seat entry (a.k.a. “Seat Pair”)
A seat entry represents a set of seats you own in the same section/row.
- Example: `Section 308, Row 8, Seats 1-2`
- **Price Paid** (stored as `seasonCost`) is the total you paid for that seat entry for the season.

Seat entries are used to:
- compute seats-per-game
- compute total season cost
- track sales per seat entry for each game

### Game sale record
For each game, you can enter a sale amount for each seat entry.
- Sale has a price
- Sale has a payment status (typically **Paid** or **Pending**)
- Sale stores a sold date

### Seats sold vs. payments
- **Seats sold** is seat-count based (not “number of sales rows”).
- **Pending payments** counts seat entries that have a sale price but are still marked pending.

---

<!-- pagebreak -->

## 3) The main tabs

This section is written “tab by tab” so you can treat it like a quick UI guide.

### Dashboard (Home)

**Purpose**: an at-a-glance summary of your active season pass.

**What you’ll typically see**
- An **active season pass selector** (use this if totals look “wrong”).
- Four stat cards:
   - **Total Revenue** (and a small “seats sold” subtext)
   - **Seats Sold** (tap to open details)
   - **Avg Price** (average price per seat)
   - **Pending** (number of pending payment records)
- A **Recent Sales** list (usually last 5 sales).
- A **View All (N)** link that opens **All Sales**.

**Common actions**
- Switch your active pass (if you track multiple seasons/teams).
- Tap **Seats Sold** or **View All (N)** to open **All Sales**.

**Tips**
- If your numbers don’t match expectations, first confirm the active season pass is the one you meant.

### Schedule

**Purpose**: record game-by-game sales for each seat entry.

**Top controls**
- **Filter**: All Games / Preseason / Regular / Playoff
- **Search**: matches opponent/date/time/game #, and also matches sale fields like section/row/seats/price.

**Game list (what the cards mean)**
- Each game card shows opponent, date/time, and often **seats available**.
- The **Paid/Pending** badge reflects whether all recorded sales for that game are fully paid.
- Past games may appear visually muted.

**Recording a sale (most common workflow)**
1. Open **Schedule**
2. Tap a game to open **Game Sales**
3. For each seat entry:
   - enter the **sale amount** (for that seat entry as a block)
   - toggle **Paid / Pending**
   - press the ✅ button to save that entry
4. Press the ✅ at the top-right to “Save all and close”.

**Editing/removing a sale**
- If you clear the price for a seat entry that previously had a sale, the app removes that sale record when saved.

**Seat math**
- “Seats available” is computed from your configured seats-per-game minus seats sold for that game.
- Seats sold is based on seat-count, not “number of rows”. A 4-seat entry counts as 4 seats sold.

### Analytics

**Purpose**: turn schedule + sales into season performance summaries.

**Season Overview**
- **Total Revenue**: sum of all recorded sale prices.
- **Seats Sold**: total seats across all sales (counts seats even if payment is still pending).
- **Sold Rate**: seats sold ÷ total seats available across the schedule.

**Monthly Revenue**
- Buckets revenue by the sale’s **Sold Date**. (If a sale has no sold date, it may not show in this chart.)

**Seat Pair Performance**
- Per seat entry: season cost, revenue, games sold, seats sold, and balance (revenue − season cost).

**Insights**
- **Average Price Per Seat**: total revenue ÷ seats sold.
- **Pending Payments**: number of sale records marked Pending.

### Events

**Purpose**: track non-season-game tickets (concerts, shows, etc.) separately from the season schedule.

**What you can do today**
- View totals: paid, sold, profit/loss.
- Delete events.

**Current limitation**
- The UI shows an “Add Event” button, but in some builds it may not be wired to an add flow yet.

### Settings

**Purpose**: manage season passes, backups, restore, imports/exports, and advanced tools.

**Season Passes**
- **Add Season Pass**: starts Setup.
- **Edit Active Season Pass**: update seats / section / row / price paid.
- **Embed Logos in Backup (Offline Restore)**: makes backups self-contained by embedding logos (bigger files, easier offline restores).

**Schedule tools**
- **Resync Schedule**: fetch latest home games from ESPN while preserving sales.
- **Import Schedule**: replace the schedule from CSV/Excel (sales are preserved when mapping matches).

**Data management**
- **Export as Excel / CSV**: share your sales in spreadsheet-friendly formats.
- **User Booklet PDF**: exports this booklet as a PDF (download on web; share sheet on iOS/Android).

**Recovery & transfer**
- **Email Backup**: share a raw data backup JSON.
- **Generate & Email Clone Kit**: recommended for transferring a complete working state.
- **Restore from Code / Restore from File**: replace current data with a provided recovery code or backup file.

**Advanced / Troubleshooting**
- Contains destructive/debug tools (only use if you understand the impact).

**Danger Zone**
- Delete Current Season Pass
- Clear All Data

---

<!-- pagebreak -->

## 4) Common workflows

### A) Add a new season pass (another team)
1. Go to **Settings → Add Season Pass**
2. Complete Setup

### B) Edit seats or “Price Paid” after setup
1. Go to **Settings → Edit Active Season Pass**
2. Edit a seat entry (section/row/seats/price paid)
3. Save

Tip: “Price Paid” should be the total season cost for that seat entry (not per-game).

### C) Enter sales for a game
1. Go to **Schedule**
2. Tap a game
3. Enter prices + toggle Paid/Pending for each seat entry
4. Save

### D) Mark payments as received
Payments are controlled by the **Paid / Pending** toggle per seat entry within each game.

### E) Check profit/loss
- Open **Analytics → Seat Pair Performance**
- Look at “Balance” per seat entry and total net profit/loss

---

<!-- pagebreak -->

## 5) Backups, restore, and “Clone Kits”

This app is designed to be resilient: it keeps a working copy of your data and also writes backup snapshots.

### Two kinds of “backups”

**1) Automatic internal snapshots (everyday safety)**
- The app automatically writes internal snapshots while you use it.
- On Settings you’ll see a **Backup saved / Backup failed** status card.
- If it fails, you can hit **Retry**.

This protects against normal app refreshes/crashes — but it does **not** help if you lose the phone, uninstall the app, or switch devices.

**2) User-generated backups (recommended weekly)**
These create a file you can store somewhere safe and use later to restore.

Recommended routine:
- Once a week (or before anything risky), go to **Settings → Generate & Email Clone Kit**.
- Save the file somewhere safe (Files/iCloud Drive/Google Drive/OneDrive, etc.).

Note: The Settings screen may show a warning if it has been **7+ days** since your last user-generated backup.

### iPhone/iPad: iCloud device backup
If you are on iOS, enabling **iCloud Backup** is strongly recommended. iCloud device backups include app data automatically.

### Embed Logos in Backup (Offline Restore)
In **Settings → Embed Logos in Backup (Offline Restore)**:
- **ON**: backup includes logos embedded (self-contained/offline-friendly).
- **OFF**: backup stores logo links; logos re-download when online.

### Clone Kit (recommended for a “complete clone”)
**Settings → Generate & Email Clone Kit** creates a “Clone Kit” intended for transferring your full state.

What it includes (in one artifact):
- Recovery Code (compressed)
- Full backup JSON (raw)
- A human-readable “App Snapshot” / rebuild guide

Sharing behavior depends on platform:
- On iOS/Android: opens the share sheet with the file attached.
- On Web: uses the browser’s share features when available; otherwise falls back to clipboard/download.

### Restore from Code
**Settings → Restore from Code**
- Paste a recovery code
- Restore replaces your current data with the code’s contents

### Restore from File
**Settings → Restore from File**
- Choose a backup file (JSON or other export file produced by the app)
- Restore replaces your current data with the file’s contents

---

<!-- pagebreak -->

## 6) Imports and exports

### Export as Excel
**Settings → Export as Excel**
- Produces an `.xlsx` workbook with your sales data.

### Export as CSV
**Settings → Export as CSV**
- Produces a CSV file suitable for spreadsheets.
- Also copies “detailed rows” to your clipboard for easy Excel paste.

### Import Schedule (CSV/Excel)
**Settings → Import Schedule** replaces the schedule for the active season pass.

Important notes:
- Sales data is preserved, but if a new schedule does not map to old games, some sales can become orphaned.
- See the detailed format guide in [SCHEDULE_IMPORT_README.md](SCHEDULE_IMPORT_README.md).

### Resync Schedule (ESPN)
**Settings → Resync [Team] Schedule**
- Fetches the latest **home games** for the team.
- Intended to preserve sales while refreshing schedule details.

---

<!-- pagebreak -->

## 7) Advanced tools and troubleshooting

The **Advanced / Troubleshooting** section contains tools that can be destructive or are meant for recovery/debug.

Examples you may see:
- Attempt ESPN Logos (fills missing opponent logos)
- Restore All Season Pass Data (recover from last backup)
- Replace Sales Data (paste a seed block to overwrite sales)
- Force Replace Panthers Sales (restores canonical dataset; for debugging/fixtures)
- Email Backup (raw data backup)
- Export Backup to Folder (choose Email/Messages/Save to Files)

### Danger Zone
- Delete Current Season Pass
- Clear All Data

---

<!-- pagebreak -->

## 8) Web vs. phone differences

### Storage
- iOS/Android store locally on-device.
- Web stores locally in your browser (site storage).

Important web note:
- Browser storage is tied to the site origin (including port). `http://localhost:8081` and `http://localhost:8083` are treated as different storage by the browser.

### Sharing
- iOS/Android generally support sharing files via the OS share sheet.
- Web sharing varies by browser (mobile browsers support more “share sheet” behaviors than desktop).

---

<!-- pagebreak -->

## Quick reference (1 page)

### Daily use (most common)
- Open **Schedule** → tap today’s game → enter sale price(s) → toggle **Paid/Pending** → save.
- Check **Dashboard** for at-a-glance totals.
- Check **Analytics** for monthly revenue + seat entry performance.

### Before anything risky
- Generate a Clone Kit (Settings → Generate & Email Clone Kit).

### When money looks “off”
- Confirm you’re on the right season pass (Dashboard selector).
- Confirm sales are saved per-seat-entry inside each game (Schedule → game → ✅ on each seat entry).
- Confirm payment status (Paid vs Pending) matches reality.

### Restore (when switching devices or recovering)
- Prefer: Settings → Restore from File → select your latest backup/clone kit JSON.
- Alternative: Settings → Restore from Code → paste recovery code.

### Web gotcha
- Your data is tied to the exact URL origin, including port.
- Example: `http://localhost:8081` and `http://localhost:8083` do not share storage.

<!-- pagebreak -->

## FAQ

### Does “Price Paid” mean per game or per season?
It’s the total season cost for a seat entry (stored as `seasonCost`), not a per-game number.

### Why does a game show “seats available” differently than expected?
Availability is computed from your configured seats-per-game minus seats sold for that game. Double-check seat entries (section/row/seats) and whether each seat entry has a sale recorded for that game.

### What’s the difference between Backup, Recovery Code, and Clone Kit?
- Backup: saved JSON snapshot of your full app state.
- Recovery code: compressed representation of the same state.
- Clone kit: a shareable package that includes both (plus a rebuild guide).

### Will “Embed Logos in Backup (Offline Restore)” make my file bigger?
Yes. It converts logos into embedded `data:` URIs so restores work offline/self-contained.

<!-- pagebreak -->

## Appendix: Export this booklet to PDF

- In VS Code: open this file → use the Markdown preview → print to PDF.
- Or on GitHub: open the file in the browser → print.

---

## Appendix: Tips

- When in doubt, generate a Clone Kit before doing risky operations (imports, mass edits).
- Keep seat entries accurate: they drive seat counts, availability, and analytics.
- Use “Paid/Pending” consistently to keep “Pending payments” meaningful.

---

## Appendix: Glossary

- **Seat entry / Seat Pair**: one block of seats you own (section/row/seats) with a season price paid.
- **Sale record**: the price + status for a seat entry for a specific game.
- **Recovery code**: compressed representation of your full data.
- **Clone kit**: export package designed for complete transfer (recovery code + full JSON + rebuild guide).
