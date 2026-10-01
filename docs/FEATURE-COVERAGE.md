# Feature coverage (pass 12)

Every feature from the pass-12 brief, mapped to the screen that shows it. Routes are hash routes:
open `index.html#<route>`. A route with `/ID` opens one item, for example `#mgmt-fin-invoice/INV-0011`.

Every screen follows these rules:
- It has Loading, Empty and Error states (prototype bar: Data / Empty / Loading / Error).
- It works in both brands (Relvor, Josh Evans), in light and dark, at desktop and phone widths.
- Changing data updates in-memory state, shows a toast and adds a history entry that says who did it and when.

All data is invented and lives in `js/data/*.js`. Screens read it only through `Hub.db` helpers.

## Prototype bar
| Feature | Where |
|---|---|
| Role: Management / Staff (Coach) / Parent / Public | Prototype bar → Role |
| Coach role: Lead / Coach / Learning coach | Prototype bar → Coach role (shown when Role is Staff) |
| Finance access: None / View / Manage | Prototype bar → Finance access. None hides Finance and its links. View is read-only. |
| Feature switches | Prototype bar → Feature switches. These are also on `mgmt-features`. |
| Guided walkthroughs | Prototype bar → Scenario |
| Clock fixed at Thu 1 Oct 2026, 14:10 | `Hub.kit.today` / `K.now()` |

## 1. Public site and sign-up
| Feature | Route |
|---|---|
| Public landing: name, logo, tagline, offer cards, sessions with their booking action, Register interest. Browsing needs no account. | `pub-home` |
| Offer list and offer pages (trials, academy, tours, events, general). Each session or product shows its action: Book now, Book free session, Request a trial, Join waitlist or Register interest. | `pub-offers`, `pub-offer/<id>` |
| Sign in (demo accounts route to the right hub; pending staff go to Waiting). After choosing an action: "Sign in to continue", with the chosen session shown and kept. | `pub-signin` |
| Create account (Parent / Coach / Management; staff need approval). The chosen session is carried through every step. | `pub-register` |
| Check your email | `pub-check-email` |
| Waiting for approval | `pub-waiting` |
| Parent sign-up with Matched / Created / Needs review (never matched on name alone), then "Continue: <action>" | `pub-parent-signup` |
| Finish a free session, trial or waitlist request (child, date, note; no payment). Book now goes to the Parent hub's booking. | `pub-request`, `parent-book/camp-oct` |
| Approvals hub | `mgmt-approvals` |
| Coach and management sign-ups | `mgmt-coach-signups` |
| Trial coaches | `mgmt-trial-coaches` |
| Parent claims (Needs review: CLM-04, Paul Moss) | `mgmt-parent-claims` |
| Trial interest leads (New / Contacted / Booked / Declined) | `mgmt-trial-leads`, `mgmt-trial-leads/<id>` |

## 2. Management Home and Needs Attention
| Feature | Route |
|---|---|
| Home: stats, mobile urgent summary, today's schedule with staffing and register state, attention panel, calendar, tomorrow, approvals, since you last looked | `mgmt-home` |
| Needs Attention, computed live from every area (fixing the issue clears the case) | `mgmt-attention` |
| Tabs All / Urgent / Warning / To do / Accepted, plus a category filter | `mgmt-attention` |
| Case drawer: why this priority, related items, action | `mgmt-attention` → any case |
| Accept a case or change its priority (reason, approver, lowest allowed priority respected) | case drawer → Accept / Change priority |
| Rule settings: on/off, standard priority, warning and urgent points, lowest allowed priority, exceptions list | `mgmt-attention-rules` |
| More: every area, respecting Finance access and feature switches | `mgmt-more` |
| Search across players, parents, coaches, sessions, venues and invoices | header search |
| Add new; switch organisation (switches brand) | header buttons, sidebar organisation card |

Rules and where their cases come from:
- Staffing and cover:
  - ATT-013: no coach.
  - ATT-014: assigned coach unavailable.
  - ATT-002: learning coach only.
  - ATT-041: cover open.
- Coaches and compliance:
  - ATT-011: document expiring, expired or missing.
  - ATT-031: non-compliant coach assigned.
  - ATT-042: document awaiting verification.
  - ATT-045: work summary ready.
- Sessions and venues:
  - ATT-018: no venue.
  - ATT-020: register incomplete.
  - ATT-022: not confirmed.
  - ATT-024: cancellation outcome not recorded.
- Players and families:
  - ATT-050: medical not confirmed.
  - ATT-052: parent claim needs review.
  - ATT-054: cancellation awaiting decision.
  - ATT-056: family review due.
- Development:
  - ATT-070: feedback awaiting review.
  - ATT-071: IDPs not started.
- Finance:
  - ATT-060: invoice overdue.
  - ATT-061: invoice not sent to Xero.
  - ATT-062: month not invoiced.

## 3. Schedule, sessions, venues and registers
| Feature | Route |
|---|---|
| Area hub with today, staffing notice, registers outstanding | `mgmt-schedule` |
| Sessions list (All / Active / Draft / Inactive) | `mgmt-sessions` |
| Session detail: fields, breaks, upcoming dates, coaches, players, eligibility, status with history | `mgmt-session/SES-02` |
| Create / edit wizard: weekly or selected dates, breaks, venue and capacity, coaches, review of the dates it creates | `mgmt-session-new`, `mgmt-session-edit/SES-02` |
| Calendar: day / week / month | `mgmt-calendar` |
| Session dates: every dated session, with filters | `mgmt-occurrences` |
| A single session date: confirm, cancel, postpone, reschedule (linked replacement), different venue or capacity for that date, notes, staff | `mgmt-occurrence/OCC-0035` |
| Cancellation outcome: family credit or refund, venue, coach pay; past outcomes frozen | `mgmt-occurrence-outcome/OCC-0019` |
| Eligibility rules and player exceptions | `mgmt-eligibility` |
| Venues, venue detail, site map, unavailability with the sessions it affects | `mgmt-venues`, `mgmt-venue/northgate` |
| Register: mark, notes, all present, one-off player, complete, reopen with reason, headcount for school sessions | `mgmt-register/OCC-0033` |
| Registers overview (outstanding first) | `mgmt-registers` |
| Attendance by player and by session | `mgmt-attendance`, `mgmt-attendance/PLY-0001` |

## 4. Coaches and staff
| Feature | Route |
|---|---|
| Directory with compliance, availability and cover pills, search and filters | `mgmt-coaches` |
| Coach profile: overview, sessions and roles, rates, pay, availability, documents, cover, work summaries | `mgmt-coach/tom` |
| Roles and permissions matrix, temporary role changes, former access | `mgmt-coach-roles` |
| Effective-dated rates (never edited, new rate ends the old one) | `mgmt-coach/<key>` → Rates |
| Coach pay: one pay item per coach per session, matching Finance; adjust with a reason; confirm; items sent for payment are frozen | `mgmt-allocations` |
| Weekly availability and exceptions (holiday, unavailable, different hours) | `mgmt-availability` |
| Documents: required types, states, verify / reject with reason | `mgmt-documents`, `mgmt-document/DOC-118` |
| Cover workflow: need → offered → accepted → covered, eligible coach suggestions, decline reasons, phone-call flag | `mgmt-cover`, `mgmt-cover-request/CVR-01` |
| Work summaries: finalise, query, reopen, coach confirmation | `mgmt-work-summaries`, `mgmt-work-summary/WS-901` |

## 5. Players, families and bookings
| Feature | Route |
|---|---|
| Players & Parents hub with computed figures and a Worth checking list | `mgmt-players` |
| Players list with search and filters | `mgmt-players-list` |
| Player profile, with restricted medical, support, address and emergency contacts (preview as Management / Lead / Coach) | `mgmt-player/PLY-0009` |
| Parents: verification, invites, ended links | `mgmt-parents`, `mgmt-parent/PAR-01` |
| Families: status, review due, close with reason, reopen | `mgmt-families`, `mgmt-family/FAM-01` |
| Memberships: status, pause, cancellation with notice, end, resume | `mgmt-memberships`, `mgmt-membership/MEM-113` |
| Requests with stages; detail-change old and new values restricted | `mgmt-requests` |
| Session requests (switched off by default) | `mgmt-session-requests` |
| Move players onto sessions (three steps) | `mgmt-player-migration` |
| Bookings with price, discount and refund policy as booked; cancel a line | `mgmt-bookings`, `mgmt-booking/BKG-001` |
| Commercial setup: discounts (no stacking), refund policies, packages, billing rules, terms versions | `mgmt-commercial` |
| Adjustments (credits, charges, waive) | `mgmt-adjustments` |
| History with before/after (restricted) | `mgmt-audit` |

## 6. Development, content and settings
| Feature | Route |
|---|---|
| Development hub | `mgmt-development` |
| Framework groups: order, visibility, rating switch, areas, prompts | `mgmt-framework` |
| Framework settings, colour labels, family preview | `mgmt-framework-settings` |
| Feedback review: publish, return with note, hide from family | `mgmt-feedback-review`, `mgmt-feedback-review/FBK-0002` |
| Development plans: targets, status, share with family | `mgmt-idps`, `mgmt-idps/IDP-…` |
| "IDP" label rename (for example to "Targets"), applied everywhere | `mgmt-labels` |
| Content: resources, coach support, public pages, What we offer, admin guide | `mgmt-content` |
| Communications, switched off (greyed preview); live when switched on | `mgmt-comms` |
| Organisation and branding with live preview; save and reset | `mgmt-settings` |
| Feature controls with who changed what and when | `mgmt-features` |
| Reports (attendance, registers, delivery, schools, development) | `mgmt-reports` |
| Profile and change password | `mgmt-profile` |
| Notifications and preferences | `mgmt-notifications` |

## 7. Finance
| Feature | Route |
|---|---|
| Overview: month summary (actual or including expected), cash, receivables, VAT estimate | `mgmt-finance` |
| Finance access per person (None / View / Manage) | `mgmt-fin-access` |
| Finance settings: legal name, VAT, numbering, authority, coach payment day | `mgmt-fin-settings` |
| Clients: terms, PO rules, payment days, services with active periods, billing exceptions | `mgmt-fin-clients`, `mgmt-fin-client/CLI-01` |
| Drafts from delivered sessions: problems, PO, ready, issue | `mgmt-fin-drafts`, `mgmt-fin-draft/DRF-01` |
| Invoices: Issued / frozen with no edit button; send; Xero retry; move due date; payments; credit notes; replacement | `mgmt-fin-invoices`, `mgmt-fin-invoice/INV-0011` |
| Printable invoice | `mgmt-fin-invoice-print/INV-0007` |
| Credit notes (NC-1007 partly credited by CN-001) | `mgmt-fin-credit-notes` |
| Payments, including part payments, overpayment and reversal | `mgmt-fin-payments` |
| Client credits: apply, unapply, void | `mgmt-fin-client-credits` |
| Parent money: family charges, credits used oldest first, bookings, refunds | `mgmt-fin-parent-money` |
| Integrations (Stripe, Xero; test mode, all mock) | `mgmt-fin-integrations` |
| Money out: coach payment runs, venue hire, other costs, overheads (salaries, van finance, van insurance) | `mgmt-fin-money-out` |
| Session profit: revenue, coach and venue cost and profit before overheads for each session | `mgmt-fin-ledger` |
| 30-day cash forecast with threshold | `mgmt-fin-cash` |
| Finance reports | `mgmt-fin-reports` |
| Finance history (before / after) | `mgmt-fin-audit` |

## 8. Coach hub and Parent hub
### Coach hub
Signed in as Charlie Hughes (Lead), Jack Morgan (Coach) or Ellie Shaw (Learning coach). Switch with Prototype bar → Coach role. Each coach-hub screen shows a role pill.

| Feature | Route |
|---|---|
| Home: next session, a "Needs you" list (registers, cover offers, feedback, sign-off, documents, work summary), today, your role's permissions, notices, hub tiles | `coach-home` |
| Schedule: upcoming and past, grouped by week, with role, cover and register pills | `coach-schedule` |
| Session: venue access and parking, expected players, medical and support (restricted), staff or team, notes, history | `coach-session/OCC-0033` |
| Message families: lead coaches only, and only when Communications is switched on | `coach-session/OCC-…` as Lead |
| Register: Present / Late / Absent / Excused, notes, everyone else present, one-off player, complete with who and when. Headcount for school sessions. Future dates are locked; the lead can reopen. | `coach-register/OCC-0033` |
| My players, and player profile (personal, medical, support and emergency details locked for the learning coach) | `coach-players`, `coach-player/PLY-0001` |
| Feedback: framework ratings, save draft, submit for review ("Not visible to parents until reviewed"), learning-coach sign-off by the lead | `coach-feedback/PLY-0001` |
| Development plan, using the IDP label (lead edits, coach reads, hidden from the learning coach) | `coach-idp/PLY-0001` |
| Library, support (ask the office), venues | `coach-library`, `coach-support`, `coach-venues` |
| Availability: usual week and exceptions, request cover | `coach-availability` |
| Cover: offers to accept or decline, your own requests | `coach-cover` |
| Documents: state, expiry, upload (becomes Pending verification) | `coach-documents` |
| Work summary: confirm or query; salaried and placement coaches show £0.00 with a note | `coach-work-summary` |
| Profile and notifications | `coach-profile`, `coach-notifications` |

Role differences:
- **Learning coach:** sees player names and age groups only; medical and contact details are locked. Feedback goes to the lead for sign-off. Cannot message families and is not offered cover.
- **Coach:** sees player details and writes feedback for review. Development plans are read-only.
- **Lead coach:** sees the team card and edits development plans. Signs off learning-coach feedback and can message families when Communications is on.

### Parent hub
Signed in as Sarah Whitfield (FAM-01: Alfie and Isla).

| Feature | Route |
|---|---|
| Home: child switcher, next session, current actions (medical re-confirmation, pending invite, requests, credit), tiles, family schedule, latest published feedback | `parent-home` |
| Sessions: upcoming, changes (the cancelled 17 Sep session and its £21.75 credit) and past | `parent-sessions` |
| Session: when and where, coaches, what to bring, attendance, "Can't make it?", and for a cancelled session the frozen credit | `parent-session/OCC-0019` |
| Attendance | `parent-attendance` |
| Browse and book: eligibility per child, £30 single day or £80 three-day package, sibling or member discount (never stacked), accept current terms | `parent-browse`, `parent-book/camp-oct` |
| Basket and mock checkout: family credit used oldest first, amount due, test card form; creates the booking, the charge and the terms acceptance | `parent-basket`, `parent-checkout` |
| Memberships: status legend; request a pause or a cancellation (30-day notice shown); withdraw a request | `parent-memberships`, `parent-membership/MEM-101` |
| Billing: payments (Issued / frozen, never editable), family credit, bookings, refunds, statement | `parent-billing` |
| Child profile: medical, support and emergency details visible to the parent; update via an approval request; confirm medical details | `parent-child/PLY-0001` |
| Family: parents, invite status (Daniel pending → resend), invite a parent, add a child | `parent-family` |
| Development: only published feedback and shared plans; drafts and items awaiting review stay hidden | `parent-development` |
| Requests (session requests switched off by default) | `parent-requests` |
| Policies with acceptance evidence, resources, notices (communications switched off by default), offers | `parent-policies`, `parent-resources`, `parent-notices`, `parent-offers` |
| More, profile, notifications | `parent-more`, `parent-profile`, `parent-notifications` |

## 9. Guided walkthroughs
Start these from Prototype bar → Scenario. Each walkthrough moves between screens and switches roles for you.

| Walkthrough | Steps |
|---|---|
| a. Create and issue an invoice | `mgmt-fin-drafts` → `mgmt-fin-draft/DRF-01` (PO, ready, issue) → `mgmt-fin-invoices` → `mgmt-fin-invoice/INV-0011` → `mgmt-finance` |
| b. Take a register | `coach-home` → `coach-session/OCC-0033` → `coach-register/OCC-0033` (as coach, then as learning coach) → `mgmt-register/OCC-0033` → `mgmt-registers` |
| c. Cover a holiday | `coach-availability` → `mgmt-attention` → `mgmt-cover` → `mgmt-cover-request/CVR-01` → `coach-cover` → `mgmt-occurrences` |
| d. New family joins | `pub-offer/trials` (choose Book free session) → `pub-register` → `pub-check-email` → `pub-parent-signup` → `pub-request` → `mgmt-trial-leads` → `mgmt-approvals` → `mgmt-parent-claims` → `mgmt-families` → `parent-home` |
| e. Cancel a session | `mgmt-occurrence/OCC-0042` → `mgmt-occurrence-outcome/OCC-0042` → `mgmt-occurrence-outcome/OCC-0019` → `parent-sessions` → `mgmt-fin-parent-money` |

## Language
Screen wording follows `docs/LANGUAGE-AUDIT.md`. Routes and data keys keep their precise names: for example `mgmt-occurrences` shows "Session dates" and `mgmt-allocations` shows "Coach pay".

## 10. Mock data edge cases
| Edge case | Where to see it |
|---|---|
| Coach with expired first aid (Tom Reid, 14 Sep) | `mgmt-coach/tom`, `mgmt-attention` |
| Player with unconfirmed medical state (Leo Grant) | `mgmt-player/PLY-0009`, `mgmt-attention` |
| Cancelled session with refund decision (U9/10, 17 Sep) | `mgmt-occurrence-outcome/OCC-0019` |
| Overdue invoice with a moved due date (NC-1011, £1,296.00, 16 → 26 Sep) | `mgmt-fin-invoice/INV-0011` |
| Partly credited invoice (NC-1007, CN-001) | `mgmt-fin-invoice/INV-0007` |
| Paused membership (Jack Ellis) | `mgmt-memberships` |
| A full group, shown as Join waitlist (Goalkeeper academy) | `pub-offer/academy` |
| Needs review parent match (Paul Moss claims Harry Moss) | `mgmt-parent-claims` |

## Not built
Nothing from the brief was left unbuilt. These are the deliberate limits:
- **No backend.**
  - Every change lives in memory and resets when the page reloads.
  - Card payment, email, Stripe and Xero are all mocked; the integrations page shows test mode only.
  - Logo and document uploads are placeholders that don't store a file.
- **Medical re-confirmation each term has no Needs Attention case.** Almost every player is due at the start of term, so one case per player would swamp the list. It shows instead as an action on Parent home and on each child's profile.
- **Coach questions to the office have no Needs Attention case.** Management has no screen for answering them yet, so a case would lead nowhere.
- **No "Add venue" button.** The brief didn't ask for one.
- **Josh Evans brand header:** this brand uses an image logo, so renaming the organisation in Settings shows in the page title and the preview card, not in the header.
