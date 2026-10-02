# Session page: one schedule, one set of dates, plain wording

## What was wrong
The U11 Saturday Development page described the same session in conflicting ways:
- "No venue yet" next to "Northgate Sports Centre from Sat 10 Oct";
- "Default day: 3 dates" next to "All 2 dates";
- weekly-style rows ("Repeats", start and end date) on a selected-dates session.

There were two causes:
1. **Editing a session never added or removed its dates.** Adding 24 Oct in Edit session changed the session's date list and end date, but no date was created. The same was true for weekly sessions: changing Thursdays to Mondays left the Thursday dates in place, even after the new end date.
2. **The venue was worked out for today (1 Oct), not for the session's dates.** A venue set "from 10 Oct" applied to every date the session has, but read as "No venue yet" because 10 Oct is after today.

Draft status was not the cause (see the foundation note below).

## One source of truth
The session's schedule decides which dates exist:
- **Selected dates:** exactly those dates.
- **Weekly:** its weekdays from the start date to the end date. Dates are created up to the same rolling horizon used when the timetable was first generated (23 Oct in the mock data), and breaks are skipped.

Saving Edit session brings the dates in line (`db.planSessionDates`, `db.updateSession`).

**Added dates**
- They are created straight away with the usual time, venue, coaches and places for that date.
- A live session's new dates get expected coach pay.

**Dates no longer in the schedule**
- **Draft session:** they are removed, since nobody can have booked them.
- **Live session:** they are removed only if nothing depends on them. A date with players booked, a client session's date, or a date with its own arrangements is **never removed or cancelled by Edit session**.
  - The review step names the date and links to it: "Sat 24 Oct can't be removed here. It's no longer in the schedule, but 7 players are booked. Cancel or reschedule it from the date first, so families are told and refunds are decided."
  - **Save refuses** and stays on the review until that's done.

**Never changed**
- Past, started and confirmed dates.
- Replacement dates for rescheduled sessions.

**Kept**
- Dates with their own arrangements keep them: their own venue, time, places, coaches, or cover being arranged.

**Review step**
- It shows exactly what saving will do: **Added** and **Removed** dates, or "No dates are added or removed".
- The session history records both.

## Wording on the Session page

**Details:** "Default day", "Default time", "Default capacity", "Repeats", "Start date" and "End date" are gone.

```
Selected dates
Schedule      3 selected dates · 09:30–10:30
              Sat 10 Oct · Sat 17 Oct · Sat 24 Oct

Weekly
Schedule      Every Thursday · 17:30–18:30
              From Thu 3 Sep 2026 · until Thu 10 Dec 2026     (or "no end date")

One date
Schedule      Sat 10 Oct · 09:30–10:30

Usual venue   Northgate Sports Centre
Places        12 per date
```

**Usual venue** comes from the session's next upcoming date, and only from a venue that has actually been set. It is never guessed from the dates.

| Situation | Shows |
|---|---|
| A usual venue applies to the session's dates | The venue (U11 now reads **Northgate Sports Centre**) |
| None set | **None set** — "Choose one with Change venue, or set a venue on each date". This applies even if every date happens to use the same venue. |
| A change is coming | A note, for example "From Sat 17 Oct: Hollins Park School" |
| Some dates have their own venue | A note, "2 dates have their own venue". Each date shows its venue in the Dates list. |

It never shows "No venue yet" together with a venue name.

**Dates card** (renamed from "Upcoming dates"): "3 dates · 3 still to come", with the button "All 3 dates". It counts from the same dates as Schedule.

**Header subtitle:** "Development Centre · U11 · 3 selected dates · 09:30–10:30", or "… · Every Thursday · 17:30–18:30".

**Edit session review:** uses the same Schedule, Usual venue and Places wording.

## Foundation issue for the backend / source-of-truth pass (not changed here)
The original Schedule design says **a Draft session should not create live dated sessions until it is activated**.

The prototype does create them for drafts. They are marked as draft dates: hidden from families, with no expected pay, no Needs Attention date alerts (just "Finish setting up"), and a date page that says "This session is still a draft".

Changing that now would affect the seeded data, the venue and coach tools that work on dates, and the tests, so it's left as is. The reconciliation above already gives drafts one clear planned truth: the schedule and the dates always agree.

**For the backend pass:**
- A Draft has a schedule and a preview only.
- Activation creates the dated sessions from that schedule.
- Date-level changes made while in Draft (venue, coaches) are stored as planned arrangements and applied at activation.

## Checked
- **`sestest.js` (16 checks):**
  - the exact reported case (venue from the first date, plus adding 24 Oct), now reading 3 selected dates, Usual venue Northgate and 3 dates;
  - no weekly-style rows;
  - the new date created with the usual venue;
  - a draft date removed;
  - weekly: a new weekday adds future dates up to the horizon, past dates untouched, new live dates get expected pay;
  - booked live dates refused, both in data and in the wizard, with a link to the date;
  - weekly wording.
- **Regression:**
  - every Management, Coach and Parent screen, on desktop and phone, in dark mode and in the Josh Evans brand: no errors or overflow;
  - all journeys;
  - the 66-step scenario script;
  - the Needs Attention, cover, Change coach, venue, delivery and correction suites.
- **Figures:** unchanged.
