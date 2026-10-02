# Change venue: one action everywhere

This change uses one **Change venue** flow wherever a venue can be changed. The visual style is unchanged.

## Where it starts (all open the same sheet)
| Starting point | Opens with |
|---|---|
| Dated session → More actions → **Change venue** | This session only. Only offered before the date has started. |
| "No venue yet" banner on a date | This session only |
| "**Hollins Park School is closed on Fri 16 Oct**" banner (new), with **Change venue / Reschedule / Cancel session** | This session only |
| Needs attention: "Session has no venue" or "**Venue unavailable**" (new) → the date's banner | The same. Saving returns you to Needs attention, with "That item is cleared". |
| Venue page → a "Needs a decision" date → its banner | The same |
| Weekly session page → **Change venue** (new) | From this date onwards |
| Edit session → Venue & capacity: the current venue plus **Change venue** (existing sessions only; new sessions still choose a venue normally) | From this date onwards |

## The sheet
1. **Current venue.** For a date with its own venue: "For this date only. Usual venue: …".
2. **New venue.** Active venues only, with any closed on the date marked.
3. **How long should this change apply?**
   - **This session only:** changes that one date; the usual venue stays the same.
   - **Selected dates:** ticks for each upcoming date, plus a quick "Tick from … to …" range.
     - Dates that already have their own venue appear **unticked**, with "Currently Northgate Sports Centre for this date only."
     - Ticking one deliberately shows "**This will replace the existing venue change for Fri 9 Oct.**"
   - **From this date onwards:** "Starting from" one of the upcoming dates; earlier dates stay as they are.
4. **Why?** Required.
5. **Send a message to families.** Optional and off by default. Families always see the new venue in the Hub, and assigned coaches are told automatically.
6. **Check before saving.** It updates as you choose:
   - session, new venue, and dates (or "From Thu 15 Oct: N dates, and any added later");
   - anything replaced;
   - what stays as it is (dates with their own venue, past dates);
   - coaches unchanged, and who is told;
   - players and bookings unchanged;
   - the venue hire change (Finance access only);
   - a warning if the new venue is closed on a chosen date (saving is blocked);
   - a note if another session is already there at the same time.
7. **Save change.**

## Rules underneath
- **Dates that have started, ended, or been confirmed, cancelled, postponed or rescheduled are never changed**, and aren't offered.
- **This session only and Selected dates** change only those dates. Picking the usual venue for a date that has its own simply takes it back to the usual venue.
- **From this date onwards:**
  - changes the session's **usual venue from that date**, keeping the earlier usual venue in the session's history;
  - future dates from then use it; **dates with their own venue keep it**;
  - the session page shows any coming change ("Hollins Park School from Thu 15 Oct").
- **Coaches, cover, registers, players, bookings and pay are never touched** by a venue change. Only expected venue hire follows the venue.
- **Who, when and why** are recorded on each date's history, on the session's history (for a usual-venue change) and in the audit log.
- **Coaches** working the changed dates get a notification: "Venue changed: U8 Development · Thu 8 Oct now at Riverside Academy". The optional family message is recorded as a notice to that session's parents.
- **Needs attention:**
  - "**Venue unavailable**" (new, at least Warning; urgent within 72 hours) appears for a date whose venue is closed;
  - "Session has no venue" now opens the date rather than the weekly session;
  - both clear on their own once the date has an open venue.
- **Example data:** Hollins Park School is closed on Fri 16 Oct (school exams), so U13/14 Development has a live venue-closed issue to try.

## Session update fix (time, capacity, coaches)
Saving Edit session used to re-apply the regular coaches, time, venue and capacity to every future date. That silently wiped cover, temporary coach changes and other date-specific changes. Now:
- **Only what actually changed is applied:**
  - **Time:** only to dates still at the usual time; expected pay hours follow.
  - **Capacity:** only to dates without their own capacity.
  - **Regular coaches:** only to dates still exactly on the regular set-up. Expected pay is added or removed to match.
- **Dates with cover, an added or absent coach, or a different role on the day keep their arrangements.** The session history records how many dates kept their own time, venue, capacity or coaches.
- **Venue is no longer changed through Edit session** for existing sessions; it uses Change venue.
- **Past dates never change.**
- **Tested:**
  - a time change kept Jack's cover on Fri 2 Oct;
  - a coach change updated plain dates, with their expected pay, and kept the date with an extra coach;
  - a capacity change kept the date with its own capacity;
  - past dates were untouched.

## Checks
- **Change venue tested from all six starting points:**
  - normal date → This session only, coaches notified;
  - draft date with no venue → venue set, item cleared;
  - closed-venue date → Selected dates, with the replace warning shown when an own-venue date is ticked;
  - Needs attention → saved → back on Needs attention with "That item is cleared";
  - venue page → the date's banner → the same sheet;
  - weekly session page → From this date onwards, with the own-venue date kept and earlier dates unchanged.
- **Regression:**
  - every route is clean in light, dark and Josh Evans, desktop and phone;
  - all journeys and all 66 walkthrough steps pass;
  - figures are unchanged; Needs attention now has 33 items, the extra one being the new example closure.
