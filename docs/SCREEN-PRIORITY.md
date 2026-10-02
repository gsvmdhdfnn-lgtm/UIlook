# Screen priority: one screen, one obvious purpose

This pass reorders what each screen shows. It adds no new capability:

- The mock data model and business logic are unchanged.
- No routes, screens, actions, audit trails or history were removed.
- The visual system is unchanged.
- Only UIlook was changed. The real Josh Evans Hub was not touched.

**Rule.** Every working screen now answers, in this order:
1. What is happening?
2. Is anything required?
3. What is the next best action?
4. What do I need to know to decide?
5. Everything secondary.
6. History and detail, only when asked for.

**Checks:**
- **Every route:** no errors and no sideways scrolling, in light, dark and Josh Evans, on desktop and phone, for Management, Coach and Parent.
- **Journeys and walkthroughs:** all user journeys and all 66 walkthrough steps pass.
- **Figures:** September finance totals and the 28 Needs Attention items are unchanged.

First-screen captures for every screen below: `docs/screenshots/pass-12/priority/`.

## How it works
Two small building blocks in `js/kit.js` do most of the work.

**`K.situation`: the answer at the top of the screen.**
- It is one sentence saying what is going on, and at most one main button plus one other.
- Its colour follows the state:

  | State | Colour |
  |---|---|
  | Something is blocking | Red |
  | Needs doing soon | Amber |
  | Waiting, no action needed | Blue |
  | All fine | Calm green |

- When nothing needs doing it says so plainly ("All covered", "All documents current", "You're all paid up") instead of showing an empty list.

**`K.details`: the "show me more" fold.** History, reference IDs, terms, contact details and full tables sit in closed folds such as "History", "Details", "All requests" or "Every cash movement".
- A fold stays open after a save or a filter change, so you don't lose your place.
- Nothing inside a fold was deleted. It is one click away.

**State to action.** A state never appears on its own any more. It comes with what it means and what to do:

| Was | Now |
|---|---|
| 3 offers sent | **Waiting for replies.** No action needed yet. |
| 2 still to sort | **2 sessions need you** [Open the first] |
| Pending verification | **New First aid uploaded.** Check the original document before approving. [Approve] [Reject] |
| Cancellation Pending (Management) | **Parent requested cancellation** [Review request] [Keep active] |
| Cancellation requested (Parent) | **Your cancellation request is being reviewed.** No action needed. If it is confirmed, the last day will be 31 Oct. |
| Register still open: U12 Academy · Overdue | **Register still needed for U12 Academy** · Open register |
| Cover offered: U13/14 · Reply | **You've been offered cover** · View offer |
| Update Enhanced DBS · Expiring | **Enhanced DBS expires in 12 days** · Update document |
| Feedback returned · Returned | **Feedback for Theo Patel needs changes** · Edit feedback |
| Overdue (invoice pill) | **Payment overdue by 5 days** [Record payment] [Send reminder] |
| Invite sent | **Invite not accepted yet** [Resend invite] [Mark verified] |
| 2 requests with the office | **Your pause request is being reviewed** · No action needed |

## Screen by screen

### Management
| Screen | Its one question | At the top now | Moved lower or folded |
|---|---|---|---|
| Cover (landing) | Which sessions still need a coach? | "All covered", "N sessions need you" [Open the first], or "Waiting for replies" | All cover requests (fold) |
| Cover request | Danny can't coach: what now? | State per date: Cover still needed / Waiting for replies / Coach said yes [Confirm Jack] / No one has said yes [Mark for phone call] / Covered (calm). Then **Best options** (top 3, with [Ask …]) and **Already asked** | More coaches, unsuitable coaches with reasons, Details (costs, offer stamps, phone note), History (why, recorded by, reference, timeline) |
| Session date | Is this session ready to run? | One banner: No coach yet [Find cover][Choose a coach] · {Coach} can't coach [Find cover][Change coach] · No venue yet [Change venue][Reschedule] · Not confirmed yet [Confirm session] · Register still needed · Ready to run. Any further issues are listed directly under it with their own button. | Header now only Open register and More actions; status pills and repeated date removed; History (fold) |
| Coach profile | Is this coach okay, and is anything needed? | "First aid expired: Tom should not be staffed until it is replaced" [Check the new first aid]; or new upload [Review document]; or unavailable today; or expiring; or "Tom is all set" | Profile and contact (fold); the code dropped from the eyebrow |
| Documents | Which documents need me? | "3 documents need you" with what each means [Review document], or "All documents current" | All documents on file and Required documents (folds) |
| Document | Approve this upload? | "New First aid uploaded. Check the original…" [Approve][Reject] in the banner, not the header | History (fold) |
| Player profile | Is this player okay to play? | "Medical details not confirmed" [Send reminder][Record phone confirmation]; or "No photo answer yet"; or "Leo is all set" | Address and emergency contacts (restricted, fold) |
| Parent profile | Does this family need anything? | Invite not accepted [Resend invite][Mark verified] · Parent requested cancellation [Review request] · £X to pay · or "Nothing needs you for this family" | Contact and link, All requests, Bookings, Terms accepted, History (folds); only *open* requests stay visible |
| Membership | What's the state of this place? | Parent requested cancellation [Review request][Keep active] · Paused until … [Resume now] · Ends on … · Ended · Active | Price and billing terms, History (folds) |
| Requests | What's waiting for a decision? | "6 requests waiting for a decision" [Review the oldest], or "No requests waiting" | — The request sheet now opens with what the family asked for |

### Financials
Each screen has one purpose and answers it in one sentence.

| Screen | Its one question | Answer at the top |
|---|---|---|
| Overview | Are we financially okay, and what needs attention? | "£1,296.00 overdue · chase NC-1011. Otherwise on track: profit £72.46. Cash stays above the £4,000 safety level; lowest £5,615.15 on 1 Oct." [Open NC-1011] |
| Money in | What should have come in, has it, and what needs chasing? | "£1,296.00 overdue · chase NC-1011. Harbour Lane School is 5 days late. 1 invoice still to issue." [Open NC-1011][Issue invoices] |
| Money out | What are we paying, and is anything wrong? | "£1,153.77 to pay coaches on 7 Oct. 41 pay items, all confirmed and matching the work summaries." [Prepare payment run]. A warning appears instead if any pay item is unconfirmed. |
| Cash flow | Do we have enough cash, and when is the low point? | "Enough cash for the next 30 days. Lowest £5,615.15 on 1 Oct." The chart comes next, then the figures. Every movement is folded. |
| Month report | How did the month perform? | "September made £72.46 profit. 32% kept before overheads. Strongest: TDC." |
| Invoice | What's the state of this invoice? | "Payment overdue by 5 days" [Record payment][Send reminder], "£X due on …", "Paid in full" or "Credited in full". Record payment moved from the header into the banner. Sessions left off and History are folded. |

### Coach Hub
- **Home.** The order is unchanged: next session, then Needs you. Needs you now reads as actions:
  - "Register still needed for …" · Open register;
  - "You've been offered cover" · View offer;
  - "Enhanced DBS expires in 12 days" · Update document;
  - "Feedback for … needs changes" · Edit feedback;
  - "Finish feedback for …";
  - "Check your September summary".

  A new document that is only *being checked* no longer appears in Needs you, because it needs nothing from the coach.
- **Cover.** Shows one of three answers:
  - "You've been offered cover" (accept or decline below);
  - "The office is finding cover. No action needed";
  - "Nothing needs you".

  Request history is folded, and the reference code is gone.
- **Documents.** Opens with "All documents current", "{Document} expires in N days" [Update document], or "The office is checking your new …" (no action). "Pending verification" now reads "Being checked". The upload history is folded.
- **Work summary.** Opens with "Check your September summary" [Confirm][Query], "Your query is with the office", "Confirmed · £281.27" or "Finalised for payment". History is folded.

### Parent Hub
- **Home.** The locked order is unchanged:
  1. Family and child context.
  2. Next session.
  3. Current actions.
  4. Billing & Payments, Memberships, Child profile and Browse sessions.
  5. Family schedule.
  6. Recent feedback.

  Open requests now show as outcomes, for example "Your cancellation request is being reviewed (Isla)" with "No action needed". They open the membership the request is about.
- **Membership.** "Your cancellation request is being reviewed. No action needed. If it is confirmed, the last day will be …"
- **Billing.** Opens with "You're all paid up. Next payment £159.00 on 1 Nov. £27.00 family credit comes off it automatically." If money is owed, it says how much, with [View payment].
- **Requests.** Opens with what is being reviewed.
  - Each open request says it in one sentence; the internal "Stage" is no longer shown to parents.
  - "Your requests" now comes before "Start a request".

### Public
These were audited and not changed. The cards already lead with who it is for, the day and time, the venue, the price and availability, plus one action decided by the booking model (from the language pass). Offer detail keeps the same order.

### Audited, left as they are
| Screen | Why it was left |
|---|---|
| Management Home and Needs Attention | Already the single "what needs me" list |
| Sessions landing | Needs you, Today, Later this week |
| Registers | Already task-first |
| Availability | — |
| Work & Pay | — |
| Players & Parents landing | — |
| Coach session and register | Already session-first |
| Parent sessions, session detail, child profile, browse and book, development | — |

Two small wording fixes came out of these audits:
- The coaches table on a session date now says "Role on the day" (it said "Actual role").
- Duplicate buttons were removed: Change coach appeared three times, Confirm on the work summary twice.

## Moved lower, and folded
- **Moved lower:**
  - payment runs;
  - cash events (now under the chart and figures);
  - "Start a request" (parents);
  - address and emergency contacts;
  - contact and link details;
  - price and billing terms.
- **Folded (closed by default):**
  - every History;
  - Details on cover;
  - All cover requests;
  - More coaches;
  - All documents on file;
  - Required documents;
  - Profile and contact;
  - All requests, Bookings and Terms accepted on the parent page;
  - Sessions left off an invoice;
  - Every cash movement;
  - coach work summary history;
  - coach upload history.
- **Removed from the top only:**
  - reference IDs in eyebrows;
  - status pills that repeated the banner;
  - header buttons that repeated the banner's main action.

## Still dense
- **Coach Work & Pay** still holds work done, monthly summaries, rates and the change-rate form on one tab.
- **The Needs Attention page** still shows priority controls and rule IDs. That is deliberate, but it is the most system-like page.
- **Deep Finance pages** (drafts, credit notes, client credits) are unchanged and still read like accounting software.
- **Some "Also needs you" items overlap the banner.** On the coach profile, "Tom is assigned but their first aid has expired" sits below "First aid expired". They are different actions (fix the sessions as well as the document), so both stay.

## Five-second test
For each screen, only the first screen (no scrolling) was captured at desktop 1440 × 900 and phone 390 × 844. The question was: "Can I tell what is going on, and what to do, without scrolling or reading a table?"

| Screen | Read in five seconds | Result |
|---|---|---|
| Cover request | Charlie can't coach · No one has said yes yet · Ask Jack | Pass |
| Session date | Charlie can't coach · Find cover; also Not confirmed · Confirm session | Pass |
| Coach profile | First aid expired, not to be staffed · Check the new first aid | Pass |
| Documents / Document | 3 need you / New first aid uploaded · Approve | Pass |
| Player / Parent / Membership | Medical not confirmed · Send reminder / Invite not accepted · Resend / Parent requested cancellation · Review request | Pass |
| Requests | 6 waiting · Review the oldest | Pass |
| Finance Overview / Money in / Money out / Cash flow / Month report / Invoice | One-line answer with a number and a date | Pass |
| Coach Home / Cover / Documents / Work summary | Next session, then actions / Offered cover / All current / Confirmed | Pass |
| Parent Home / Billing / Requests / Membership | Next session, then outcomes / All paid up / Being reviewed / Being reviewed, last day 31 Oct | Pass |
| Management Home | Four areas and Needs attention | Pass. No banner, by design: it is the overview. |

## No capability removed
- **Every action is still reachable, usually closer than before:**
  - Confirm session;
  - Change coach and Choose a coach;
  - Find cover;
  - Ask, Confirm and Mark for phone call on cover;
  - Approve and Reject on documents;
  - Resend invite and Mark verified;
  - Approve cancellation and Keep active;
  - Record payment and Send reminder;
  - Prepare payment run;
  - Confirm and Query on the work summary;
  - Update document;
  - Withdraw request.
- **No business rule, permission, data key or figure changed.** The banners only read the existing mock data.
- **The test scripts were updated only where the visible label changed:**
  - "Update Enhanced DBS" became "Enhanced DBS expires in 12 days";
  - "Change coach" became "Choose a coach" on the session that has no coach.
