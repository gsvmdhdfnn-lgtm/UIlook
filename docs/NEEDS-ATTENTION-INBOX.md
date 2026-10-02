# Needs Attention as the inbox: one task list, summaries everywhere else

If Management needs to do something, it is in **Needs Attention**. Every other Management surface either summarises how much work there is or, on the affected page itself, shows the issue once. This builds on the calm hierarchy pass (16249e3): the same severities and tones, but tasks are listed in only one place.

## Who owns what

| Surface | Shows | Never shows |
|---|---|---|
| **Needs Attention** | Every task, worked through like a checklist | — |
| **Home** | One Needs Attention bar with counts and **Review**. Area cards say how much work each area has, and of what kind. | Task rows, task links, "Approvals waiting", status pills on Today/Tomorrow |
| **Area landings** | One summary line with **View in Needs Attention** | Mini task lists |
| **Pages for one thing** (date, coach, player, family) | The issue once: the most important one as the banner (Urgent ones always as banners), the rest in one quiet list | A second "Also needs you" box, tab dots, "Ready to run", "… is all set" |
| **Sidebar and Home badge** | A navigation counter | A list |

## Home
```
Needs attention   ● 2 urgent · 11 warnings · 14 to do                 Review →
Needs attention   11 warnings · 14 to do                              Review →   (calm: nothing urgent)
Needs attention   You're up to date ✓                                 Review →   (nothing active)
```
- **Waiting on others is never counted** here.
- **Area cards:** "1 urgent · 6 other" (red only when something is urgent) or "8 need attention", plus up to three topics, such as "Cover · Confirmation · Register".
- **Today and Tomorrow are facts only:** time, session, venue and coaches, with a coach who can't make it struck through. The register pill appears only once a session has started.

## Needs Attention
```
27 things need you
2 urgent · 11 warnings · 14 to do
[All 27] [Urgent 2] [Warning 11] [To do 14] [Waiting 2]     [Every area ▾]
```
- **Priority and area are separate.** The tabs filter by priority, and the menu filters by area (Schedule & Sessions, Coaches, Players & Parents, Financials) or by topic.
  - Every rule belongs to exactly one area and topic, set in one map in the engine (`OWN` in `js/data/attention.js`).
  - Development (feedback and development plans) belongs to Players & Parents.
- **Each card reads problem → where → why → action:**
```
[Urgent] Cover
No one can cover U12 Academy yet                         ← problem
U12 Academy · Today, 19:00 · Northgate Sports Centre     ← where
Charlie can't coach and everyone asked has said no.      ← why
Starts in 4 h 50 m                       [ Find someone → ]
```
- **Waiting on others** sits folded at the bottom of All (and has its own tab). It isn't counted.
- **"N left as it is ›"** is a quiet link at the bottom. It opens the decisions, each with **Reopen**.

## Working through it like a checklist
1. Press a task's action. It opens the exact place to fix it.
2. Fix it. The Hub saves, re-checks and, once the issue has cleared, takes you back to the same place in the list.
3. A quiet confirmation says what was done and what's left, for example "✓ Cover assigned · 26 things still need you". The header count goes down, and the next task's button is focused.

Two-step fixes, such as "can't coach" leading to "finding cover", still follow the item to its next step before returning.

## One engine
- `db.getAttentionSummary(area)` gives the active (not waiting) cards, counts and topics, for one area or all of them. Home, the area landings, the sidebar and the badge all read it.
- **Pages for one thing** read the same cases (`K.needsRows`), so they always agree with the queue.
- **No surface works out severity for itself.**

## Fixed along the way
- **Cover timing used a clock that moved on every screen refresh**, so after enough clicks a cover still waiting for replies (Fri 2 Oct) could jump from Waiting into the queue.
  - Timing now reads the prototype's fixed "now" (`K.clock`).
  - `K.now()` is only used to stamp changes.
- **The Josh Evans "Home" badge always showed the urgent count, even 0.** It is now the same counter as the sidebar:
  - red with the urgent count;
  - otherwise a quiet total;
  - nothing when you're up to date.

## Checked
- **`inbox.js`, in seven states** (zero active, one to-do, several warnings, one urgent plus warnings, multiple urgents, waiting-only, the mixed live data). Per state:
  - Home has no task rows or links;
  - the bar, sidebar and badge show the right counts;
  - waiting items are never counted;
  - the four area totals add up to the queue;
  - the queue's title, filters, Waiting tab and the folded waiting section are correct.
- **`inbox.js`, other checks:**
  - each area landing has one summary line and no task list, and its button opens the queue filtered to that area;
  - date, coach and player pages have at most one quiet list, no tab dots and no "Ready to run" or "all set";
  - healthy dates show nothing extra;
  - **checklist run:** three tasks in a row, each returning to the queue with the count down by one, the confirmation toast, the header updated and the next task focused.
  - Run in Relvor and Josh Evans, desktop and phone, light and dark: 117–124 checks each, all passing.
- **Regression:**
  - the calm-hierarchy matrix in three variants (updated for counts-only Home);
  - Needs Attention, session, cover, cover UI, Change coach, venue, delivery and correction suites;
  - all journeys (now via **View in Needs Attention**);
  - the 66-step scenario script;
  - every Management, Coach and Parent screen, desktop and phone, light and dark, in both brands: no errors or overflow.
- **Figures:** unchanged (27 to work through, 2 waiting).
