# Design audit: UIlook against the Josh Evans design packs

**What was checked.** UIlook as of commit `fba880c` (after the screen-priority pass) was audited against:
- the four PDFs:
  - *Management Hub Blueprint*
  - *Commercial, Booking & Coach Rates Model*
  - *Payments & Discounts Concept*
  - *Multi-Sport Product Direction*
- the standalone *management mockup* (HTML);
- the *Management Home / More* interactive mock-up;
- all 68 design images: Schedule & Sessions 17, Coaches 20, Finance 13, Players & Parents 10, Needs Attention 8.

**How.** Every image was read, and UIlook's matching screens were opened in the Josh Evans brand at desktop and phone width. The most serious findings were then checked against the code.

**Ground rule for every recommendation: keep UIlook's visual style.** The palette, card shapes and borders, spacing, typography, buttons, shadows, status colours, section containers and premium feel all stay. The references have their own look (navy and lime, Anton headings, small 9–12 px text). **Do not adopt it.** The audit takes only structure, flow, wording, rules and information order from them. Every change below can be built with UIlook's existing pieces: the situation banner, cards, segmented tabs, tables, status pills in the existing tones, sheets, and the "Details" folds.

---

## 1. Non-negotiables and where UIlook stands

**Status key:**
- ✅ met
- 🟡 partly met
- ❌ broken, or missing

### Management Hub Blueprint
| # | Non-negotiable | Status | What is wrong today |
|---|---|---|---|
| B1 | Management runs the business in the Hub; database terms are hidden | ✅ | The language passes already did this. No Airtable, Supabase or Google Sheets wording anywhere. |
| B2 | Home is the control centre: **Needs Attention first**, then the areas | 🟡 | On desktop the four area cards come before the Needs Attention panel. The urgent strip is first only on phone. |
| B3 | **Needs Attention surfaces every unresolved management decision** | ❌ | 21 rules, against roughly 40 in the design. Missing rules, by group:<ul><li>Staffing: No Lead Coach.</li><li>Sessions: over capacity, partially delivered, awaiting confirmation after delivery.</li><li>Cover: coach accepted (choose one), multiple acceptances.</li><li>Approvals: coach sign-ups, session requests, trial and booking approvals. These sit in a separate Approvals list.</li><li>Finance exceptions: missing rate, coach-cost override, venue cost confirmation, missing commercial setup, cash below the safety level.</li><li>Unread message replies.</li><li>Safeguarding / welfare, which should be locked at Urgent.</li></ul> |
| B4 | Needs Attention is **urgent first** | ❌ | The queue is grouped by category, so an Urgent item can sit below Normal ones. The engine itself sorts correctly; the page regroups the list. |
| B5 | Dated session asks **"Did this session go as planned?"** with one-tap **Went as Planned** and a **Something Changed** path | ❌ | UIlook's "Confirm session" means something else: "this session is going ahead", before it runs. It only stamps who confirmed it and when. |
| B6 | Confirmation turns **planned staff into actual staff**, which fixes the **actual coach cost**, which feeds the finance actuals | ❌ | No planned → actual step. Pay items are created from the plan whether or not delivery is confirmed. |
| B7 | Six session statuses: **Confirmed, Awaiting Confirmation, Staffing Issue, Cancelled, Rescheduled, Partially Delivered** | ❌ | UIlook uses Scheduled, Completed, Cancelled, Rescheduled and Postponed, plus risk pills. Partially Delivered, Awaiting Confirmation and Staffing Issue do not exist. |
| B8 | Something Changed covers: coach absent, add cover, **add extra coach**, change role for today, **partially delivered**, cancel, reschedule | 🟡 | Cancel, reschedule, cover and role on the day exist. Extra coach and partial delivery do not. |
| B9 | Add Session offers **Weekly / Selected dates / One-off**, with an optional end date | 🟡 | There is no One-off option, and an end date is required. |
| B10 | Add Session asks **"How is this session funded?"** and **"How is this session charged?"**, with booking access next to capacity | 🟡 | The fields exist but use internal names ("Commercial model", "Billing model") and the wrong option lists (see C1). |
| B11 | Schedule sections: This Week, Manage Sessions, **Changes & Cancellations**, Venues, **Terms & Breaks** | 🟡 | There is no Changes & Cancellations view and no Terms & Breaks view. Breaks exist only inside each session. |
| B12 | Regular session is edited in Manage Sessions; cancel, reschedule, absence and cover happen on the dated session | ✅ | |
| B13 | Coaches area: Add Coach, list and search, Cover & Availability, **Pay Rates**, **Coach Access**, **Pending Accounts** | 🟡 | No Pay Rates view across all coaches and no Coach Access view. Pending accounts are buried in "More in Coaches". |
| B14 | Coach profile: Profile, Sessions, **Cover**, Availability, Pay, **Access**, Documents, **History** | 🟡 | Cover is merged into Availability. There is no Access tab. History is hidden inside "Profile and contact". |
| B15 | **Cover: the Hub auto-finds eligible coaches and sends to all of them by Hub and email** | ❌ | Management asks one coach at a time. |
| B16 | Exclusions: inactive, overlapping session, already covering, unavailable. **Flag** coaches working just before or after | 🟡 | Inactive, overlap, unavailable, Learning-coach and expired-document exclusions all work. There is no back-to-back flag, and a coach who accepted another overlapping cover that isn't confirmed yet is not excluded. |
| B17 | **Accepting does not assign; Management chooses among the coaches who accepted** | ❌ | Accepting correctly does not assign. But when two or more coaches accept, only the **last** acceptance can be confirmed (`coaching.js:403`). |
| B18 | **The other coaches are told the cover is filled** | ❌ | Coaches who never replied still see Accept / Decline after the cover is filled. |
| B19 | Coach buttons read **"Accept Cover / Can't Do It"**; "Cover Still Unfilled" stays until filled; late illness is urgent | 🟡 | The buttons say Accept / Decline. The request stays open correctly. There is no "still unfilled" wording and no late-illness rule. |
| B20 | Players & Parents: Session Requests (**approve / amend / reject**), Parent Claims, Trials, **Player Movement (join / move / end)** | 🟡 | There is no "amend" and no "move to another session". |
| B21 | Development: missing feedback, reviews due, "10 of 12 completed" with a reminder | 🟡 | Feedback review and IDP rules exist. There is no completion-per-session view with a reminder. |
| B22 | **Communications**: inbox, coach and parent conversations, session messages, notices, sent, **unread counts on Home** | ❌ | Only Notices and message templates. No inbox, no conversations, no unread counts. |
| B23 | Communication permissions: only the Lead Coach can message parents; parents reply only in authorised conversations | 🟡 | The Lead-only sending rule is right. Parent replies are not modelled. |
| B24 | Finance: Overview, **Forecast**, Coach Costs, Session Profitability, Client Revenue, **Venue Costs**, VAT, **Export** | 🟡 | There is no Forecast view, no venue-cost confirmation and no export (only Print). |
| B25 | **Expected coach cost and actual coach cost are kept separate** | ❌ | Expected cost (October draft pay items) appears only on Coaches › Coach pay. "Actual only" in the month figures counts every pay item, whatever its state. |
| B26 | Settings & System: Organisation, **Users & Access**, Roles & Permissions, Venues, Programmes, **Commercial Setup**, Notifications, Integrations, **System Health** | 🟡 | Settings is only branding, labels, features and finance. Several of these exist elsewhere but aren't linked from Settings. Users & Access and System Health don't exist. |
| B27 | Role table (see below) | ❌ | Learning Coach can mark the register (the table says no). Coach can't edit IDPs (the table says yes). |
| B28 | **Permanent role change**: the old period ends, a new one starts, future unconfirmed dates update, past dates are unchanged | ❌ | A permanent change is a plain dropdown in the Edit-session wizard, with no effective date and no record of the old period ending. |
| B29 | **One-off or date-range role change**, after which the regular role resumes | ✅ | Exists as "Temporary role changes", but only on the coach profile. |
| B30 | Requests never silently change what's true; Management confirmation does | ✅ | |
| B31 | Past confirmed dates never change | 🟡 | True for invoices, pay items and work summaries. Not yet enforced for dates, because there is no post-delivery confirmation (B5). |
| B32 | Role and pay are separate; forecast and actual are separate | 🟡 | Role and pay are separate. Forecast and actual are not (B25). |
| B33 | Every important action leaves who, what, when and why | ✅ | Strong throughout, except changes to a session's setup, which aren't shown on the session page. |

**Role table (non-negotiable):**

| Role | Names | Profiles | Register | Feedback / IDP | Communications |
|---|---|---|---|---|---|
| Lead Coach | Y | Y | Y | Y | Y |
| Coach | Y | Y | Y | Y | N |
| Learning Coach | Y | N | **N** | **N** | N |

UIlook differs in two places:
- Learning Coach has **Register Y**, and can write feedback for the lead to sign off.
- Coach has **IDP editing N**.

### Commercial, Booking & Coach Rates
| # | Non-negotiable | Status | What is wrong today |
|---|---|---|---|
| C1 | Three separate settings on each session. **Commercial model:** Parent Bookable / School-Client Contract / Internal. **Booking access:** Open Booking / Management Approval Required / Invite Only / Not Parent Bookable. **Billing model:** Monthly Subscription / Term Fee / Per Session / One-Off / Hourly Client Rate / Fixed Client Fee / No Charge | ❌ | The three settings exist, but the option lists don't match (`js/data/schedule.js:181-183`). UIlook's commercial list mixes in billing types. Booking access lacks Management Approval Required and Not Parent Bookable. Billing lacks Term Fee, One-Off, Hourly Client Rate, Fixed Client Fee and No Charge. |
| C2 | Coach cost comes from the coach's rates, **never typed onto the session** | ✅ | |
| C3 | Rate types: **day, evening, camp, match/event, custom** | ❌ | Day and evening only. Which one applies is guessed from the start time (before or after 15:00). |
| C4 | **The rate used is snapshotted**; a rate change affects future work only | ✅ | Rate profiles are effective-dated and never edited, and each pay item keeps its rate. |
| C5 | Missing rate is an exception, not a guess | ❌ | Falls back silently to £31.25 (`finance.js:146`). |
| C6 | **Academy:** families can't self-enrol, and payment appears only after access is granted | ❌ | Academy behaves like any weekly group in Browse and on the public site. Parents have no "place offered → accept → pay" step. |
| C7 | "Do not duplicate what can be linked" | 🟡 | The data is mostly linked. Documents can't be linked to several schools (the design's "upload once, choose where it applies"). |

### Payments & Discounts (future concept)
| # | Non-negotiable | Status | What is wrong today |
|---|---|---|---|
| D1 | The Hub works out price and discount; the payment provider only charges the final amount | ✅ | |
| D2 | Parents see **original price, then discount, then final total** before paying | 🟡 | Camp booking and the basket get this right. Parent Billing's "Next payment £159" doesn't show the credit taken off or the actual amount due. |
| D3 | Discount settings: name, type, value, applies to, **start and end**, **automatic or code**, **usage limit**, **can stack Yes/No**, **priority**, active | 🟡 | Name, type, value, applies to, start and active exist. End date, promo code, usage limit, a per-rule stacking setting and priority do not. |
| D4 | Discount types: sibling, multi-session, early bird, promo code, staff/family, loyalty, camp bundle, manual | 🟡 | Sibling, membership and manual exist. Package pricing is close to a camp bundle. |
| D5 | **Reserve a Pricing & Discounts area in Management** | ❌ | Discounts sit inside Players & Parents › Prices and policies. |

### Multi-sport
| # | Non-negotiable | Status | What is wrong today |
|---|---|---|---|
| M1 | Football is one configuration, not the product | 🟡 | The data model is sport-neutral. |
| M2 | **Configurable terms**: sport, participant, venue, staff-role names, programmes, development framework, positions | ❌ | Only Coach, Parent and IDP can be relabelled. "Player", "Lead / Coach / Learning Coach" and the framework names are hard-coded. |

---

## 2. Area by area

### Management Home and Needs Attention (8 images, plus both mock-ups)
- **Home layout: your decision.** The designs put three areas on Home and Finance behind More. UIlook has four, including Financials, because you asked for that. Development, Communications, Content & Brand, Reports and Settings are all behind More in both.

  Changes worth making:
  - Rename "Sessions" to **"Schedule & Sessions"**.
  - On desktop, show the Needs Attention summary line ("4 Urgent · 10 Warning · 14 To do · Review") **above** the area cards.
  - Add **awaiting confirmation** and **unread messages** counts.
- **Queue.** Order everything by severity under "All", and keep category as a filter or a small label. Rename "Players & Families" to **"Players & Parents"**.
- **Issue panel (Review Staffing, Capacity Exception).**
  - Add **Issue / Expected** lines, for example "2 coaches, no Lead Coach / At least 1 Lead Coach".
  - Let the problem be fixed in the panel: Change role, + Add coach, Edit capacity, **Approve exception** with a scope ("this date only" or "this session until …").
- **Return flow.** Already works end to end. Add the quiet banner "Opened from Needs attention. Saving returns you there."
- **Rules page.** Make the first level a list of categories ("N of M on · Open"), with the table one level down. This also fixes rule names being cut off on desktop. Add the Communications and System & Data categories, and the locked-Urgent safeguarding rule.

### Schedule & Sessions (17 images, plus the management mockup)
- **Dated session: the main change.**
  - Before the date it stays as now: the readiness banner, Find cover, Change coach.
  - After the date it becomes **"Did this session go as planned?"** with **Went as Planned** (one tap) and **Something Changed**.
  - Something Changed opens the seven exceptions.
  - Rename "Coaches for this date" to **"Staff for this Session"**. Each person shows Planned → Present / Absent / Cover / Extra, with a ••• menu.
  - Confirming saves the actual staff and the actual coach cost, and the date can't be changed afterwards.
  - **Cancel** asks about coach pay (paid in full, late cancellation, or a change with a reason) and venue cost (still charged or waived) in the same step. Parent refunds and credits stay as the follow-on page.
- **Statuses.** Use the six Blueprint statuses everywhere: pills, filters, calendar legend, This Week.
- **Add Session.**
  - Step 1 is just name, programme and age group.
  - Schedule: Weekly / Selected dates / **One-off**, with an optional end date.
  - Venue & capacity, with **booking access** next to capacity.
  - Then **"How is this session funded?"** and **"How is this session charged?"**, using the PDF option lists.
  - Regular Staff: only the people added, with **Lead Coach** first.
  - Review, ending in **Save as Draft** or **Create & Activate**, with the note "Drafts create no live dates".
- **Session page tabs.** Overview / Schedule / History:
  - **Overview** opens with a short summary: operating period, capacity and spaces left, next date, most recent date.
  - **Schedule** shows break dates in the list ("No session · half term"), a Changed pill, and recent dates.
  - **History** shows every setup change as before → after, with who, when and the effective date.
- **One Change Role sheet**, opened from ••• on Regular Staff and on Staff for this Session. Choices: **Permanent from [date]**, **One-off**, or **Date range**, plus a reason. Show "Lead Coach / Coach / Learning Coach" in full.
- **Smaller changes:**
  - All Sessions: group by weekday, add search, a fill bar and a one-off marker.
  - Calendar: add **+ Add one-off session**, a filter, a list mode, and the status word on each entry.
  - Venues: add **+ Add venue** and **Edit venue**, plus a **bulk move or cancel** for an unavailable period, using one shared reason while each date keeps its own history.
  - Back links: decide whether they keep following your path (as now) or go to the page's parent, as the designs do.

### Coaches (20 images)
- **Cover, the most important fixes:**
  1. **Send to all eligible (N)** is the default action, by Hub and email. "Ask one" stays as the exception.
  2. List **every coach who said yes**, each with its own Confirm. Add a **Multiple acceptances** state.
  3. Confirming opens a short **confirm sheet**: normal rate, expected cost, an optional rate change for this date with a reason, and what happens next ("closes the request → tells Jack → Danny sees Jack is covering → actual rate saved").
  4. **Close the other offers.** Coaches who never replied see "This cover has been filled".
  5. Add a **back-to-back flag** ("Free · working 17:30–18:30 just before"). Exclude anyone who has accepted another overlapping cover.
  6. **"Cover still required today"** wording, and urgent once under 24 hours. Add **Resolve without cover** and **Cancel request**.
  7. On the Cover page, show reply counts per item, plus **Upcoming cover** and **Recent cover** sections.
  8. Coach buttons become **"Accept Cover" / "Can't Do It"**.
- **Rates.**
  - Add **Camp (per day), Match/Event and Custom** rates to the effective-dated rate profile.
  - Let a session or date say which rate type it uses.
  - Replace the £31.25 fallback with a **"Missing rate"** item in Needs Attention.
  - Give rates their own place: a **Pay Rates** view across all coaches showing who is missing a rate, plus rates first in a coach's Pay tab.
  - On coach-facing cover offers, show pay only when it differs from normal.
- **Area and profile structure.**
  - Area: Add Coach, list, Cover & Availability, **Pay Rates**, **Coach Access**, **Pending Accounts**.
  - Profile: Overview, Sessions, Availability, **Cover** (what they covered), Pay, Documents, **Access**, **History**.
- **Roles.** Fix the clash between a coach's job title and their session role: Charlie shows "Lead Coach" but is assigned as Coach on both sessions. Session roles should lead.
- **Work summaries.**
  - Add a **Finalise** confirm sheet that spells out the consequences.
  - Group lines by session with subtotals, plus a **Cover work** group.
  - Add a printable branded **PDF**: "not an invoice; coaches send their own invoice", Finalised by and on.
  - **Your decision:** keep UIlook's "coach confirms first" step, or follow the design's "Needs review → Management finalises". In the design, a coach query sends it back to Needs review.
- **Documents.** Add **"Applies to"** so one upload can cover several schools. Add linked schools and view/download on the document page.

### Finance (13 images)
- **Forecast vs actual coach cost.** Add an **Expected** figure (planned staff × rate in force on the day) next to **Actual** (confirmed delivery) on Money out and the Overview. Make "Actual only" count only confirmed pay items.
- **Finance exceptions in Needs Attention:**
  - missing rate;
  - coach-cost override;
  - venue cost awaiting confirmation;
  - missing commercial setup;
  - cash forecast below the safety level.

  Finance's own "Needs you" card should read from the main queue, not a separate list.
- **Money in.** Add sub-tabs Clients / Invoices / Subscriptions / Bookings & other. Add a **Next invoice run** figure and **Create invoice**. On drafts, add a **"Check before sending"** card (excluded sessions, rate changes, PO, blockers count).
- **Money out.**
  - Add a **Suppliers & Venues** tab: agreements, payment instalments marked Paid or Due, contact, supplier credit, and **venue cost confirmation**.
  - **Add cost / supplier** as four plain questions: what are we getting, what are we paying, when, and who with. It should cover fixed, hourly, recurring and custom-date agreements, with estimates that are replaced by actuals.
  - Group overheads into categories, and add an estimate review step (use the estimate, or enter the actual).
- **Cash flow.**
  - Add Cash position / Money in / Money out filters.
  - Offer a 30-day or 3-month range.
  - Add an **Overdue** block.
  - Show the timeline grouped by date and open by default.
  - Add **Update bank balance**, with history.
  - Add the VAT payment as a dated estimate.
- **Month report.** Add a month picker, a "compared with August" line, editable management notes, drill-in by programme, and **Export (PDF/CSV)** carrying the month, the Actual/Expected setting, notes and a timestamp.
- **Settings.** Turn it into a **Required / Recommended / Optional** checklist with a completion count. Add bank details, an editable safety threshold, the estimate reminder and overhead categories. **Do not** carry over the design's "Google Sheet · Connected" row.

### Players & Parents (10 images)
- **Booking access for parents.**
  - Each weekly group shows its access with the matching button:
    - Open → Book now.
    - Approval required → Request a place.
    - Invite only → Request a trial or "By invitation".
    - Full → Join waitlist.
  - **Academy never shows a book or pay path before access is granted.**
- **Browse by child.** "Viewing sessions for Alfie ▾" splits into **Available for Alfie** and **Other sessions**, with the reason written out ("U12 to U14 only"). On a phone it is currently hidden in a tooltip. Add category chips.
- **Offers & waitlists** on Memberships: "U12 Academy place offered, waiting for your decision" → View offer → Accept → payment set-up. Management sends the offer from Trial interest or from a request.
- **Session requests:** add **"Amend and approve"** (different session, start date or group, with a note the parent sees).
- **Player movement:** add **Move to another session** (end one place and start another, keeping history) from the player and the membership.
- **Billing:** show the next payment as "U8 £72 + U9/10 £87 = £159 − £27 credit = **£132 due 1 Nov**". History lines show the original price and the credit. Add a payer and payment-method card.
- **Development as the player's own space.** Header with the IDP review date. The current IDP and big focus come first, then latest feedback, targets and progress, and a history timeline, written in the player's voice. Fix the phone-width bugs: the "On track" pill is clipped and there is an empty stamp line.
- **Management player page:** a **Current actions** list (every open item, not just the top one), a **Parents & Access** tab, and an **Actions** menu (move, end, pause, record medical).
- **Smaller changes:**
  - Live figures on the Parent Home shortcuts ("£159 due 1 Nov · £27 credit").
  - "Your programmes" and "Find another session" on the parent Sessions page.
  - An Inactive count on the Players & Parents landing.

### Communications, Settings and terminology
- **Communications:** Inbox, Conversations (coach and parent), Session messages, Notices, Sent, with unread counts on Home and in Needs Attention. Parents reply only in authorised conversations.
- **Settings & System** becomes a real hub, linking things that already exist and adding what doesn't:
  - Organisation.
  - **Users & Access** (new).
  - Roles & Permissions (link the existing page).
  - Venues and Programmes (link).
  - **Commercial Setup**, including a reserved **Pricing & Discounts** area with the full discount settings.
  - Notifications.
  - Integrations.
  - **System Health** (new placeholder).
  - Needs Attention rules.
- **Terminology layer:** extend the existing labels (Coach, Parent, IDP) to cover sport, participant (Player / Athlete / Swimmer), venue, staff-role names, programme, framework and positions. Route the main nouns on screen through it, and add a cricket example organisation to prove it works.

---

## 3. Where UIlook is already better: keep these
- The **readiness / situation banner**: one sentence and one next step. It is clearer than the designs' static status cards.
- **Plain-language cover states** ("Waiting for Jack and Charlie to reply", "No one has said yes yet"), **unsuitable coaches with reasons**, and decline reasons.
- **Effective-dated rate history that is never edited**, with a rate snapshot on every pay item, adjustments that need a reason, and payment runs. The designs have no effective dates at all.
- The **live Needs Attention engine**: cases clear themselves once fixed, priority reasons, thresholds, locked minimums, exceptions with approver and reason, the Accepted tab, and the **automatic return** (tested end to end).
- **Invoices:** draft → ready → issued, frozen issued invoices, credit notes, replacement invoices, part payments, reversals, and omissions listed.
- **Refunds and credits after a cancellation**, with parent notification. The designs stop at coach and venue pay.
- **Venue map, photos, hire cost** and the list of dates affected when a venue is unavailable.
- **Date-by-date preview** when creating a session, with skipped breaks shown.
- Parents: the **notice-period maths**, "taken payments are final", **terms-version acceptance**, **term medical reconfirmation**, restricted care details with who and when, and detail changes approved by the office.
- **Parent Home order matches the design exactly.**
- Who/when stamps everywhere, and no Airtable, Supabase or Google Sheets wording.

## 4. Decisions only you can make
1. **Home:** keep four areas (Financials on Home), or go back to the design's three areas with Finance behind More?
2. **Work summary:** keep "coach confirms, then Management finalises", or follow the design's "Management reads and finalises; a coach query sends it back"?
3. **Learning Coach registers:** the role table says no. UIlook currently lets them mark the register, which can be useful on placements. Follow the table?
4. **Coach IDP editing:** the table says yes. UIlook says no. Follow the table?
5. **Back links:** keep "back to where you came from" (from the flow pass), or switch to the designs' fixed parent pages?
6. **Vendor names:** keep "Stripe" and "Xero" in management finance wording (the designs use them too), or make them generic ("card payments", "accounting app")?

## 5. Suggested order of work
Every phase keeps the current visual style and is built from existing UIlook components.

| Phase | What | Fixes | Size |
|---|---|---|---|
| **1. Rules and quick wins** | <ul><li>Urgent-first queue.</li><li>PDF option lists for funded / booking access / charged, with plain-question labels.</li><li>"Lead Coach / Learning Coach" in full.</li><li>Role table defaults (after your decision).</li><li>"Accept Cover / Can't Do It".</li><li>"Schedule & Sessions" name.</li><li>Needs Attention summary first on desktop.</li><li>Return banner.</li><li>Billing next-payment breakdown.</li></ul> | B2, B4, B10, B27, C1, D2, B19 | S each, M in total |
| **2. Session confirmation** | <ul><li>Six statuses.</li><li>Staff for this Session.</li><li>Went as Planned / Something Changed, including extra coach and partial delivery.</li><li>Actual staff and actual cost.</li><li>Pay and venue decision when cancelling.</li></ul> | B5–B8, B31 | L |
| **3. Cover** | <ul><li>Send to all eligible.</li><li>Every acceptance listed, with a confirm sheet.</li><li>Close the other offers.</li><li>Back-to-back flag.</li><li>Unfilled and urgent wording; resolve or cancel.</li><li>Upcoming and recent cover.</li></ul> | B15–B19 | M |
| **4. Needs Attention coverage** | <ul><li>No Lead Coach.</li><li>Over capacity (with Edit / Approve exception and scope).</li><li>Partial delivery.</li><li>Cover accepted / multiple acceptances.</li><li>Approvals.</li><li>Finance exceptions.</li><li>Safeguarding.</li><li>Issue / Expected panel.</li><li>Rules by category.</li></ul> | B3, C5 | M–L |
| **5. Rates and forecast** | <ul><li>Camp, match and custom rates.</li><li>Rate type per session.</li><li>Pay Rates view.</li><li>Expected vs actual coach cost in Finance.</li><li>Missing-rate exception.</li></ul> | C3, C5, B24, B25, B32 | M–L |
| **6. Sessions setup** | <ul><li>One-off sessions.</li><li>Optional end date.</li><li>Save as Draft / Create & Activate.</li><li>Session tabs with setup history.</li><li>One Change Role sheet (permanent / one-off / range).</li><li>Changes & Cancellations, and Terms & Breaks.</li></ul> | B9, B11, B28 | M–L |
| **7. Booking access and Academy** | <ul><li>Access shown per group with the matching button.</li><li>Browse by child.</li><li>Offers & waitlists with accept, then pay.</li><li>Amend on requests.</li><li>Move player.</li></ul> | C6, B20 | M–L |
| **8. Coaches structure** | <ul><li>Pay Rates, Coach Access and Pending Accounts entries.</li><li>Profile tabs Cover / Access / History.</li><li>Work summary PDF and finalise sheet.</li><li>Documents linked to several schools.</li></ul> | B13, B14, C7 | M |
| **9. Finance depth** | <ul><li>Money in tabs.</li><li>Suppliers & Venues with venue confirmation.</li><li>Add cost as four questions.</li><li>Cash flow filters, bank balance and VAT event.</li><li>Month report picker, comparison, notes and Export.</li><li>Settings checklist.</li></ul> | B24 | L |
| **10. Platform** | <ul><li>Communications inbox, conversations and unread counts.</li><li>Settings & System hub with Users & Access, Commercial Setup, Pricing & Discounts and System Health.</li><li>Configurable terminology with a second-sport example.</li></ul> | B22, B23, B26, D3–D5, M2 | L |

Phases 2, 5 and 7 add fields to the **mock data** (actual staff, rate types, offers). That is a data-model change, so it should be agreed before building. Everything else is screens and wording.

## Appendix: per-image status
| Area | Image | UIlook |
|---|---|---|
| Schedule | p04 Schedule & Sessions Home | Yes; missing Changes & Cancellations and Terms & Breaks |
| | p05 All Sessions | Partial: no weekday grouping, fill bar or one-off marker |
| | p06 Session Overview | Yes, but one long page; no tabs, no per-coach role action |
| | p07 Session Schedule | Partial: breaks not inline, no recent dates |
| | p08 Session History | Partial: status changes only |
| | p09 Dated Occurrence | Partial: no "go as planned" flow, no six statuses |
| | p10–p12 Calendar grid / list / month | Grid and month yes; list no; no filter or one-off button |
| | p13–p14 Venues and detail | Yes, and richer; no Add / Edit venue or bulk move |
| | p15–p19 Create Session steps | Yes; wrong option lists, no One-off, no Draft / Activate buttons |
| | p20 Create One-off Session | No |
| Coaches | p04 Coaches Home | Yes; no Pay Rates, Coach Access or Pending Accounts |
| | p05 Coach Overview | Partial: no Access, Cover or History tabs |
| | p06–p07 Sessions & Roles, Change Role | Partial: no permanent change with a date |
| | p08–p09 Rate profile, Edit rates | Partial: day and evening only, but effective-dated |
| | p11–p13 Availability, weekly, exception | Yes |
| | p14 Cover workspace | Partial: no reply counts, upcoming or recent |
| | p15 Cover responders | Partial: only the last acceptance can be confirmed; no back-to-back flag |
| | p16 Confirm cover | Partial: one tap, no sheet, others not told |
| | p18–p20 Documents, detail, add | Yes; no "applies to" schools |
| | p21–p23 Work summary, finalise, query | Yes; no grouping, no finalise sheet |
| | p24 Work summary PDF | No |
| | p25 Cover history | Partial |
| Finance | p06 Overview | Yes; its own exception list, no VAT event |
| | p08 Money in / Clients | Partial: no sub-tabs |
| | p10 Invoice review | Yes, and deeper; no "check before sending" card |
| | p13 Subscriptions | Partial |
| | p15 Money out / Coaches | Yes; no expected vs actual |
| | p17, p19 Suppliers & venues, Add cost | Partial: no agreements or venue confirmation |
| | p21 Overheads | Partial: no categories or estimate review |
| | p23, p25, p26 Cash flow | Partial: no filters, bank update or overdue block |
| | p28 Month report | Yes; no export, picker or comparison |
| | p30 Finance settings | Partial: not a checklist |
| Players & Parents | p05 Management landing | Yes; the "need action" count is too low |
| | p07 Player profile | Yes; one banner rather than a full action list, no Parents & Access tab |
| | p09 Parent profile | Yes; phone and account status thin |
| | p10 Parent Home | **Exact match** |
| | p12 Sessions | Yes; no "Your programmes" |
| | p13 Browse & eligibility | Partial: not by child, booking access not shown |
| | p14 Development | Partial: wrong order, parent's voice |
| | p15 Child profile | Yes, and richer |
| | p18 Memberships & bookings | Partial: no offers or waitlists |
| | p19 Billing | Yes; next payment not broken down |
| Needs Attention | p01 Home | Yes; four areas by your choice |
| | p02 Queue | Yes; not urgent first |
| | p03 Review staffing | Partial: can't fix in the panel |
| | p04 Capacity exception | No |
| | p05 Complete register | Yes; return works |
| | p06 Automatic return | Yes |
| | p07 Rules | Partial: 21 of about 40 rules, flat table |
| | p08 Backend connection | Yes for the architecture; 3 of the 5 first examples missing |
