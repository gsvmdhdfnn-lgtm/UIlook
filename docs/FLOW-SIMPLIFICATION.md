# Flow simplification: strong underneath, simple above

This pass simplifies how people move through the Hub. It adds no new capability:

- The mock data model and business logic are unchanged, and no routes or screens were removed.
- The visual system is unchanged, apart from the navigation motion described in section 9.
- Only UIlook was changed. The real Josh Evans Hub was not touched.

**Checks:**
- **Every route:** no errors and no sideways scrolling, in light, dark and Josh Evans, on desktop and phone, for Management, Coach (all three roles), Parent and Public.
- **Walkthroughs:** all 66 steps pass.
- **Figures:** September finance totals and the 28 Needs Attention items are unchanged.

Screenshots: `docs/screenshots/pass-12/flow/`.

## 1. Management: one mental model
**Home → Sessions, Coaches, Players & Parents, Financials**, with Needs Attention across all four. Home and More remain the only main navigation, and the four area cards stay on Home.

**Needs Attention is the single engine.**
- **Area views are filters, not queues.** Wherever an area shows "Needs you" or "need action", it is a filtered view of the same master list. "See all" opens Needs Attention filtered to that area; the page now has area filters for Sessions, Coaches, Players & Parents and Financials.
- **Profiles and session dates show the same items.** A coach, player, family or session date shows its own items from the master list in a "Needs you for …" panel. They are the same items, so fixing one clears it everywhere.
- **Fix, then return.** Opening an item records where you launched it from. Once the fix clears the item on the live re-check, the Hub says "That item is cleared" and takes you back. Example: Home → "U12 Academy is not confirmed" → Confirm session → back to Home.
- **Duplicate queue removed.** The "Also worth checking" list on Players & Parents is gone. Those items appear in Needs Attention, and in the player and parent lists.

**Back links follow where you came from.** Every page's back link now goes to the page you actually came from (a profile, a session, search, Home), not a fixed parent page. Area pages and Home reset the trail.

## 2. Sessions: diary first
- **Landing page:** Needs you, Today, Later this week, Calendar, All sessions, Venues and Add session. "Session dates" is no longer presented as its own area; it sits in "More in Sessions" as "Upcoming sessions".
- **A dated session's header** carries the everyday actions:
  - **Change coach.**
  - **Find cover.** Shown only when cover is needed; it opens that date's cover request.
  - **Open register.**
  - **More actions.** One control for change venue, change capacity, reschedule, postpone and cancel.
- **The Hub decides what changes underneath** (regular coaches, coaches for one date, a one-off change or a replacement date). The page says "Changes apply to this date only."
- **Coaches on a dated session** show without pay.

## 3. Coaches: person first
- **Profile tabs:** Overview, Sessions, Availability, Documents, Work & Pay.
- **Overview opens with:**
  - Needs you for that coach.
  - Where they work and their role.
  - Whether they are available (time off coming up).
  - Documents and last month's sessions and pay. Pay is shown only with Finance access.
- **Rates live inside Work & Pay,** below the work done and the monthly summaries.
- **Recording time off goes straight to finding cover** for the affected sessions.
- **Cover, Coach pay, Work summaries, Documents and Session roles are reached from context.** You meet them through a coach, a session or a Needs Attention item. They are still listed in the closed "More in Coaches".

## 4. Players & Parents: person and family first
- **Landing is a compact working view:**
  - Three small counts: active players, parents, need action (which opens filtered Needs Attention).
  - **Players | Parents** switch, with Players as the default.
  - Search.
  - The list itself.
- **Families, Memberships, Requests, Bookings, Parent claims, Move players, Charges and credits, Prices and policies and History** are in the closed "More in Players & Parents". Day to day, they are reached through the person.
- **Player Overview:** Needs you for that player, where they play, their parents and whether they are verified, attendance and latest feedback. Then the details: medical, support, photo permission, address and emergency contacts (restricted). Tabs follow: Development, Attendance, Memberships & bookings, History.
- **Parent page (family first):**
  - Needs you for the family.
  - The children, their places and the money: amount owed and family credit.
  - Open requests and the children list.
  - Then requests, bookings, contact and link details, terms and history.

## 5. Financials: back to the simple structure
The section bar is **Overview · Money in · Money out · Cash flow · Month report**.

- **Overview:** revenue, direct costs, overheads, profit, Needs you, upcoming payments, cash and money owed.
- **Money in (new view):** one place for everything coming in:
  - owed and overdue amounts;
  - parent payments this month;
  - invoices to issue;
  - unpaid school invoices;
  - parent payments and bookings;
  - credit notes, client credit and payments received.

  Deeper pages (all invoices, drafts, payments, credit notes, client credits, parent money, clients) keep "Money in" highlighted.
- **Money out and Cash flow** are unchanged.
- **Month report** now shows the overall result first, then the programme breakdown, profit, VAT estimate and cash, then notes and a print option.
- **Finance settings, connected apps and access** sit in "More in Financials", outside the everyday workflow.

## 6. Parent Hub: the locked simple experience
Home order is unchanged from the baseline:
1. Family and child context.
2. Next session.
3. Current actions.
4. The 2 × 2 shortcuts.
5. Family schedule.
6. Recent feedback.

The fourth shortcut is now **Browse sessions**, which replaces "Book a camp". The four are Billing & Payments, Memberships, Child profile and Browse sessions.

Parents now see results, not rules:

| Was | Now |
|---|---|
| Ending Scheduled | "Your place ends on 28 Oct" |
| Cancellation Pending | "Cancellation requested" |
| "What each status means" legend | Removed |
| "Discounts never stack…" note | Removed; the discount shows on each place |
| A line per family credit (date and source) | One line: "Family credit used −£27.00" |
| "Used oldest first, can be part-used" | Removed |
| "Notice period 30 days (rule …)" | "Notice to cancel: 30 days" |

## 7. Coach Hub: session first
- **The next-session card** says **Start register**.
- **A session page** has **Start register** and **I can't make this**. The second asks for a reason and requests cover in one step, so a coach never "creates a cover request".
- **Availability** can still mark time off and request cover.
- **Documents stay quiet unless action is needed.** Then Needs you says **"Update Enhanced DBS"** and opens the upload directly.
- **Cover** stays a dedicated page for offers and requests. **Work summary** stays a monthly destination.
- **Navigation:** the coach's players list is now called **Players** (it was "Player Hub" / "Clients").

## 8. Public → Parent booking
- **Browsing never needs an account.** Each session shows its action: Book now, Book free session, Request a trial, Join waitlist or Register interest.
- **The exact choice survives sign-in and registration.** For Book now, the visitor lands on that camp's booking with the option they chose already selected. Tested with both "Single day" and "3-day package" through the create-account path.
- **Requests after sign-up** (free session, trial, waitlist) continue to "Finish your request". They do not land on a generic Parent Home.

## 9. Navigation motion
Three kinds of navigation are now treated differently:

| Kind | Example | Behaviour |
|---|---|---|
| Local tabs and segmented filters | Coach profile tabs, Players / Parents | Switch in place. The highlight moves quickly (180 ms), the content has a brief fade with no slide, and scroll position and keyboard focus are kept. |
| Top-level area change | Home → Coaches, Sessions → Financials | A restrained fade of the main content (180 ms) |
| Drill-down | Coaches → Tom Reid → Jack Morgan, session → session date | No animation. Tab highlights on the new page appear in place instead of gliding from the previous page. |

- **The long sideways content slide on tab change is removed,** and the highlight no longer remembers positions across pages.
- **Reduced-motion settings turn all of this off.**

## 10. Kept, deeper
Every pass-12 screen and route still exists:
- session dates, registers, attendance and eligibility;
- cover requests, coach pay items, work summaries, documents, session roles and rate history;
- families, memberships, requests, bookings, parent claims, move players, charges and credits, prices and policies, and history;
- all invoices, drafts, payments, credit notes, client credits, parent money, clients, profit by session, finance settings, connected apps, and access and history;
- Needs Attention rules and exceptions.

## 11. Terms kept only in code
These stay in code, routes, data helpers and IDs, and do not appear on screen:
- **Occurrence and Allocation.**
- **Snapshots** (`rateProfile`, `priceSnapshot`).
- **Lifecycle,** and **Session Staff / Occurrence Staff** (`staff`, `covering`, `actualRole`).
- **Override fields** (`venueOverride`, `capacityOverride`, `poOverride`, `termsOverride`).
- **Attention internals:** `caseKey` and rule IDs. Rule IDs still show on the Needs Attention rules and case detail, for managers who want them.
- **Membership state values** (`Cancellation Pending`, `Ending Scheduled`). On screen these read "Cancellation requested", "Ending", and for parents "Your place ends on …".
- **Exported,** which reads "Sent for payment".

## 12. Still more complex than ideal
- **Deep Finance pages** (invoice detail, drafts, credit notes) are still detailed. They are one step under Money in.
- **Coach Work & Pay** is a long page: work, summaries, rates and the change-rate form.
- **The Needs Attention page** still offers accept or change-priority, with rule IDs in the detail. That is deliberate, but it is the most system-like page left.
- **No dedicated player-only view.** There is no player login or player hub in this prototype, so section 10 of the brief (Player experience) does not apply. Nothing was built for it, since this pass adds no capability.
- **Brand-new families and Book now.** The Parent hub still shows the example family after a brand-new family chooses Book now. New children have no age group yet, so they could not pass camp eligibility. The chosen camp and option do carry through.

## 13. User-journey results
Each journey was started from that role's home and done by clicking visible labels only. Every page on the way was checked for internal terms (occurrence, allocation, snapshot, lifecycle, override, Cancellation Pending, Ending Scheduled, "oldest first" and similar). **None appeared on any journey.**

**Management**

| Journey | Path | Clicks |
|---|---|---|
| Sessions happening today | Home | 0 |
| Change the coach (Friday's U13/14) | Sessions → U13/14 Development → Change coach | 3 |
| Find cover for an unavailable coach | Sessions → Arrange cover (or the session → Find cover) | 2 |
| Are Tom's documents valid? | Coaches → Tom Reid (Overview shows documents and the expired first aid) | 2 |
| What Tom worked last month | Coaches → Tom Reid → Work & Pay | 3 |
| Find a player | Players & Parents → type in search → Leo Grant | 2 |
| Parent cancellation request | Players & Parents → need action → Decide cancellation | 3 |
| See an overdue payment | Financials → Money in → NC-1011 | 3 |
| Create a recurring session | Sessions → Add session | 2 |
| What needs attention today | Home | 0 |
| Fix from Needs Attention and come back | Home → U12 Academy is not confirmed → Confirm session → back on Home, item cleared | 2 |

**Coach**

| Journey | Path | Clicks |
|---|---|---|
| Find my next session | Coach Home | 0 |
| Open the register | Start register | 1 |
| Mark myself unavailable | Availability | 1 |
| Request cover | Open session → I can't make this | 2 |
| Respond to a cover offer | Cover | 1 |
| Update an expiring document | Update Enhanced DBS (opens the upload) | 1 |
| Check my monthly work summary | Work summary | 1 |
| Find a player I'm allowed to see | Players → Isla Whitfield | 2 |

**Parent**

| Journey | Path | Clicks |
|---|---|---|
| When both children next play | Parent Home (next session and family schedule) | 0 |
| Something I need to action | Parent Home (current actions) | 0 |
| Check my next payment | Billing & Payments | 1 |
| Update my child's medical information | Child profile → Update details | 2 |
| Browse sessions | Browse sessions | 1 |
| Book a camp | Browse sessions → Choose | 2 |
| Pause or cancel a membership | Memberships → U9/10 Development | 2 |
| See recent feedback | Parent Home | 0 |

**Public**
- **Finding a session needs no registration.** Each session shows where, when and how much, plus its action.
- **Book now:** choose the action → create an account → confirm email → find your child → Continue → the camp's booking, with the chosen option preselected.
- **Free session, trial and waitlist:** choose → sign in or create an account → Finish your request → confirmation. The request reaches Management's Trial interest list.
- **Register interest:** needs no account; the form is already filled in for that programme.
