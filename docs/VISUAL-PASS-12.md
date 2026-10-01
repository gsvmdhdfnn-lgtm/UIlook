# Visual pass 12: the whole Hub, clickable

Pass 12 turns the prototype into a complete, clickable walk-through of the Hub. It covers Management, the Coach hub, the Parent hub and the public site. It still has no backend: every change lives in memory, shows a toast and adds a history entry saying who did it and when. A reload resets everything.

- **Feature map:** `docs/FEATURE-COVERAGE.md` lists every feature and the route that shows it.
- **Screenshots:** `docs/screenshots/pass-12/`, in four folders: `desktop/`, `phone/`, `dark/` and `joshevans/`.

## What changed
- **Nothing is a dead end.**
  - Every navigation item, tab, tile and button leads to a real screen or makes a real in-memory change.
  - The "Not part of this visual pass" placeholder and every "soon" button are gone.
  - An unknown link now shows "Page not found" with a way back to Home.
- **Routes with IDs.** For example `#mgmt-fin-invoice/INV-0011` or `#coach-register/OCC-0033`. Breadcrumbs, page titles and the navigation highlight follow each route's parent.
- **One shared kit (`js/kit.js`, `css/kit.css`).** Every area uses the same helpers for:
  - Layout: page heads, cards, grids, tabs, lists, forms.
  - Money: stored as pence, shown as £ with two decimals.
  - Dates, plus "Issued / frozen" and "Recorded by …" stamps.
  - Restricted details.
  - Loading, Empty and Error states.
- **Mock data split by area (`js/data/*.js`).** Screens read data only through small `Hub.db` helpers, never inline.
- **Needs Attention is computed live** from every area, through 21 rules with thresholds and locked minimums. Fixing the underlying issue clears its case. Accepting a case or overriding its severity needs a reason and an approver, and stays in the history.
- **The prototype bar** gains Finance access (None / View / Manage), Coach role (Lead / Coach / Learning), Feature switches and Scenario (five guided walkthroughs).
- **Immutable money.**
  - Issued invoices, credit notes, payments and past outcomes never get an edit button.
  - Corrections go through credit notes, replacement invoices and reversals.
  - All finance figures are computed from mock entries and reconcile. For example, September coach cost (£1,153.77) matches the allocations, the work summaries and the payment run.
- **Sensitive details are visibly restricted.** Medical details, support needs, emergency contacts and before/after values show a "Restricted" tag to people allowed to see them, and a locked panel to everyone else (for example a learning coach).

## How it was checked
- **Every route** (Management, Public, Parent hub and Coach hub) was rendered with Playwright and showed no page errors and no horizontal overflow, in every combination of:
  - 1440 and 390 wide;
  - light and dark;
  - Relvor and Josh Evans;
  - for the Coach hub, all three coach roles.
- **Loading, Empty and Error states** were checked for each area.
- **All five walkthroughs** were stepped through end to end at desktop and phone width.
- **The rendered text of every route** was scanned for storage words ("record" as a noun, "table", "row", "base", "database"). The code was searched for any mention of Airtable, Supabase or Google Sheets.
- **Scripted flows** covered:
  - issuing NC-1013, then a part payment, a credit note and applying a credit (balance £30.00);
  - registers and cover from offer to covered;
  - membership cancellation;
  - parent booking and checkout with family credit;
  - feedback from coach draft to Management publish.

## Unclear or contradictory points, and the choice made
1. **Real names in the brief.** The brief named Freemen's and Parkside, but you had earlier asked for invented names because the repo is public. They became Northgate School After-School (£50 + £10 VAT = £60 per occurrence) and Harbour Lane School (£1,296.00 overdue: 54 × £20 + VAT). The figures are unchanged.
2. **Mock data counts.**

   | | Brief | Built | Why |
   |---|---|---|---|
   | Players | ~25 | 29 | 3 extra for inactive and imported edge cases |
   | Parents | 18 | 21 | 3 extra for ended links |
   | Coaches | 8 | 8 | |
   | Clients | 4 | 4 | |
   | Sessions | 6 | 8 | one Draft and one Inactive, so every lifecycle state exists |
   | Occurrences | ~60 | 64 | |
   | Invoices | 12 | 12 | |
   | Credit notes | 1 | 1 | |
3. **Making the business reconcile.** The brief said to change the mock entries rather than the headline figures. Two directors are salaried and the learning coach is an unpaid placement, so their work costs £0.00. Riverside's school sessions are priced per class (two classes). September shows a small profit (£72.46 actual).
4. **The commit for each area.**
   - **Shared foundation:** the kit, routing, shared data and Needs Attention went into the first (Finance) commit, because every area depends on it. Later area files appear there as stubs and are filled in by their own commits.
   - **Shared fixes:** fixes to shared files that an area needed went into that area's commit. For example, approved detail changes now update the child's medical and emergency details, in the Parent hub commit.
5. **Two coach roles, two meanings.**
   - The Coach role switch picks who is signed in: Charlie Hughes (Lead), Jack Morgan (Coach) or Ellie Shaw (Learning coach).
   - On a given session, register and sign-off rights follow that coach's session role; the Team card follows the hub role.
6. **Medical re-confirmation each term** shows as a parent action rather than a Needs Attention case, because almost every player is due at the start of term.
7. **Tom Reid's holiday (12–16 Oct)** is treated as already approved. It affects two Riverside PPA occurrences (Mon 12 and Thu 15 Oct), and cover is offered to Priya.
8. **Two feature switches start off**, matching the brief: Communications and Session requests. Each related screen shows a clear "switched off" notice.
9. **Booking charges** from the parent checkout count as Camps & events income and have no membership.
10. **The Josh Evans brand** uses its image logo in the header, so renaming the organisation in Settings shows in the page title and the preview card rather than the header.
