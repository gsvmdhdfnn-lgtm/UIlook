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
