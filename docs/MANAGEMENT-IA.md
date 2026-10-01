# Management simplification: strong underneath, simple above

This pass changes how the Management Hub is organised and what it calls things. Nothing underneath it changed:

- The visual system is the same.
- The mock data model, business logic, routes and Coach, Parent and Public screens are the same.
- Every detailed screen from pass 12 still exists. Many now sit one step deeper.

**Checks run:**
- **Every route:** no errors and no sideways scrolling at desktop and phone, in light, dark and Josh Evans.
- **Walkthroughs:** all 66 steps pass.
- **Figures:** September finance totals and the 28 Needs Attention items are the same as before.

Screenshots: `docs/screenshots/pass-12/management-ia/`.

## 1. Management Home
Home now centres on four areas, shown as four equal cards:

| Area | Card shows | Covers |
|---|---|---|
| **Sessions** | Sessions today; how many need you | Everything that is happening, and when |
| **Coaches** | Active coaches; how many need you | Who is working, availability, documents, cover, pay and work |
| **Players & Parents** | Active players; how many need you | Players, parents, families, memberships, requests, bookings |
| **Financials** | Money owed to us; how many need you | Money in, money out, cash and the month's position |

The rest of Home:
- **Needs attention.** It now sits before Today's schedule. Each item names its action ("Choose a coach", "Arrange cover", "Chase payment") and opens the actual task. The case drawer, with accept and change-priority, stays on the full Needs Attention page.
- **Today's schedule.**
- **Approvals waiting, Tomorrow and Calendar** in the side column.
- **Search and Add new** in the header.
- **"Since you last looked" moved off Home.** Its history is in More → History.
- **On phones, urgent items** stay summarised at the top.
- **Shared terms.** The generic Relvor brand now uses Coach and Parent, the same as Josh Evans, so "Staff" and "Client" no longer appear.

## 2. Navigation
Management still has only two places in its main navigation: **Home** and **More**.

- **Every detailed screen belongs to one of the four areas.** The breadcrumb reads, for example, Home › Sessions › U12 Academy › Thu 1 Oct. The sidebar shows the current area under Home.
- **Financials moved out of More** and onto Home.
- **Approvals moved to Home.** It appears in the side column, and on its own page under Home.
- **More is now only for less frequent work:**
  - Development & communication: Development, Communications, Content & Brand.
  - Reports & history: Reports, History.
  - Settings: Settings & System, Needs attention rules.
  - Account.

## 3. Area landing pages
Each area opens on a simple page that answers four questions:
1. What is happening?
2. What needs me?
3. What do I usually do here?
4. How do I find the thing I need?

Everything else sits in a closed **"More in…"** list at the bottom of the page.

| Area | Top of the page | Main actions | Finding things | "More in…" |
|---|---|---|---|---|
| Sessions | Needs you, Today, Later this week | Add session, Calendar | Search, All sessions, Venues | Upcoming sessions, Registers, Attendance, Who can join |
| Coaches | Needs you, At a glance | Add or invite a coach, Record time off | Coach directory with search and filters | Cover, Availability and time off, Coach pay, Work summaries, Documents, Session roles, New coach sign-ups, Coaches on trial |
| Players & Parents | Needs you, figures, Also worth checking | Add a player or family, Find a player | Search, Players, Parents | Families, Memberships, Move players onto sessions, Requests, Parent claims, Trial interest, Session requests, Bookings, Charges and credits, Prices and policies, History |
| Financials | Month figures, Needs you, Upcoming payments, Cash | The six sections in the bar | Invoices, Parent payments | Invoices to issue, Payments received, Credit notes, Client credits, Clients, Profit by session, Coach pay, Finance settings, Connected apps, Access and history |

## 4. Moved one step deeper
These were shown up front before. They are now inside their area's "More in…" list, or one click into a person or session.

- **Sessions:** Session dates, Registers, Attendance and Who can join were tiles on the Sessions page. "Registers outstanding" was a separate table; incomplete registers still show in Needs you and Today.
- **Coaches:** the six workspace tiles (Session roles, Coach pay, Availability, Documents, Cover, Work summaries).
- **Coach profile:** eight tabs became five.
  - Rates, Pay and Work summaries are now **Pay & work**.
  - Availability and Cover are now **Time off & cover**.
- **Players & Parents:** the eight tiles (Families, Memberships, Requests, Bookings, Commercial setup, Adjustments, Move players, History).
- **Financials:** the 14-tab section bar. It now shows six sections. Drafts, Clients, Payments, Credit notes, Client credits, Session profit, Connected apps, Settings and Access are in "More in Financials". When you open one, its name joins the bar.
- **Bookings, Commercial setup and Adjustments** moved from More into Players & Parents.

## 5. Wording changes on Management screens
These build on `docs/LANGUAGE-AUDIT.md`.

| Was | Now |
|---|---|
| Schedule & Sessions | Sessions |
| Finance | Financials |
| Staff / Players & Clients (generic brand) | Coaches / Players & Parents |
| Staff (on a dated session); Update staff; Save staff | Coaches for this date; Change coaches; Save coaches |
| Default staffing | Regular coaches |
| Actual role | Role on the day |
| No staff assigned; Staff unavailable | No coach yet; Coach unavailable |
| Record absence; Add exception (availability) | Record time off; Add time off or a change |
| Rate at the time; Units; rate profile | Rate used; Hours; rate |
| Billing exception / Add billing exception | Change charge for a session |
| Financial outcome; Record financial outcome | Refunds and credits; Decide refunds and credits |
| Commercial setup; Commercial adjustments | Prices and policies; Charges and credits |
| Player migration (tile) | Move players onto sessions |
| Session · OCC-0035 (eyebrow and breadcrumb) | The date, for example Thu 1 Oct |
| Attention actions in title case ("Assign Staff", "Resolve Cover", "Review Compliance", "Record Outcome") | Plain actions ("Choose a coach", "Arrange cover", "Check documents", "Decide refunds and credits") |
| Case accepted / Case reopened | Item accepted / Item reopened |

A dated session now goes back to its own session, not to a list of dates.

## 6. Kept on purpose (still reachable)
- **Every pass-12 screen and route still exists:**
  - session dates;
  - coach pay items and the pay item detail;
  - rate history;
  - cover requests;
  - work summaries;
  - documents;
  - session roles;
  - eligibility;
  - attendance;
  - every Finance tool;
  - commercial setup;
  - adjustments;
  - parent claims;
  - trial leads;
  - the Needs Attention rules and exceptions.
- **The underlying concepts are unchanged.** Occurrence, Allocation, Session Staff, Occurrence Staff, rate snapshots, billing overrides and the attention rule engine all still drive the screens, under their precise names in code, routes and data.
- **Management keeps its stable IDs** (INV-, MEM-, COA-) where staff use them to find things.

## 7. Still more complex than ideal
- **Deeper Finance tools** (Invoices to issue, Credit notes, Client credits, Payments received) still read like accounting software. That is acceptable one step down, but they would benefit from their own simplification pass.
- **The coach profile's Pay & work tab** is long, with work done, summaries, rates and the change-rate form on one page.
- **The Players & Parents landing page** carries Needs you, figures, two cards and "Also worth checking". It is the busiest of the four.
- **The Needs Attention page** still shows rule IDs and the accept or change-priority controls. That is fine for a manager who wants it, but it is the most system-like page left at the Home level.
- **No form for adding a brand-new player.** By design, new families sign up and are matched; "Add a player or family" explains this and offers the real routes.
- **Approvals mixes coach and family items** on one page. Each item also appears in its own area.

## 8. New-manager walkthrough
Each task was started from Home and done only by clicking visible labels, then checked for internal terms. The test script is in the session scratchpad.

| Task | Path | Clicks | Internal terms seen |
|---|---|---|---|
| What sessions are happening today? | Home → Today's schedule | 0 | None |
| What needs my attention? | Home → Needs attention (plus a count on each area card) | 0 | None |
| Change a coach (example: Friday's U13/14, as no Saturday group exists) | Home → U13/14 Development (from Needs attention or Tomorrow) → Change coaches | 2 | None |
| Change a coach, browsing | Sessions → Later this week → U13/14 Development → Change coaches | 3 | None |
| A coach is unavailable next week | Coaches → Record time off | 2 | None |
| A coach needs cover | Coaches → Needs you → Arrange cover | 2 | None |
| What did Tom work last month? | Coaches → Tom Reid → Pay & work | 3 | None |
| A parent has requested cancellation | Players & Parents → Needs you → Decide cancellation | 2 | None |
| I need to find a player | Players & Parents → Find a player (or the header search: 1) | 2 | None |
| I need to see an overdue payment | Financials → Needs you → NC-1011 | 2 | None |
| Create a new recurring session | Sessions → Add session | 2 | None |
| Approve a parent claim | Home → Approvals waiting → Parent claims | 1 | None |

None of these tasks needs the Hub's structure or data model. The one path that started at 5 clicks (finding a session date by browsing) became 3 after adding "Later this week" to the Sessions page.

## 9. Business logic
No mock business logic was removed or changed. Three changes touched data files, all wording only:
- **Attention action labels:** wording only.
- **One area label in `js/data/core.js`:** "Schedule & Sessions" became "Sessions".
- **Relvor brand terms in `js/brand.js`:** Staff/Client became Coach/Parent.

The only new behaviour is navigation:
- breadcrumbs by area;
- the "More in…" lists;
- the Needs you lists, which read the existing attention cases;
- the "Add a player or family" explainer, whose "copy link" action only shows a confirmation.
