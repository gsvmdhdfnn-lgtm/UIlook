# Rule fixes and the session confirmation model

This is Phases 1 and 2 of `docs/DESIGN-AUDIT.md`, built to your decisions:
- Financials stays the fourth Home area.
- Management finalises work summaries; coaches can query them afterwards.
- Learning Coaches don't take registers; Coaches can edit IDPs.
- Back links stay contextual, with fixed parent pages only as a fallback.
- Wording is generic in everyday work; Stripe and Xero appear only in integrations and provider-specific actions and errors.

The principle throughout: **correct the business rules without making the UI heavier.** Every change reuses UIlook's existing pieces (situation banner, cards, tables, pills, sheets, folds). The visual style is unchanged.

## Phase 1: small rule fixes
| Fix | What changed |
|---|---|
| **Needs attention is urgent first** | One list across every category, ordered Urgent → Warning → To do. The category is a quiet label and a filter. The category "Players & Families" is now "Players & Parents". |
| **Session set-up questions** (Commercial PDF) | **How is this session funded?**<br>Parent bookable / School or client contract / Internal (not bookable).<br><br>**Who can book?**<br>Open booking / Management approval required / Invite only / Not parent bookable. Asked next to capacity.<br><br>**How is it charged?**<br>Monthly subscription / Term fee / Per session / One-off payment / Hourly client rate / Fixed client fee / No charge.<br><br>U12 Academy is now *Invite only*. School sessions are *Not parent bookable*. |
| **Role names in full** | "Lead Coach", "Coach", "Learning Coach" everywhere on screen. The stored values are unchanged. |
| **Role table** | Learning Coach: no register (the register page says the lead coach takes it, and the Start register buttons are hidden). Feedback writing is off for Learning Coaches. Coach: can edit IDPs. Both changes are recorded in the role history. |
| **Cover wording** | Coaches see **Accept cover** / **Can't do it**. The reason for "Can't do it" is optional. |
| **Area name** | "Sessions" is now **Schedule & Sessions** on Home, in the sidebar and in breadcrumbs. |
| **Needs attention first on Home** | On desktop, the urgent summary line now sits above the four area cards, as it already did on phone. |
| **Return reminder** | A task opened from a Needs attention item shows a quiet line: "Opened from Home. Once this is fixed you'll go straight back." |
| **Parent next payment** | Original, then credit, then final: "Next payment **£132.00** on 1 Nov: U8 Development £72.00 + U9/10 Development £87.00 = £159.00, less £27.00 family credit." |
| **Work summaries** | **Needs review** → Management reads it and **Finalise** opens a short confirm sheet setting out the consequences → **Finalised** (the coach is told, can see it, and can **Query something**) → **Queried** (back to Management) → **Reopen to correct** → Needs review. The coach's "Confirm" step is gone. Summaries waiting on Management appear in Needs attention. |
| **Generic wording** | "Card (Stripe)" → "Card". "Stripe payout" → "Card payout". "Card refund (Stripe)" → "Card refund". "Email PDF + Xero" → "Email PDF + accounting app". Parent money no longer names the provider. Xero stays in the invoice sync status, "Retry Xero", the "not sent to Xero" error and the integrations page. |
| **Back links** | Already contextual with a fixed fallback; checked and unchanged. |

## Phase 2: the session confirmation model
The old "Confirm session" meant "this is going ahead" before the session. It is replaced by the Blueprint's model: **confirm what actually happened, after it has run.**

### One status per date
| Status | When |
|---|---|
| Scheduled | Upcoming, nothing wrong |
| **Staffing issue** | Upcoming with no coach, a coach who can't make it, no Lead Coach, a Learning Coach only, or no venue. The reason shows next to the pill. |
| **Awaiting confirmation** | It has ended and nobody has confirmed it |
| **Confirmed** | Delivered as planned, or with changes recorded |
| **Partially delivered** | It ended early |
| Cancelled / Rescheduled | As before (Postponed kept as a variant) |

The status shows the same way everywhere: session dates and its filters (Needs action = staffing issue or awaiting confirmation), Today, Later this week, the calendar, Home's schedule, and Finance's session profit.

### The dated session page
- **Before it runs:** the readiness banner as before. "No Lead Coach" and "Learning Coach only" are new. The old pre-session "Confirm session" is gone.
- **After it ends:** "**Did this session go as planned?**", listing who was planned.
  - **Went as planned** is one tap.
  - **Something changed** opens one short sheet, "What actually happened?" ("Only record what changed"):
    - each planned coach: *Was there / Wasn't there* and *Role on the day*;
    - *Someone else coached* (folded): coach, role and who they covered for, or an extra coach;
    - *It ended early* (folded): end time, then *Pay for the time worked* or *Pay in full*, plus what happened;
    - links to *It was cancelled* or *It moved to another date*.
  - If a coach couldn't make it and no cover was confirmed, only **Record what happened** is offered.
- **Once confirmed:** a calm banner ("Delivered as planned", "Delivered, with changes" or "Partially delivered") listing what changed, with who confirmed it. The date can't be changed after that.
- **Staff for this Session** (was "Coaches for this date"):
  - before: Planned, Cover needed or Covering;
  - after: **Present**, **Absent** ("Jack covered") or covering.
  - **Change coaches** can now **add a coach** (so "Add a coach" on a session with no coach works), and no longer edits attendance.

### What confirmation does underneath
- Planned staff become **actual staff**: present, absent, covering or extra, with the role on the day.
- **Pay items follow delivery.**
  - Before confirmation they are *expected*.
  - On confirmation, present coaches' items become *actual* at the rate in force that day (the existing snapshot).
  - Absent coaches' expected items are removed.
  - Covering or extra coaches get an item.
  - Partial delivery pays for the time worked, unless "Pay in full" is chosen.
- **Finance actuals count confirmed delivery only.** "Actual only" excludes expected pay; "Including expected" adds it back. Money out shows "September coach cost (actual)" and how much is still expected, with a banner pointing to the sessions awaiting confirmation.
- **Work summaries** contain only confirmed work.
  - A summary still in *Needs review* picks newly confirmed work up straight away.
  - A *Finalised* one is never changed silently. It is flagged "missing confirmed work", with **Reopen summary**, and raised in Needs attention.
- **Needs attention:**
  - "Did U12 Academy go as planned?" (Review delivery) is Normal on the day, Warning after a day and Urgent after five days.
  - **No Lead Coach** (new rule ATT-003) covers upcoming dates.
  - The old "not confirmed" rule is replaced.
- **History:** every confirmation writes "Delivery confirmed: Charlie was absent; Jack covered for Charlie; Ended early at 20:00: Floodlights failed", with who and when.

### Example data
Two past dates are left awaiting confirmation so the flow can be tried:
- **U12 Academy, Thu 24 Sep** (David and Charlie).
- **U13/14 Development, Fri 25 Sep** (Marcus).

Every other past date is confirmed as delivered.

## Figures
- **Unchanged:** revenue (£2,309.23 net) and cash (£5,615.15).
- **September actual coach cost: £1,075.64.**
  - It was £1,153.77; the difference (£78.13) is the two sessions awaiting confirmation, which are now expected rather than actual.
  - "Including expected" still shows £1,153.77.
  - Profit is £150.59 actual.
- **Needs attention: 32 items** (was 28). The change:
  - +2 sessions awaiting confirmation, −1 old "not confirmed" item;
  - +4 work summaries waiting on Management (three to read, one query), −1 old "ready to finalise" item.

## Checks
- **Every route:** no errors and no sideways scrolling, in light, dark and Josh Evans, desktop and phone.
- **Journeys:** all pass. Two steps were updated for the new labels:
  - the fix-and-return journey is now "Did U13/14 Development go as planned?" → **Went as planned** → back on Home, item cleared;
  - the empty Friday session now says **Add a coach**.
- **Walkthroughs:** all 66 steps pass.

## Still to come (next phases)
- **Cover:**
  - send to everyone eligible;
  - choose between several acceptances;
  - tell the others the cover is filled;
  - flag coaches working just before or after.
- **Cancel:** coach and venue pay decisions in the cancel step.
- **Booking access for parents:** Academy offer → accept → pay.
- **Rate types:** camp, match and custom, plus the missing-rate exception.

## Locked rules check (before Cover)
**1. Postponed stays a distinct state.**
- A postponed date is stored as `Postponed` and displays as Postponed everywhere. Its banner says it was postponed, and **Set new date** is offered.
- It never turns into Awaiting confirmation when its date passes.
- The full set of dated states:
  - **stored:** Scheduled, Completed, Postponed, Cancelled, Rescheduled;
  - **derived:** Staffing issue, Awaiting confirmation, Confirmed, Partially delivered.

**2. Confirmed delivery is fixed against normal editing.**
- Once a date is confirmed:
  - **Something changed** and **Change coaches** are no longer offered.
  - A pay item's own **Confirm** button is removed: pay becomes actual only by confirming the session.
  - **Adjust pay** works only on expected pay; an actual pay item says "Fixed when the session was confirmed as delivered".
- Each confirmation keeps a snapshot of the confirmed staffing on the date (`delivery.staff`) and a frozen record on each pay item (`actual`). A later correction can keep the original in history.
- **Not built yet:** the deliberate **Correct confirmed delivery** action. It will:
  - require a reason;
  - keep the original confirmation in history and record who changed it and when;
  - recalculate actual staff and cost;
  - flag rather than rewrite a finalised work summary. Finalised pay is never changed silently.

**3. Actual cost uses the actual rate used.**
- Expected pay uses the coach's normal rate. A normal-rate change now updates expected pay from its effective date; it never touches actual pay.
- A rate set for one session (`rateSource: 'occurrence'`, with a reason) wins over the normal rate, and a normal-rate change leaves it alone.
- On confirmation each pay item freezes the actual coach, role, hours, rate used, rate source and final cost.
- Tested:
  - a backdated rate change after confirmation left the frozen cost unchanged;
  - an occurrence rate of £36/h was kept through confirmation.

## Correct confirmed delivery
A deliberate correction of a date's **delivery record**, not only cover. On a confirmed date, **Correct delivery** (people with Finance access) opens "Correct confirmed delivery":
- For each coach on the confirmed record: *Worked?*, *Role*, *Hours*, *Rate (£ an hour)*.
- *Someone else actually worked* (folded): coach, role, who they covered for, hours, rate (their normal rate if left blank).
- A **reason** is required.

What happens:
- **Original kept.** The original confirmation, with staff and pay, is kept in History as "Original confirmation", with who replaced it, when and why. The banner says "Corrected 1 Oct" with the reason.
- **Actual staffing updated.** Actual staff, role, hours and rate are replaced, and actual cost is recalculated. A changed rate is recorded as a rate for this date, with the reason.
- **Pay not yet sent** is corrected in place, and its earlier frozen record is kept (`actualHistory`). A coach who didn't work loses the item.
- **Pay already sent for payment or in a finalised summary** is never rewritten. The difference becomes a separate **adjustment pay item**, labelled "Correction: reason", and that coach's summary is flagged. Needs attention shows "…summary needs reopening: delivered work changed after it was finalised", with **Reopen summary**.
- **Summaries in review** pick the correction up straight away.

Tested:
- Tom covered, not Charlie: Charlie's pay was removed and Tom's added at £35/h; both summaries in review were updated.
- Jack's finalised hour became 1.5 hours: a +£15.63 adjustment was added and his summary flagged.
- A correction with no reason is refused.

## Cover
- **One cover need per date**, grouped by absence for convenience. Each date moves on its own.
- **Sent to everyone eligible by default.**
  - A new absence (Record time off, "I can't make this", time off with cover) goes to every eligible coach for each date, by Hub and email, in one step.
  - Otherwise **Send to all eligible (N)** / **Send to the rest (N)** is the main button.
  - "Ask … only" stays as the exception, inside the eligible list.
- **Eligibility.** Inactive coaches, coaches already on an overlapping session, unavailable coaches, Learning Coaches and coaches with expired or missing documents stay excluded. Also excluded now:
  - coaches who **already said yes to cover at the same time** elsewhere;
  - coaches who already said yes to this date.

  Coaches **working within 30 minutes before or after** are shown with a flag ("Working 17:30–18:30 just after"), not excluded.
- **Responses are per date. Saying yes doesn't assign anyone.** The coach sees **Accept cover / Can't do it** and "the office chooses who covers".
- **Management chooses.** Everyone who said yes is listed with their own **Choose**. The state reads "2 coaches said yes: choose who covers". The confirm sheet shows:
  - the normal rate, hours and expected cost;
  - the **agreed rate for this session** (a reason is needed if it differs from normal);
  - what happens next.
- **On confirm:**
  - the chosen coach joins **this date only** as cover; the **session's regular staff never change**;
  - the absent coach's expected pay is withdrawn;
  - the cover's pay carries the **agreed rate as this date's rate**, so a later normal-rate change leaves it alone, and it becomes actual at the same rate when delivery is confirmed;
  - **every other offer closes**: no reply becomes "told it's filled", a yes that wasn't chosen becomes "said yes, told it's filled";
  - **everyone is told**: the chosen coach ("Cover confirmed"), the others ("Cover filled") and the absent coach ("Josh is covering for you");
  - a late reply is refused.
- **Escalation:**
  - urgent within **24 hours**;
  - on the day, "**Cover still required today**", always urgent, with "Ring round" and "Mark for phone call";
  - Needs attention words each state: "Cover needed", "Jack said yes: confirm cover", "2 coaches said yes: choose who covers", "Cover still required today".
- **Notifications** no longer say "First to accept". A stale work-summary notice was also corrected.

Checks:
- Every route is clean in light, dark and Josh Evans, desktop and phone.
- All journeys and all 66 walkthrough steps pass.
- The seeded figures are unchanged.
