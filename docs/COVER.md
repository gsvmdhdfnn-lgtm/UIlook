# Cover: coach can't attend → Hub finds people → coaches answer → Management chooses → done

This pass rebuilds Cover around that one sentence. Matching, offers, replies, dated staffing, access, pay and history stay underneath. The visual style is unchanged.

**Change coach** and **Find cover** stay separate journeys:
- **Change coach:** you already know who should coach.
- **Find cover:** you need the Hub to find someone.

Both use the same staffing steps underneath.

## Management (desktop-first, mobile-action-first)
**Every entry point lands on the same date's cover page:**
- the date's banner;
- the Staff card's **Can't coach**;
- Needs Attention;
- the Cover list;
- a coach's Cover tab;
- time off recorded by Management or the coach.

The address is `mgmt-cover-request/CVR-01/CVR-01-1`, so the date you came for is on top. **Find cover never lands on a list.** If nothing is looking for cover yet, pressing it starts it.

Each date card reads outcome first:

```
2 coaches can cover: choose one
Tom can't coach · Riverside PPA · Mon 12 Oct, 13:15–15:15 · Riverside Academy
3 eligible coaches offered · 2 replied · 2 can cover

  Josh Evans   Can cover · replied 1 Oct 08:40                 [Choose Josh]
  Priya Nair   Can cover · "Yes, I can do the Monday"           [Choose Priya]

Replies and other options ▾
```

| State | Headline | What you do |
|---|---|---|
| Nobody has replied yet | Cover still needed | Nothing. From under 24 hours the card shows "Within 24 hours" and offers **Ring round**. On the day it shows "Today". |
| Someone can cover | Jack can cover / 2 coaches can cover: choose one | **Choose Jack** |
| Everyone said no, or nobody is eligible | No one can cover yet | **I know who should do it** (Change coach), Ring round, or Offer a higher rate |
| Done | Jack is covering ✓ | Nothing. "Can't do it now" is there if plans change. |

**Choose** opens a short confirmation:
- who is told;
- that the regular coaches don't change;
- the pay for the date: normal rate, or the higher cover rate.

"Agree a different rate" is one level deeper, for Finance users only, and needs a reason.

**Replies and other options** holds:
- I know who should do it;
- Ring round;
- Offer a higher rate;
- **Charlie can coach after all** (puts them back on);
- **Run without cover** (warns if that leaves no Lead, and is blocked if nobody is left);
- who was offered it and how they replied;
- who wasn't offered it, and why;
- the prototype's "answer as a coach" buttons, clearly labelled.

**The Cover list** is grouped as: Choose who covers → No one can cover yet → Waiting for replies → Covered (folded away).

**Record time off** no longer comes pre-filled with a coach or dates. It works the same from the Cover page and the coach profile.

## Coach (mobile-first)

```
COVER AVAILABLE · TOMORROW
U13/14 Development
Fri 2 Oct · 18:00–19:00
Hollins Park School
£40.00 for this session · more than your usual rate   ← only when the rate isn't normal

[ ✓ Accept cover ]  [ Can't do it ]
```

**Answering an offer**
- Accept and Can't do it are **one tap each**. A reason can be added afterwards, and only the office sees it.
- **Changing your mind:** "Change my mind" or "Actually, I can", until the office chooses.
- **Once chosen:** "You're covering" with **Open session**, and **I can't do it now**. That reopens the date and offers it again.
- **Filled or no longer needed:** the offer moves to "Earlier offers".
- **What the card shows:** "Covering for Charlie" (name only). It never shows the absent coach's reason, and pay appears only when it isn't their normal rate.

**Your own dates**
- **I can't make this** on a session gives one sheet with quick reasons: Unwell, Work, Family, Travel, Other.
- **Dates you can't make** shows each date as "Finding cover", "Jack is covering" or "You're back on".
- **I can make it after all** works until someone is chosen. After that, it says "Contact the office".
- **Availability** no longer offers "Just mark me unavailable". If the dates touch a session, the office is always told and cover starts.

## Rules underneath (one source of truth)

**Time off never leaves a date looking ready.**
- Any time off that touches a date the coach is on takes them off it as away and starts cover straight away:
  - from the coach, or from Management;
  - whole days, part days, or "Different hours" that miss the session.
- **Safety net:** if anything leaves a coach on a date their time off covers, the date's banner and Needs Attention still say they can't coach. Find cover then starts it.
- **The usual week** can't be switched off, or narrowed, on a day the coach has sessions. You change those sessions or record the dates instead.

**Offers**
- Every eligible coach is offered the date at once, by Hub and email.
- **Not offered:** inactive coaches, coaches with a time clash, coaches on time off or outside their hours, coaches who already said yes to something at the same time, and coaches with expired or missing documents.
- **Flagged, not hidden:** coaches working just before or after.
- **Learning Coaches** are offered only a Learning Coach place, and never a Lead or Coach place.
- **Coaches who become free later** are offered still-open dates automatically. That covers time off removed, hours changed, documents verified, back to active, or taken off another date.

**Replies and choosing**
- A yes never assigns anyone; Management chooses.
- **Re-checks:** accepting and choosing both check the coach is still free.
- **No double-booking:** choosing a coach closes their other open offers at the same time.

**Once someone is chosen**
- They join that date only as cover. **The regular coaches never change.**
- They get access to that date only.
- **Pay:** they are paid the agreed rate for that date (their normal rate, or the higher cover rate), and their normal rate profile is never edited.
- **Expected pay** moves from the absent coach to the cover coach. Actual pay still comes from delivery confirmation.
- **Who is told:** every other coach offered it is told it's filled. "No need to reply" goes to those who hadn't answered, and "Thanks for replying" to those who had. The absent coach is told who is covering.

**Every date is independent.** Choosing, withdrawing or closing one date never touches the others in the same request.

**Cover closes by itself when the date changes:**
- **Cancelled or postponed:** offers close and the coaches offered it are told it's no longer needed.
- **Moved:** the old date's cover closes. The new date is checked afresh, and needs cover again if the coach is still away.
- **Confirmed as delivered:** it closes with whoever actually covered.

**If plans change**
- **Withdraw:** the coach puts themselves back on until someone is chosen. Management can put them back, or run without cover, at any time.
- **Drop-out:** a chosen coach who can't do it comes off the date, the absent coach is told, and the date is offered again.

**Needs Attention**
- There is one item per date, worded by outcome: "Cover still needed", "Jack can cover: choose", "No one can cover yet". It opens that date.
- It turns Urgent within 24 hours, and on the day it reads "Cover still needed today".
- A no-coach date shows its cover progress instead of a separate "has no coach" item.
- One coach's cover never hides another coach's absence on the same date.

**Every step** is recorded with who, when and why: on the request, on the date and in the activity log.

## Mock data
The four mock requests are now raised through the same functions the Hub uses, so they behave like real ones:

| Request | Date | State |
|---|---|---|
| CVR-01 Tom's holiday | Mon 12 Oct | 2 coaches can cover: choose one |
| CVR-01 Tom's holiday | Thu 15 Oct | Waiting for replies |
| CVR-02 Charlie tonight | Thu 1 Oct | No one can cover yet (Today) |
| CVR-03 No coach | Fri 2 Oct | Waiting for replies |
| CVR-04 Priya | Fri 2 Oct | Jack is covering |

## Checked
- **Scenario tests** (`covtest.js` 42, `covui.js` 4), covering:
  - choosing one of two;
  - who is told what, and expected pay and the regular coaches;
  - time off from either side;
  - "Different hours";
  - the safety net;
  - Can't coach from the date;
  - the coach answering and changing their mind;
  - overlapping offers;
  - cancel, reschedule and delivery closing cover;
  - drop-out;
  - withdraw;
  - the higher rate;
  - the Learning Coach rule;
  - the usual-week block;
  - late eligibility.
- **Regression:**
  - every Management, Coach and Parent screen, on desktop and phone, in dark mode and in the Josh Evans brand: no errors or overflow;
  - all journeys;
  - the 66-step scenario script;
  - the Change Coach, venue, delivery and correction tests.
- **Figures:** unchanged (September figures, October expected coach cost, and 33 Needs Attention items).
