# Language and customer-journey audit (visual pass 12)

This audit makes two kinds of change. First, it reworded screen text that showed the data model instead of the business. Second, it changed the public site so visitors choose a session before they sign in. Nothing else changed: the data model, permissions, booking rules, finance logic and existing flows are all as they were. Finance figures, attention cases and every route were checked before and after.

## The test
For each term on a screen, I asked one question: **"Could a new member of staff understand this label without being taught the data model?"**

- **Replaced:** only where a plain business word means the same thing.
- **Kept:** terms that are normal business language (credit note, membership, compliance, eligibility), even if they sound formal.
- **Code untouched:** routes, data keys and helper names keep their precise names. For example `mgmt-occurrences`, `mgmt-allocations`, `o.venueOverride`, `a.state === 'Exported'`.

## How the evidence was gathered
1. **Scan what users see.** Every route was rendered for Management, Coach, Parent and Public. The visible text was scanned for model terms, and each hit was recorded with its context.
2. **Rewrite safely.** Changes were applied only inside screen text, never to identifiers, object keys, routes or values the code compares. One stored state, `Exported`, keeps its value and gets a display label through `K.stateLabel` in `js/kit.js`.
3. **Re-check.** The scan was run again, then every route was checked in both brands, light and dark, desktop and phone. The five walkthroughs and the finance totals were checked too.

## What changed

| Was | Now | Where | Why |
|---|---|---|---|
| Occurrence / occurrences | **Session** (a dated session), or **session date(s)** where it must be told apart from the weekly session | Everywhere on screen. The list page is **Session dates**. | Staff say "Thursday's U8 session", not "occurrence". "Session" alone would blur the weekly session and one date, so lists and counts say "dates". |
| Allocation(s) | **Pay item(s)**. The page is **Coach pay**; the coach profile tab is **Pay**. | Coaches, Finance, work summaries | An allocation is one coach's pay for one session. "Pay item" says that. |
| Exported (pay state) | **Sent for payment** (display only; the stored state is unchanged) | Coach pay, money out, work summaries | "Exported" describes a system step; "sent for payment" describes what happened. |
| Snapshot (price, rate, refund policy, issuer) | **Price agreed**, **Rate at the time**, **Refund policy when booked**, **Your details as issued**, **Line (as issued)** | Memberships, bookings, coach pay, invoices, finance settings | "Snapshot" is a storage idea. The wording now says what was kept and when. |
| Override: venue and capacity | **Different venue**, **Different capacity** (for this date) | Session dates | Plain description of the change. |
| Override: eligibility | **Player exceptions** / **Add exception** | Eligibility, session detail | Allowing one player outside the rules is an exception. |
| Override: billing | **Billing exceptions for single sessions**, **Change** | Finance → client | Same meaning, business wording. |
| Override: PO | **Reason for no PO** / **No PO: …** | Drafts and invoices | Says what the reason is for. |
| Override: payment terms | **Client-specific** payment terms | Finance → clients and invoices | Says where the terms come from. |
| Override: pay | **Adjusted pay** / **Adjusted** | Coach pay, work summaries, history | It is a pay adjustment with a reason. |
| Severity, base severity, severity override, locked minimum | **Priority**, **Standard priority**, **Change priority**, **Lowest allowed** | Needs Attention and its rules | The levels (Urgent, Warning, To do) are priorities. |
| Lifecycle | **Status** (services: **active periods**) | Sessions, memberships, client services | Same meaning. |
| Ledger | **Session profit** | Finance navigation and page | The page shows revenue and costs for each session, not a ledger. |
| Contribution | **Before overheads** (profit before overheads) | Finance overview, reports, session profit | Same figure, plain name. |
| Receivable(s) / Receivables ageing | **Owed to us** / **Money owed, by age** | Finance | Same meaning. |
| Reconciliation / reconciles | **Check of work done** / **Matches Finance** | Work summaries, coach pay | Same meaning. |
| Player migration | **Move players onto sessions** | Players, approvals, More | Describes the task. |
| Schedule pattern / generated from the weekly pattern | **Repeats** / **Added from the weekly timetable** | Session detail, history | Plain wording. |
| Parent hub "Paid · frozen" / "Issued · frozen" | **Paid** / **Issued**, with the lock icon kept | Parent billing, credits, bookings | Management keeps the brief's "Issued · frozen". Parents only need to know it is final. |
| Internal references (CVR-02, CHG-2001) | Removed from Coach and Parent screens | Coach availability, parent payment detail | Staff and families never use these codes. Management screens keep the stable IDs the brief asked for. |

## What was kept, and why
- **Eligibility, compliance, membership, credit note, work summary, headcount, safety threshold.** These are ordinary business words in this field.
- **Integrations and "Synced".** Normal wording for connected accounting and payment apps.
- **"Issued · frozen" on Management finance screens.** The brief asked for it explicitly; it tells finance staff the item can't be edited.
- **Draft / Confirmed / Active / Paused / Cancellation Pending / Ending Scheduled.** These are statuses staff already use.
- **Stable IDs on Management screens** (INV-, MEM-, BKG-, CVR-). Staff use them to find things, as the brief asked.

## Public journey: browse first, then sign in
- **Browsing never needs an account.** The home page, What we offer and each programme page list every session with its day, time, venue and price.
- **Each session shows one action, from how it is taken up.** The rule is in `js/data/public.js`; booking rules themselves are unchanged.

  | Booking model | Action | Example |
  |---|---|---|
  | Pay online (camps, events, tours) | **Book now** | Half-term camp, Christmas festival, Easter tour |
  | Free first session | **Book free session** | Trials for each weekly group |
  | Weekly group joined through a trial | **Request a trial** | U8 Development, U12 Academy |
  | Full | **Join waitlist** | Goalkeeper academy (new public example). Any group or product that fills up switches to this automatically. |
  | Arranged by the office | **Register interest** | One-to-one coaching |
  | Booked by the school | No action; shows "Booked through your school" | Northgate After-School |

- **Sign-in comes after the choice.** Choosing an action keeps the selection: programme, session, time, venue, price and action. A card showing it stays at the top of each step:
  1. **Sign in** says "Sign in to continue".
  2. **Create an account** defaults to a parent account.
  3. **Check your email** ends its steps with the chosen action.
  4. **Find your child** finishes with "Continue: <action>".

  The visitor can change or remove the selection at any step.
- **Where it ends.**
  - **Book now** goes to the Parent hub booking for that product.
  - **Book free session, Request a trial and Join waitlist** go to **Finish your request** (`pub-request`). There the parent picks the child, a date where relevant and a note. The request reaches Management in Trial interest, showing what was asked for and the date chosen.
  - **Register interest** needs no account. It opens the interest form already filled in for that programme.
- **Edge cases.**
  - If the child match needs review, requests can still be sent. Booking waits until the office confirms the link, and the selection is kept.
  - Coaches and Management who sign in with a selection are told bookings are made from a parent account. The selection is kept.

## Prototype limits
- **The Parent hub always shows the example family** (Sarah Whitfield). A brand-new parent who chooses Book now therefore reaches the booking screen with the example children.
- **The public header still shows Sign in and Register after a demo sign-in**, because the prototype has no real session.
