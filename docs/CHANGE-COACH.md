# Change coach: one flow everywhere

Every place that changes who coaches now opens one **Change coach** sheet. **Find cover** is still a separate journey for when you don't know who should coach. Underneath, both use the same staffing steps, so a date ends up in the same state whichever way it was filled. The visual style is unchanged.

## Where it starts (all open the same sheet)
| Starting point | Opens with |
|---|---|
| Dated session → Staff card → **Change** on a coach's row | That coach; This session only |
| Dated session → Staff card → **Add a coach** | Nobody (adding); This session only |
| "**Charlie Hughes can't coach**" banner → **Change coach** (next to Find cover) | That coach; This session only |
| "No coach yet" / "Learning Coach only" banner → **Add a coach** | Adding; This session only |
| "No Lead Coach" banner → **Choose a lead** | Lead role preselected |
| "**Tom Reid: first aid expired**" banner (new) → **Change coach** / **Check documents** | That coach; This session only |
| Needs attention: no coach, coach unavailable, no Lead Coach, Learning Coach only, coach with expired documents → the date's banner | As above. Saving returns you to Needs attention with "That item is cleared". |
| Weekly session page → Regular coaches → **Change** / **Add a coach** | From this date onwards |
| Edit session → Coaches (existing sessions): regular coaches are shown read-only, with **Change** and **Add a coach**. New sessions still choose coaches during setup. | From this date onwards |
| Coach profile → Sessions → **Change** (replaces Remove and Add temporary role) | That session; From this date onwards |

Earlier temporary role notes on a coach profile stay visible as **history only**. They were never converted into date changes.

## The sheet
1. **Who is changing?** One of the coaches on the date or session, or "Nobody: add a coach".
2. **Who should coach instead?** Options:
   - "Keep them, change their role";
   - "Nobody: remove them";
   - every coach, marked "free".

   Some coaches are blocked (shown greyed out with the reason):
   - inactive;
   - away or unavailable;
   - on holiday;
   - coaching an overlapping session;
   - a Learning Coach chosen as Lead Coach.

   Coaches with expired or missing documents can be chosen, but show a warning.
3. **What role should they have?** Lead Coach / Coach / Learning Coach. Lead is disabled for Learning Coaches.
4. **How long should this change apply?** This session only / Selected dates (ticks, plus a "from … to …" range) / From this date onwards ("Starting from"; earlier dates stay as they are).
5. **Why?** Required.
6. **Check before saving.** It updates as you choose:
   - session, who is replaced, who comes in, and the dates;
   - what stays as it is:
     - dates where the new coach is already on;
     - dates with their own arrangement, kept when changing from a date onwards;
     - past and confirmed dates;
   - anything replaced deliberately in a date-specific choice;
   - whether the regular coaches change;
   - the expected pay change (−old / +new, at their normal rate);
   - cover requests this resolves;
   - who is told;
   - warnings, for example "**This leaves no Lead Coach on 8 Oct**. You can still save; Needs attention will show it until it's fixed."

## Rules underneath
- **Roles are explicit:** Lead Coach, Coach, Learning Coach. A Learning Coach alone never satisfies Lead.
- **This session only and Selected dates** change only those dates. The regular coaches stay the same.
- **From this date onwards** changes the regular coaches from the start date:
  - The earlier period is kept in the session history ("Charlie Hughes was Coach until Wed 14 Oct").
  - Only future, unconfirmed dates update.
  - Dates with their own arrangement (cover, an extra coach, a role change for the day) are kept. They are listed under "Staying as they are".
- **Past, started and confirmed dates are never rewritten.** Confirmed delivery is still corrected only through Correct delivery.
- **Pay:**
  - Expected pay moves from the outgoing coach to the incoming coach on the affected dates.
  - The incoming coach is paid at their normal rate unless that date already has its own agreed rate.
  - The outgoing coach's one-off rate is not carried over.
  - The normal rate profile is never edited.
- **A removed coach** keeps read-only access to that session's players for 21 days, so they can finish feedback (shown under Former access).
- **Notifications:**
  - The outgoing coach gets "You're off …" and the incoming coach gets "You're on …".
  - Families aren't messaged by default; they see the change in the Hub.
- **Removing a coach without a replacement** is allowed. The summary shows a clear warning, and the date's banner and Needs attention keep showing the gap.
- **Every change records** who, when and why, on the date and on the session.

## One source of truth for staffing
Change coach and Find cover now share three steps in the data layer:

| Step | What it does | Used by |
|---|---|---|
| `staffTakeOff(date, coach)` | Takes a coach off a date, or marks them away when cover is coming in, and removes their expected pay for that date | Change coach, Confirm cover |
| `staffPlace(date, coach, role)` | Puts a coach on a date with a role, marks it as cover or a date-specific change, and adds expected pay at their normal rate or the agreed date rate | Change coach, Confirm cover |
| `closeCoverNeed(request, date)` | Marks that date's cover as filled. Closes every other offer for that date and tells those coaches ("filled by Management" or "covered by X"). Leaves other dates on the same request untouched. | Change coach, Confirm cover |

So when Management changes a coach directly on a date that has an open cover request, that date is resolved exactly as if cover had been confirmed, except that the record notes it was chosen by Management.

### Everything that reads staffing or cover, and what a direct change does to it
| Reader | Where | After a direct Change coach on that date |
|---|---|---|
| Cover still needed / unfilled | Cover page, cover request page (each date listed on its own) | That date shows "Covered"; with no replacement it shows "No longer needed". Other dates on the same request stay open. |
| Coach unavailable | Date banner "X can't coach", Needs attention | The away coach is taken off the date, so the banner and item clear |
| Accepted offers | Cover request page, management choice | Closed, and the coach is told it was filled by Management |
| Confirmed cover | Cover request page, date history | Records the chosen coach with "chosen by Management" |
| Needs attention cover items (cover requested, waiting for replies, coach accepted, still unfilled, late illness) | Home, Needs attention | Re-evaluated from the date. They clear when the date is staffed. |
| Staffing banners (no coach, can't coach, no Lead, Learning Coach only, expired documents) | Dated session page | Recalculated. "Ready to run" appears when nothing else is outstanding. Urgent banners always come first. |
| Coach-facing open cover offers | Coach Hub → Cover, notifications | The offer card changes to "This cover has been filled. David Cole is coaching it." The notification ends "No need to reply" if the coach hadn't replied, or "Thanks for replying" if they had. |
| Regular coaches | Session page, Edit session, coach profile Sessions | Unchanged unless the scope was From this date onwards |
| Expected coach cost | Finance forecast, session profitability | Updated for the affected future dates only |

## Checked
- Direct change on a date with an open cover request: the date is staffed, cover is resolved, the offers are closed and those coaches told, Needs attention clears, the banner shows "Ready to run", and the regular coaches are unchanged.
- Multi-date cover: changing one date leaves the other date's need open.
- Adding a Lead from a Needs attention "no coach" item returns you to Needs attention.
- From a date onwards: a date with its own arrangement is kept, the regular coaches change from the start date, the earlier period is in history, and former access lasts 21 days.
- Blocked choices: holiday, away, and a Learning Coach as Lead.
- An expired-documents item opens the date with Change coach and Check documents.
- Removing without replacement shows the warning, and No Lead Coach stays visible.
- The coach profile Change opens the sheet with From this date onwards.
- Regression:
  - all Management, Coach and Parent routes, on desktop and phone, in dark mode and in the Josh Evans brand: no overflow or errors;
  - all journeys and the 66-step scenario script;
  - the cover, venue, delivery and correction suites;
  - September figures unchanged.
