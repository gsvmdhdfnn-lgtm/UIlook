# Needs Attention: run the business from one list, without training

Every card answers three things straight away: **what is wrong**, **why it matters**, and **what to do**. The one action opens the exact task. The visual style is unchanged.

```
[Urgent]  U12 Academy · Today, 19:00 · Northgate Sports Centre
          No one can cover U12 Academy yet                         ← what
          Charlie can't coach and everyone asked has said no.
          Without cover the session can't run as planned.          ← why it matters
          Starts in 4 h 50 m                                       ← when
                                              [ Find someone → ]   ← the exact task
```

## One engine, grouped only when shown
- **One engine** (`js/data/attention.js`) computes every issue from live data. It feeds:
  - Needs Attention, the only task list;
  - the counts on Home, the area summaries, the sidebar and the Home badge (see `NEEDS-ATTENTION-INBOX.md`);
  - the quiet issue lists on a date, coach, player or family page;
  - **the dated session's banners** (`db.dateIssues`).
- Because they all read the same issues and the same exceptions, they can't disagree.
- **Each problem is still its own issue,** with its own rule, state, history and resolution.
- **Grouping happens only on screen.** A date or a coach becomes one card: the most important problem leads, and the others appear as "also" lines, each with its own action.
  - For example, Tom's expired first aid, his new upload and the dates he's on are one card, led by **Check the upload**.
  - A confirmed date and its unfinished register are one date card, kept as two issues underneath.

## Urgency means something is about to go wrong

| Level | When |
|---|---|
| **Urgent** | A session within 24 hours (or today) isn't ready: no coach, coach away, no Lead, a Learning Coach only, no venue, venue closed (72 h), cover unfilled. A coach without valid documents is on a session within 24 h. Medical details aren't confirmed for a player training within 24 h. A real deadline is within 2 days, for example the coach payment run (unconfirmed sessions and work summaries). Invoices more than 30 days overdue. |
| **Warning** | The same problems within 7 days. An unconfirmed session or unfinished register after a day. Work summaries within a week of the payment run. Expired or missing documents. |
| **To do** | Everything else. |

- Within a level, the soonest comes first.
- **Unconfirmed delivery** is a Warning after a day, and Urgent only when the payment run is within 2 days.

## Waiting on others
Dates where Management has done its part are folded into **Waiting on others**, for example cover offered with replies still due. They aren't counted as work.

They move back into the queue on their own when Management is needed: someone can cover, no one can, or it's within 24 hours.

## When a session starts
Before-the-session problems stop being tasks once the session starts. The date then has its after-the-session issues: **Did it go as planned?** and **Register to finish**. These are separate underneath, and shown on one date card.

The confirmation item notes anything that was wrong beforehand, such as "Before it started: Charlie couldn't make it and no cover was confirmed".

## Draft sessions
A draft gets one **Finish setting up …** item, from 14 days before its first planned date. It says what's still missing and opens the session setup. Draft dates get no date-level alerts, and their date page says "This session is still a draft".

## Approvals are in the list
- **Coach sign-ups** and **parent claims** are Needs Attention items.
- **Session requests** appear while the feature is switched on. When it's off they're kept but can't be decided yet, so they aren't counted as work.
- Home's separate "Approvals waiting" card is gone, so there is one list of decisions.

## New rules
- **Coach has no pay rate for a date they're on** opens the coach's Work & Pay tab.
- **A live session missing how it's charged** opens the session setup.

Venue cost confirmation is left for Finance, and unread messages for Communications.

## Exact tasks
Every action opens the place where the problem is fixed:

| Item | Opens |
|---|---|
| Cover | That date's cover page |
| Staffing, venue | The date, with the matching banner and action |
| Missing document | The coach's **Documents** tab, with the record form |
| Upload to check | The document (Verify or Reject) |
| Coach sign-up, parent claim | That one first in its list |
| Session request | That request, opened |
| Draft or charging setup | The session setup |
| Medical (one per player, timed by their next session) | The player, with Send reminder and Record phone confirmation |

## Leave as it is (deliberate exceptions)
**Leave as it is** replaces "Accept". The person saving approves it, and it records:
- a reason;
- a scope: this date only, until a date, or until something changes;
- who and when.

How it behaves:
- It leaves the queue and is listed under **Left as it is**, with a Reopen button.
- **It stays visible where it applies.** The date's banner shows "Left as it is: … · For Thu 15 Oct only · Agreed by David Cole".
- **It reopens on its own when a material fact changes** (for example, a coach is added or removed on that date) or when its time limit passes. The card then says why it came back.

**Run without cover** is one of these exceptions. It needs a reason, applies to that date only, and is recorded with who and when. It no longer makes the "can't coach" item loop back.

## Return to where you were
- Opening an item remembers the list, filters and scroll position.
- **Fixes that take two steps** keep the way back. For example, "Marcus can't coach" → Find cover → "Cover still needed" → Choose: the return follows the item to its next step.
- When the issue is cleared, you go back to the same list at the same place, with "That item is cleared".
- Going back yourself, or leaving for Home or another area, ends the return, so there are no surprise redirects later.

## Phones
- **Header:** the long description is hidden; Rules sits in the header and the priority and area filters stay compact.
- **Each card** reads issue → why → full-width action.

## Checked
- **`natest.js` (22 checks):**
  - grouping keeps separate issues;
  - started sessions drop pre-session items;
  - the draft item;
  - medical once per player;
  - deadline-based urgency;
  - urgent first;
  - waiting not counted, and coming back when someone can cover;
  - approvals in the queue;
  - every issue has why, action and route;
  - exact routes (Documents tab, request opened);
  - the Find cover chain and return with scroll position;
  - Run without cover recorded, shown on the date, and reopening on a change;
  - Leave as it is with scope;
  - the date banner agreeing;
  - stale returns ending;
  - Home's single list and matching counts.
- **Regression:**
  - every Management, Coach and Parent screen, on desktop and phone, in dark mode and in the Josh Evans brand: no errors or overflow;
  - all journeys;
  - the 66-step scenario script;
  - the cover, Change coach, venue, delivery and correction suites.
- **Figures:** unchanged. The queue shows 27 cards and 2 waiting, where before it showed 33 separate items.
